/**
 * Tool: list-agents
 *
 * Introspect currently running Trellis agent processes.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

import type { AgentManager } from "~/extensions/managers/agent-manager.ts";
import type { StorageAdapter } from "~/extensions/storage/types.ts";
import { formatToolResult } from "~/extensions/utils/index.ts";

const parameters = Type.Object({
  request_id: Type.Optional(Type.String({ description: "Optional request id filter" })),
});

export interface ListAgentsDetails {
  agents: Array<{
    agent_id: string;
    agent_name: string;
    role: string;
    status: string;
    request_id: string;
    parent_id?: string;
    pid?: number;
    started_at: number;
    exited_at?: number;
  }>;
}

export function registerListAgentsTool(
  pi: ExtensionAPI,
  storage: StorageAdapter,
  agentManager: AgentManager,
): void {
  pi.registerTool({
    name: "list-agents",
    label: "List Agents",
    description: "List Trellis agents across the whole agent tree (root, coordinators, and subagents).",
    parameters,
    async execute(_toolCallId, params) {
      const rows = params.request_id
        ? await storage.agents.listByRequest(params.request_id)
        : await storage.agents.list();

      const agents = rows.map((row) => {
        const live = agentManager.runningAgentProcesses.get(row.id);
        return {
          agent_id: row.id,
          agent_name: row.name,
          role: row.role,
          status: live ? "running" : row.status,
          request_id: row.request_id,
          parent_id: row.parent_id,
          pid: live?.child.pid ?? row.pid,
          started_at: row.started_at,
          exited_at: row.exited_at,
        };
      });

      const sorted = agents.slice().sort((a, b) => b.started_at - a.started_at);

      const running = sorted.filter((a) => a.status === "running");
      const completed = sorted.filter((a) => a.status === "completed");
      const failed = sorted.filter((a) => a.status === "failed");
      const stopped = sorted.filter((a) => a.status === "stopped");

      const lines: string[] = [];
      lines.push(`Total agents: ${sorted.length}`);
      if (running.length > 0) {
        lines.push(`Running: ${running.map((a) => `${a.agent_name} (${a.agent_id})`).join(", ")}`);
      }
      if (completed.length > 0) {
        lines.push(`Completed: ${completed.length}`);
      }
      if (failed.length > 0) {
        lines.push(`Failed: ${failed.length}`);
      }
      if (stopped.length > 0) {
        lines.push(`Stopped: ${stopped.length}`);
      }

      return formatToolResult<ListAgentsDetails>(lines.join("\n"), { agents: sorted });
    },
  });
}
