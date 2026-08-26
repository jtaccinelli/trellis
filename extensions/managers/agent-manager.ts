/**
 * Trellis agent manager.
 *
 * Owns the bundled agent catalog and the lifecycle of spawned child `pi`
 * processes. The domain manager, coordinator manager, and ad-hoc spawning tool
 * all create agents through this class.
 */

import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { withFileMutationQueue, type EventBus } from "@earendil-works/pi-coding-agent";
import type { Message } from "@earendil-works/pi-ai";
import { parseFrontmatter } from "@earendil-works/pi-coding-agent";

import type { Agent } from "~/extensions/storage/agents/types.ts";
import type { StorageAdapter } from "~/extensions/storage/types.ts";
import type {
  AgentDefinition,
  AgentExitInfo,
  AgentMode,
  AgentProcessHandle,
  AgentRole,
  AgentStartOptions,
  AgentUsageStats,
  EventPublisher,
} from "~/extensions/managers/types.ts";
import {
  generateAgentId,
  parseAgentSpawnCommand,
} from "~/extensions/utils/agents.ts";
import { renderLines } from "~/extensions/utils/tui.ts";

export class AgentManager {
  /** Relative directory, from the plugin entry file, that holds agent definitions. */
  private static readonly AGENT_CATALOG_SUBDIR = "agents";

  readonly extensionPath: string;
  readonly runningAgentProcesses = new Map<string, AgentProcessHandle>();
  private readonly agentCatalogDir: string;
  private readonly events?: EventBus;
  private readonly storage?: StorageAdapter;
  private readonly websocketManager?: EventPublisher;

  constructor(options: {
    extensionPath: string;
    events?: EventBus;
    storage?: StorageAdapter;
    websocketManager?: EventPublisher;
  }) {
    this.extensionPath = options.extensionPath;
    this.events = options.events;
    this.storage = options.storage;
    this.websocketManager = options.websocketManager;
    this.agentCatalogDir = path.join(
      path.dirname(this.extensionPath),
      AgentManager.AGENT_CATALOG_SUBDIR,
    );
  }

  /**
   * Crawl the bundled agent catalog directory and return all valid definitions.
   *
   * Scans for `*.md` files, parses frontmatter, and returns successfully
   * loaded definitions. Missing or unreadable directories are treated as empty
   * catalogs.
   */
  crawlAgentDefinitions(): AgentDefinition[] {
    const agents: AgentDefinition[] = [];
    if (!fs.existsSync(this.agentCatalogDir)) return agents;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(this.agentCatalogDir, { withFileTypes: true });
    } catch {
      return agents;
    }

    for (const entry of entries) {
      if (!entry.name.endsWith(".md")) continue;
      if (!entry.isFile() && !entry.isSymbolicLink()) continue;

      const filePath = path.join(this.agentCatalogDir, entry.name);
      const agent = this.loadAgentDefinition(filePath);
      if (agent) agents.push(agent);
    }

    return agents;
  }

  /**
   * Load a single agent definition from a markdown file.
   *
   * Parses frontmatter metadata and uses the file body as the system prompt.
   * Returns `undefined` if the file cannot be read or lacks required metadata.
   */
  private loadAgentDefinition(filePath: string): AgentDefinition | undefined {
    let content: string;
    try {
      content = fs.readFileSync(filePath, "utf-8");
    } catch {
      return undefined;
    }

    const { frontmatter, body } = parseFrontmatter<AgentFrontmatter>(content);

    if (
      typeof frontmatter.name !== "string" ||
      typeof frontmatter.description !== "string"
    ) {
      return undefined;
    }

    const tools =
      typeof frontmatter.tools === "string"
        ? frontmatter.tools.split(",")
        : Array.isArray(frontmatter.tools)
          ? frontmatter.tools
          : [];

    const mode: AgentMode | undefined =
      frontmatter.mode === "rpc" || frontmatter.mode === "json"
        ? frontmatter.mode
        : undefined;

    return {
      name: frontmatter.name,
      description: frontmatter.description,
      mode,
      tools: tools
        .filter((tool): tool is string => typeof tool === "string")
        .map((tool) => tool.trim())
        .filter(Boolean),
      model:
        typeof frontmatter.model === "string" ? frontmatter.model : undefined,
      thinking:
        typeof frontmatter.thinking === "string"
          ? frontmatter.thinking
          : undefined,
      systemPrompt: body,
      filePath,
    };
  }

  getAgentDefinition(name: string): AgentDefinition | undefined {
    return this.crawlAgentDefinitions().find((a) => a.name === name);
  }

  /**
   * Prepare the agent prompt for launch and append the relevant CLI arguments.
   *
   * Mutates `args` in place, appending `--append-system-prompt` plus the task
   * argument. Returns the temporary prompt directory and file path so the
   * caller can clean them up after the child process exits.
   */
  private async prepareAgentPrompt(
    agent: AgentDefinition,
    options: AgentStartOptions,
    agentId: string,
    args: string[],
  ): Promise<{ tmpPromptDir: string; tmpPromptPath: string }> {
    const mode = options.mode ?? agent.mode ?? "json";
    const fullPrompt = renderLines(
      agent.systemPrompt.trim(),
      "",
      "---",
      "### Runtime context",
      `- Trellis agent id: ${agentId}`,
      `- Role: ${options.role}`,
      `- Request id: ${options.requestId}`,
      options.parentId && `- Parent agent id: ${options.parentId}`,
      options.domainId && `- Domain id: ${options.domainId}`,
      options.queueItemId && `- Queue item id: ${options.queueItemId}`,
      "",
      "Do not reveal these identifiers to the user unless asked.",
    ).join("\n");

    const tmpPromptDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "trellis-agent-"),
    );
    const safeName = agent.name.replace(/[^\w.-]+/g, "_");
    const tmpPromptPath = path.join(tmpPromptDir, `prompt-${safeName}.md`);
    await withFileMutationQueue(tmpPromptPath, async () => {
      await fs.promises.writeFile(tmpPromptPath, fullPrompt, {
        encoding: "utf-8",
        mode: 0o600,
      });
    });

    args.push("--append-system-prompt", tmpPromptPath);

    // In JSON mode, the task is passed as a CLI argument for a single turn.
    // In RPC mode, the task is sent as the first prompt command over stdin
    // after the process starts, so the process stays alive.
    if (mode !== "rpc") {
      args.push(options.task);
    }

    return { tmpPromptDir, tmpPromptPath };
  }

  /**
   * Build the base CLI argument list for spawning an agent.
   *
   * Adds runtime flags for model, thinking level, tools, and the extension
   * entry path. Does not include the prompt file or task argument, which are
   * appended later by `prepareAgentPrompt`.
   */
  private prepareAgentFlags(
    agent: AgentDefinition,
    options: AgentStartOptions,
    _agentId: string,
  ): string[] {
    const mode = options.mode ?? agent.mode ?? "json";
    const args = ["--mode", mode, "-p", "--no-session"];

    const model = agent.model ?? options.model;
    if (model) args.push("--model", model);

    const thinkingLevel = options.thinkingLevel ?? agent.thinking;
    if (thinkingLevel) args.push("--thinking", thinkingLevel);

    if (agent.tools && agent.tools.length > 0) {
      args.push("--tools", agent.tools.join(","));
    }

    args.push("-e", this.extensionPath);

    return args;
  }

  /**
   * Build the environment object for a spawned agent.
   *
   * Carries the parent process environment plus Trellis runtime identifiers.
   */
  private prepareAgentEnv(
    agentId: string,
    agentName: string,
    options: AgentStartOptions,
  ): NodeJS.ProcessEnv {
    return {
      ...process.env,
      TRELLIS_AGENT_ID: agentId,
      TRELLIS_AGENT_NAME: agentName,
      TRELLIS_ROLE: options.role,
      TRELLIS_REQUEST_ID: options.requestId,
      ...(options.parentId ? { TRELLIS_PARENT_ID: options.parentId } : {}),
      ...(options.domainId ? { TRELLIS_DOMAIN_ID: options.domainId } : {}),
      ...(options.queueItemId
        ? { TRELLIS_QUEUE_ITEM_ID: options.queueItemId }
        : {}),
      ...(options.mailboxDir
        ? { TRELLIS_MAILBOX_DIR: options.mailboxDir }
        : {}),
      ...(process.env.TRELLIS_WS_URL ? { TRELLIS_WS_URL: process.env.TRELLIS_WS_URL } : {}),
      ...(process.env.TRELLIS_WS_TOKEN ? { TRELLIS_WS_TOKEN: process.env.TRELLIS_WS_TOKEN } : {}),
    };
  }

  async startAgentProcess(options: AgentStartOptions): Promise<AgentProcessHandle> {
    const agent = this.getAgentDefinition(options.agentName);

    if (!agent) {
      const available =
        this.crawlAgentDefinitions()
          .map((a) => a.name)
          .join(", ") || "none";
      throw new Error(
        `Unknown agent "${options.agentName}". Available: ${available}`,
      );
    }

    const agentId = options.agentId ?? generateAgentId();
    const mode = options.mode ?? agent.mode ?? "json";
    const args = this.prepareAgentFlags(agent, options, agentId);
    const env = this.prepareAgentEnv(agentId, agent.name, options);

    const { tmpPromptDir, tmpPromptPath } = await this.prepareAgentPrompt(
      agent,
      options,
      agentId,
      args,
    );

    const invocation = parseAgentSpawnCommand(args);
    const child = spawn(invocation.command, invocation.args, {
      cwd: options.cwd ?? process.cwd(),
      shell: false,
      stdio: mode === "rpc" ? ["pipe", "pipe", "pipe"] : ["ignore", "pipe", "pipe"],
      env,
    });

    if (mode === "rpc" && child.stdin) {
      const initialPrompt = JSON.stringify({ type: "prompt", message: options.task });
      child.stdin.write(initialPrompt + "\n");
    }

    const sessionStart = process.env.TRELLIS_SESSION_START ?? String(Date.now());
    const logDir = path.join(process.cwd(), ".pi", "trellis", "logs", sessionStart);
    fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, `${agentId}.jsonl`);

    const writeLog = (entry: { stream: "stdout" | "stderr"; line: string; event?: unknown }) => {
      try {
        const line = JSON.stringify({ timestamp: Date.now(), ...entry }) + "\n";
        fs.appendFileSync(logPath, line, "utf-8");
      } catch {
        // Log write is best-effort.
      }
    };

    const agentRecord = {
      id: agentId,
      parent_id: options.parentId,
      request_id: options.requestId,
      role: options.role,
      name: agent.name,
      status: "running" as const,
      pid: child.pid ?? undefined,
      log_path: logPath,
      task_preview: options.task.slice(0, 500),
      started_at: Date.now(),
      coordinator_id: undefined as string | undefined,
      domain_id: options.domainId,
      queue_item_id: options.queueItemId,
    };
    this.storage?.agents.create(agentRecord).catch(() => {
      // Storage is best-effort for observability; spawn should not fail.
    });

    const usage: AgentUsageStats = {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      cost: 0,
      contextTokens: 0,
      turns: 0,
    };

    let finalResultText = "";
    let stopReason: string | undefined;
    let errorMessage: string | undefined;

    const promise = new Promise<AgentExitInfo>((resolve) => {
      const processLine = (line: string) => {
        if (!line.trim()) return;
        let event: unknown;
        try {
          event = JSON.parse(line);
        } catch {
          return;
        }

        if (typeof event !== "object" || event === null) return;
        const { type, message } = event as { type?: string; message?: Message };

        if (type === "message_end" && message) {
          if (message.role === "assistant") {
            usage.turns++;
            if (message.usage) {
              usage.input += message.usage.input || 0;
              usage.output += message.usage.output || 0;
              usage.cacheRead += message.usage.cacheRead || 0;
              usage.cacheWrite += message.usage.cacheWrite || 0;
              usage.cost += message.usage.cost?.total || 0;
              usage.contextTokens =
                message.usage.totalTokens ?? usage.contextTokens;
            }
            stopReason = message.stopReason;
            errorMessage = message.errorMessage;

            for (const part of message.content) {
              if (part.type === "text") {
                finalResultText = part.text;
              }
            }
          }
        }
      };

      writeLog({ stream: "stdout", line: "", event: { type: "agent_spawned", agentId, role: options.role, requestId: options.requestId } });

      let stdout = "";
      child.stdout?.on("data", (data) => {
        const chunk = data.toString();
        stdout += chunk;
        const lines = stdout.split("\n");
        stdout = lines.pop() ?? "";
        for (const line of lines) {
          processLine(line);
          let parsedEvent: unknown;
          try {
            parsedEvent = JSON.parse(line);
          } catch {
            parsedEvent = undefined;
          }
          writeLog({ stream: "stdout", line, event: parsedEvent });
        }
      });

      let stderr = "";
      child.stderr?.on("data", (data) => {
        const chunk = data.toString();
        stderr += chunk;
        for (const line of chunk.split("\n")) {
          if (line.trim()) writeLog({ stream: "stderr", line });
        }
      });

      const cleanup = () => {
        this.runningAgentProcesses.delete(agentId);
        try {
          fs.unlinkSync(tmpPromptPath);
          fs.rmdirSync(tmpPromptDir);
        } catch {
          // Ignore cleanup errors.
        }
      };

      const exitStatusFromCode = (code: number): Agent["status"] =>
        code === 0 ? "completed" : "failed";

      const persistExit = async (info: AgentExitInfo, status: Agent["status"]) => {
        try {
          const existing = await this.storage?.agents.get(agentId);
          if (existing) {
            await this.storage?.agents.update({
              ...existing,
              status,
              exited_at: Date.now(),
              exit_code: info.exitCode,
              result_text: info.resultText,
            });
          }
        } catch {
          // Storage is best-effort for observability.
        }
      };

      const notifyExit = (info: AgentExitInfo) => {
        const payload = {
          agentId,
          agentName: agent.name,
          role: options.role,
          requestId: options.requestId,
          ...info,
        };
        this.events?.emit("trellis:agent_closed", payload);
        this.websocketManager?.publish("trellis:agent_closed", payload, { requestId: options.requestId });
      };

      child.on("close", (code) => {
        if (stdout.trim()) processLine(stdout);
        const info: AgentExitInfo = {
          exitCode: code ?? 0,
          stopReason,
          errorMessage,
          resultText: finalResultText || stderr,
          usage,
        };
        const status = exitStatusFromCode(info.exitCode);
        cleanup();
        persistExit(info, status);
        writeLog({ stream: "stdout", line: "", event: { type: "agent_exited", exitCode: info.exitCode, stopReason: info.stopReason, errorMessage: info.errorMessage, resultText: info.resultText } });
        notifyExit(info);
        resolve(info);
      });

      child.on("error", (error) => {
        const info: AgentExitInfo = {
          exitCode: 1,
          stopReason,
          errorMessage: error.message || errorMessage,
          resultText: stderr,
          usage,
        };
        cleanup();
        persistExit(info, "failed");
        writeLog({ stream: "stdout", line: "", event: { type: "agent_error", error: error.message } });
        notifyExit(info);
        resolve(info);
      });
    });

    const handle: AgentProcessHandle = {
      agentId,
      agentName: agent.name,
      role: options.role,
      mode,
      startedAt: Date.now(),
      child,
      promise,
      logPath,
    };

    this.runningAgentProcesses.set(agentId, handle);

    this.websocketManager?.publish(
      "trellis:agent_spawned",
      {
        agentId,
        agentName: agent.name,
        role: options.role,
        requestId: options.requestId,
        parentId: options.parentId,
        mode,
      },
      { requestId: options.requestId },
    );

    return handle;
  }

  /**
   * Terminate a running agent by id. Returns true if the agent was known and
   * a stop signal was sent. The agent's exit promise will settle normally.
   */
  stopAgentProcess(
    agentId: string,
    signal: NodeJS.Signals = "SIGTERM",
  ): boolean {
    const handle = this.runningAgentProcesses.get(agentId);
    if (!handle) return false;
    handle.child.kill(signal);
    return true;
  }

  /**
   * Send an RPC command to a running persistent agent.
   *
   * Returns true if the agent is known, running in RPC mode, and the command
   * was written to its stdin. Returns false otherwise.
   */
  sendRpcCommand(agentId: string, command: Record<string, unknown>): boolean {
    const handle = this.runningAgentProcesses.get(agentId);
    if (!handle || handle.mode !== "rpc") return false;
    if (!handle.child.stdin) return false;

    try {
      handle.child.stdin.write(JSON.stringify(command) + "\n");
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Frontmatter keys expected inside a bundled agent markdown file.
 */
interface AgentFrontmatter extends Record<string, unknown> {
  name?: unknown;
  description?: unknown;
  mode?: unknown;
  tools?: unknown;
  model?: unknown;
  thinking?: unknown;
}
