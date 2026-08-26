/**
 * Trellis agent manager.
 *
 * Owns the bundled agent catalog and the lifecycle of spawned child `pi`
 * processes. The domain manager, coordinator manager, and ad-hoc spawning tool
 * all create agents through this class.
 */

import { spawn, type StdioOptions } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { withFileMutationQueue } from "@earendil-works/pi-coding-agent";
import { parseFrontmatter } from "@earendil-works/pi-coding-agent";

import type { StorageAdapter } from "~/extensions/storage/types.ts";
import type {
  AgentDefinition,
  AgentExitInfo,
  AgentMode,
  AgentProcessHandle,
  AgentStartOptions,
} from "~/extensions/managers/types.ts";

import {
  exitStatusFromCode,
  generateAgentId,
  parseAgentSpawnCommand,
  processAgentStdoutLine,
} from "~/extensions/utils/agents.ts";
import type { AgentOutputState } from "~/extensions/utils/agents.ts";
import { renderLines } from "~/extensions/utils/tui.ts";

interface AgentLaunchConfig {
  agent: AgentDefinition;
  options: AgentStartOptions;
  agentId: string;
  invocation: { command: string; args: string[] };
  env: NodeJS.ProcessEnv;
  tmpPromptDir: string;
  tmpPromptPath: string;
  mode: AgentMode;
  stdio: StdioOptions;
  initialStdinLine?: string;
}

export class AgentManager {
  /** Relative directory, from the plugin entry file, that holds agent definitions. */
  private static readonly AGENT_CATALOG_SUBDIR = "agents";

  readonly extensionPath: string;
  readonly runningAgentProcesses = new Map<string, AgentProcessHandle>();
  private readonly agentCatalogDir: string;
  private readonly storage?: StorageAdapter;

  constructor(options: { extensionPath: string; storage?: StorageAdapter }) {
    this.extensionPath = options.extensionPath;
    this.storage = options.storage;
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
    mode: AgentMode,
  ): NodeJS.ProcessEnv {
    return {
      ...process.env,
      TRELLIS_AGENT_ID: agentId,
      TRELLIS_AGENT_NAME: agentName,
      TRELLIS_ROLE: options.role,
      TRELLIS_AGENT_MODE: mode,
      TRELLIS_REQUEST_ID: options.requestId,
      ...(options.parentId ? { TRELLIS_PARENT_ID: options.parentId } : {}),
      ...(options.domainId ? { TRELLIS_DOMAIN_ID: options.domainId } : {}),
      ...(options.queueItemId
        ? { TRELLIS_QUEUE_ITEM_ID: options.queueItemId }
        : {}),
      ...(options.mailboxDir
        ? { TRELLIS_MAILBOX_DIR: options.mailboxDir }
        : {}),
      ...(process.env.TRELLIS_WS_URL
        ? { TRELLIS_WS_URL: process.env.TRELLIS_WS_URL }
        : {}),
      ...(process.env.TRELLIS_WS_TOKEN
        ? { TRELLIS_WS_TOKEN: process.env.TRELLIS_WS_TOKEN }
        : {}),
    };
  }

  async prepareAgentConfig(
    options: AgentStartOptions,
  ): Promise<AgentLaunchConfig> {
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

    const mode = options.mode ?? agent.mode ?? "json";
    const isRpc = mode === "rpc";
    const agentId = options.agentId ?? generateAgentId();

    const stdio: StdioOptions = isRpc
      ? ["pipe", "pipe", "pipe"]
      : ["ignore", "pipe", "pipe"];
    const args = this.prepareAgentFlags(agent, options, agentId);
    const env = this.prepareAgentEnv(agentId, agent.name, options, mode);

    const { tmpPromptDir, tmpPromptPath } = await this.prepareAgentPrompt(
      agent,
      options,
      agentId,
      args,
    );

    const invocation = parseAgentSpawnCommand(args);

    const config: AgentLaunchConfig = {
      agent,
      options,
      agentId,
      invocation,
      stdio,
      env,
      tmpPromptDir,
      tmpPromptPath,
      mode,
      ...(isRpc
        ? {
            initialStdinLine: JSON.stringify({
              type: "prompt",
              message: options.task,
            }),
          }
        : {}),
    };

    return config;
  }

  async startAgentProcess(
    _options: AgentStartOptions,
  ): Promise<AgentProcessHandle> {
    const {
      agent,
      options,
      agentId,
      invocation,
      stdio,
      env,
      tmpPromptDir,
      tmpPromptPath,
      mode,
      initialStdinLine,
    } = await this.prepareAgentConfig(_options);

    const child = spawn(invocation.command, invocation.args, {
      cwd: options.cwd ?? process.cwd(),
      shell: false,
      stdio,
      env,
    });

    if (initialStdinLine && child.stdin) {
      child.stdin.write(initialStdinLine + "\n");
    }

    this.storage?.agents
      .create({
        id: agentId,
        parent_id: options.parentId,
        request_id: options.requestId,
        role: options.role,
        name: agent.name,
        status: "running" as const,
        pid: child.pid ?? undefined,
        task_preview: options.task.slice(0, 500),
        started_at: Date.now(),
        coordinator_id: undefined as string | undefined,
        domain_id: options.domainId,
        queue_item_id: options.queueItemId,
      })
      .catch(() => {
        // Storage is best-effort for observability; spawn should not fail.
      });

    const state: AgentOutputState = {
      usage: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        cost: 0,
        contextTokens: 0,
        turns: 0,
      },
      finalResultText: "",
      stopReason: undefined,
      errorMessage: undefined,
    };

    const promise = new Promise<AgentExitInfo>((resolve) => {
      let stdout = "";
      child.stdout?.on("data", (data) => {
        const chunk = data.toString();
        stdout += chunk;
        const lines = stdout.split("\n");
        stdout = lines.pop() ?? "";
        for (const line of lines) {
          processAgentStdoutLine(line, state);
        }
      });

      let stderr = "";
      child.stderr?.on("data", (data) => {
        const chunk = data.toString();
        stderr += chunk;
      });

      child.on("close", async (code) => {
        if (stdout.trim()) processAgentStdoutLine(stdout, state);
        const info: AgentExitInfo = {
          exitCode: code ?? 0,
          stopReason: state.stopReason,
          errorMessage: state.errorMessage,
          resultText: state.finalResultText || stderr,
          usage: state.usage,
        };
        try {
          await this.handleExit({
            agentId,
            info,
            tmpPromptDir,
            tmpPromptPath,
          });
        } catch {
          // Exit handling is best-effort; always resolve the spawn promise.
        }
        resolve(info);
      });

      child.on("error", async (error) => {
        const info: AgentExitInfo = {
          exitCode: 1,
          stopReason: state.stopReason,
          errorMessage: error.message || state.errorMessage,
          resultText: stderr,
          usage: state.usage,
        };
        try {
          await this.handleExit({
            agentId,
            info,
            tmpPromptDir,
            tmpPromptPath,
          });
        } catch {
          // Exit handling is best-effort; always resolve the spawn promise.
        }
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
    };

    this.runningAgentProcesses.set(agentId, handle);

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
   * Shared exit handler invoked from child `close` and `error` events.
   *
   * Cleans up the temporary prompt files, removes the agent from the local
   * process map, updates the durable registry, and emits both the local
   * `trellis:agent_closed` event and the WebSocket fan-out.
   */
  private async handleExit(context: {
    agentId: string;
    info: AgentExitInfo;
    tmpPromptDir: string;
    tmpPromptPath: string;
  }): Promise<void> {
    const { agentId, info, tmpPromptDir, tmpPromptPath } = context;
    const status = exitStatusFromCode(info.exitCode);

    this.runningAgentProcesses.delete(agentId);

    try {
      fs.unlinkSync(tmpPromptPath);
      fs.rmdirSync(tmpPromptDir);
    } catch {
      // Ignore cleanup errors.
    }

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
