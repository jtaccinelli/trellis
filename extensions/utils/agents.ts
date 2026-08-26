import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import type { Message } from "@earendil-works/pi-ai";

import type { Agent } from "~/extensions/storage/agents/types.ts";
import type { AgentUsageStats } from "~/extensions/managers/types.ts";

/**
 * Generate a unique runtime identifier for a Trellis agent.
 *
 * Produces a stable-looking `trellis:<uuid>` string used as the child process
 * id and passed to the agent via `TRELLIS_AGENT_ID`.
 */
export function generateAgentId(): string {
  return `trellis:${randomUUID()}`;
}

/**
 * Resolve the command and arguments used to spawn a child `pi` process.
 *
 * When the current script is a real file, reuse it so development builds work.
 * When running under a generic runtime (`node` or `bun`) without a stable
 * script path, fall back to the `pi` command on `PATH`.
 */
export function parseAgentSpawnCommand(args: string[]): { command: string; args: string[] } {
  const currentScript = process.argv[1];
  const isBunVirtualScript = currentScript?.startsWith("/$bunfs/root/");
  if (currentScript && !isBunVirtualScript && fs.existsSync(currentScript)) {
    return { command: process.execPath, args: [currentScript, ...args] };
  }

  const execName = path.basename(process.execPath).toLowerCase();
  const isGenericRuntime = /^(node|bun)(\.exe)?$/.test(execName);
  if (!isGenericRuntime) {
    return { command: process.execPath, args };
  }

  return { command: "pi", args };
}

/**
 * Convert a child exit code into the stored agent status.
 */
export function exitStatusFromCode(code: number): Agent["status"] {
  return code === 0 ? "completed" : "failed";
}

/**
 * Mutable state tracked while reading a child agent's stdout.
 *
 * Updated incrementally as `message_end` JSON events arrive.
 */
export interface AgentOutputState {
  usage: AgentUsageStats;
  finalResultText: string;
  stopReason?: string;
  errorMessage?: string;
}

/**
 * Parse a single line of child stdout and update the shared output state.
 *
 * Looks for Pi JSON events of type `message_end` and, when the message is from
 * the assistant, accumulates usage stats and captures the final text result.
 * Empty or malformed lines are ignored.
 */
export function processAgentStdoutLine(
  line: string,
  state: AgentOutputState,
): void {
  if (!line.trim()) return;

  let event: unknown;
  try {
    event = JSON.parse(line);
  } catch {
    return;
  }

  if (typeof event !== "object" || event === null) return;
  const { type, message } = event as { type?: string; message?: Message };

  if (type !== "message_end" || !message) return;
  if (message.role !== "assistant") return;

  state.usage.turns++;
  if (message.usage) {
    state.usage.input += message.usage.input || 0;
    state.usage.output += message.usage.output || 0;
    state.usage.cacheRead += message.usage.cacheRead || 0;
    state.usage.cacheWrite += message.usage.cacheWrite || 0;
    state.usage.cost += message.usage.cost?.total || 0;
    state.usage.contextTokens =
      message.usage.totalTokens ?? state.usage.contextTokens;
  }

  state.stopReason = message.stopReason;
  state.errorMessage = message.errorMessage;

  for (const part of message.content) {
    if (part.type === "text") {
      state.finalResultText = part.text;
    }
  }
}
