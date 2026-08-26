/**
 * Tool: stop-agent
 *
 * Signal a running agent to stop. Used to cancel background coordinators or
 * stuck domain agents.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

import type { AgentManager } from "~/extensions/managers/agent-manager.ts";
import { formatToolResult } from "~/extensions/utils/index.ts";

const parameters = Type.Object({
  agent_id: Type.String({ description: "Agent id to stop" }),
  signal: Type.Optional(Type.String({ default: "SIGTERM", description: "Signal to send (e.g., SIGTERM, SIGKILL)" })),
});

export interface StopAgentDetails {
  agent_id: string;
  signal: string;
  sent: boolean;
}

export function registerStopAgentTool(pi: ExtensionAPI, agentManager: AgentManager): void {
  pi.registerTool({
    name: "stop-agent",
    label: "Stop Agent",
    description: "Send a termination signal to a running Trellis agent.",
    parameters,
    async execute(_toolCallId, params) {
      const signal = (params.signal as NodeJS.Signals) ?? "SIGTERM";
      const knownSignals: NodeJS.Signals[] = ["SIGTERM", "SIGKILL", "SIGINT", "SIGHUP"];
      if (!knownSignals.includes(signal)) {
        throw new Error(`Unsupported signal "${signal}".`);
      }

      const sent = agentManager.stopAgentProcess(params.agent_id, signal);

      return formatToolResult<StopAgentDetails>(
        sent
          ? `Sent ${signal} to agent "${params.agent_id}".`
          : `Agent "${params.agent_id}" is not running or is not managed by this extension.`,
        { agent_id: params.agent_id, signal, sent },
      );
    },
  });
}
