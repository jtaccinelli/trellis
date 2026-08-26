/**
 * Trellis agent event manager.
 *
 * Runs inside every agent-mode Trellis process. The child agent itself is the
 * source of truth for its own lifecycle events:
 *
 *   - `trellis:agent_spawned` is published when the Pi session starts.
 *   - `trellis:agent_settled` is published when the agent comes to rest.
 *   - `trellis:agent_closed` is published when the agent is about to exit.
 *
 * Publishing from the child lets the spawner and root verify that the
 * WebSocket event bus is actually working end-to-end.
 *
 * Domain and background agents are one-shot JSON workers: after publishing
 * settled+closed they close their WebSocket connection and exit. Coordinator
 * agents are persistent RPC workers and publish settled between prompts while
 * staying alive.
 */

import type {
  ExtensionAPI,
  MessageEndEvent,
} from "@earendil-works/pi-coding-agent";

import { WebSocketClientManager } from "~/extensions/managers/websocket-client-manager.ts";
import { extractAssistantText } from "~/extensions/utils/agents.ts";
import type { TrellisAgentDetails } from "~/extensions/utils/events.ts";
import {
  TRELLIS_AGENT_CLOSED,
  TRELLIS_AGENT_SETTLED,
  TRELLIS_AGENT_SPAWNED,
  type TrellisAgentClosedEvent,
  type TrellisAgentSettledEvent,
} from "~/extensions/utils/events.ts";

export interface AgentEventManagerOptions {
  pi: ExtensionAPI;
  websocketManager: WebSocketClientManager;
  exit?: (code: number) => void;
}

export class AgentEventManager {
  private readonly pi: ExtensionAPI;
  private readonly websocketManager: WebSocketClientManager;
  private readonly exit: (code: number) => void;
  private readonly agent: TrellisAgentDetails;
  private finalResultText: string | undefined;

  constructor(options: AgentEventManagerOptions) {
    this.pi = options.pi;
    this.websocketManager = options.websocketManager;
    this.exit = options.exit ?? ((code: number) => process.exit(code));
    const id = process.env.TRELLIS_AGENT_ID ?? "trellis:unknown";
    this.agent = {
      id,
      name: process.env.TRELLIS_AGENT_NAME ?? id,
      role: process.env.TRELLIS_ROLE ?? "background",
      mode:
        (process.env.TRELLIS_AGENT_MODE as TrellisAgentDetails["mode"]) ??
        "json",
      requestId: process.env.TRELLIS_REQUEST_ID ?? "",
      parentId: process.env.TRELLIS_PARENT_ID ?? "trellis:root",
    };
  }

  /** Subscribe to Pi lifecycle events and announce when this agent settles. */
  mountEventListeners(): void {
    this.pi.on("session_start", () => {
      const payload = this.buildBasePayload();
      this.publishLifecycleEvent(TRELLIS_AGENT_SPAWNED, payload);
    });

    this.pi.on("message_end", (event: MessageEndEvent) => {
      const text = extractAssistantText(event.message);
      if (text == undefined) return;
      this.finalResultText = text;
    });

    this.pi.on("agent_settled", () => {
      const payload = this.buildSettledPayload();
      this.publishLifecycleEvent(TRELLIS_AGENT_SETTLED, payload);

      // JSON mode agents (domain/background workers) are one-shot: after they
      // report their final result they disconnect and exit. RPC mode agents
      // (coordinators) settle between prompts but stay alive.
      if (this.agent.mode !== "rpc") {
        this.handleExit(0);
      }
    });

    process.on("SIGTERM", () => this.handleExit(0, "signal"));
    process.on("SIGINT", () => this.handleExit(0, "signal"));
  }

  private publishLifecycleEvent(topic: string, payload: unknown): void {
    const targets = new Set<string>([this.agent.parentId ?? "trellis:root"]);
    if (this.agent.parentId !== "trellis:root") targets.add("trellis:root");

    for (const target of targets) {
      this.websocketManager.publish(topic, payload, { target });
    }
  }

  private handleExit(exitCode: number, stopReason?: string): void {
    const payload = this.buildClosedPayload(exitCode, stopReason);
    this.publishLifecycleEvent(TRELLIS_AGENT_CLOSED, payload);

    // Give the WebSocket send a moment to leave the process before we tear
    // down the connection and exit.
    setTimeout(() => {
      this.websocketManager.closeConnection();
      this.exit(exitCode);
    }, 250);
  }

  private buildBasePayload() {
    return { agent: this.agent };
  }

  private buildSettledPayload(): TrellisAgentSettledEvent {
    return {
      ...this.buildBasePayload(),
      timestamp: Date.now(),
      resultText: this.finalResultText,
    };
  }

  private buildClosedPayload(
    exitCode: number,
    stopReason?: string,
  ): TrellisAgentClosedEvent {
    return {
      ...this.buildBasePayload(),
      exitCode,
      stopReason,
      resultText: this.finalResultText,
    };
  }
}
