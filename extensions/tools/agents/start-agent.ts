/**
 * Tool: start-agent
 *
 * Start a background subagent from inside another agent. Returns the new agent
 * id immediately so the caller can continue.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

import type { AgentManager } from "~/extensions/managers/agent-manager.ts";
import type { AgentRole } from "~/extensions/managers/types.ts";
import { formatToolResult } from "~/extensions/utils/index.ts";

const parameters = Type.Object({
  agent_name: Type.String({ description: "Bundled agent name to start" }),
  task: Type.String({ minLength: 1, description: "Task prompt for the new agent" }),
  role: Type.String({ description: "Trellis role: coordinator, domain, or background" }),
  request_id: Type.String({ description: "Request id the started agent belongs to" }),
  domain_id: Type.Optional(Type.String({ description: "Domain id when role is domain" })),
  model: Type.Optional(Type.String({ description: "Override the inherited model" })),
  thinking_level: Type.Optional(Type.String({ description: "Override the inherited thinking level" })),
});

export interface StartAgentDetails {
  agent_id: string;
  role: string;
  request_id: string;
}

export function registerStartAgentTool(pi: ExtensionAPI, agentManager: AgentManager): void {
  pi.registerTool({
    name: "start-agent",
    label: "Start Agent",
    description: "Start a child coordinator or background agent from the bundled catalog.",
    parameters,
    async execute(_toolCallId, params) {
      const parentId = process.env.TRELLIS_AGENT_ID ?? "trellis:root";
      const handle = await agentManager.startAgentProcess({
        agentName: params.agent_name,
        role: params.role as AgentRole,
        task: params.task,
        requestId: params.request_id,
        parentId,
        domainId: params.domain_id,
        model: params.model,
        thinkingLevel: params.thinking_level,
      });

      // Detach the promise so the caller is not blocked on agent completion.
      handle.promise.catch(() => {
        // Errors are captured in the agent's result payload; the caller may
        // inspect them via the queue or messages if needed.
      });

      return formatToolResult<StartAgentDetails>(
        `Started "${params.agent_name}" as agent "${handle.agentId}".`,
        {
          agent_id: handle.agentId,
          role: params.role,
          request_id: params.request_id,
        },
      );
    },
  });
}
