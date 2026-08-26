/**
 * Trellis WebSocket client manager.
 *
 * Runs in agent pi processes. Connects to the root WebSocket server and
 * forwards published events to it. Events received from the root are emitted
 * locally on the process's `pi.events` bus.
 */

import { WebSocket, type RawData } from "ws";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import type {
  EventPublisher,
  PublishOptions,
  WebSocketClientManagerOptions,
  WebsocketMessage,
} from "~/extensions/managers/types.ts";

export class WebSocketClientManager implements EventPublisher {
  readonly pi: ExtensionAPI;
  private token: string;

  private client?: WebSocket;
  private clientReady = false;
  private url?: string;
  private pendingMessages: WebsocketMessage[] = [];
  private reconnectionTimer?: ReturnType<typeof setTimeout>;

  constructor(options: WebSocketClientManagerOptions) {
    this.pi = options.pi;
    this.token = options.token ?? "";
  }

  /** Open a connection to the root WebSocket server. */
  async openConnection(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.url = url;

      const socket = new WebSocket(url);
      this.client = socket;

      socket.once("open", () => {
        this.clientReady = true;
        this.sendMessage({
          type: "register",
          agentId: process.env.TRELLIS_AGENT_ID ?? "trellis:unknown",
          role: process.env.TRELLIS_ROLE ?? "background",
          name:
            process.env.TRELLIS_AGENT_NAME ??
            process.env.TRELLIS_AGENT_ID ??
            "unknown",
          requestId: process.env.TRELLIS_REQUEST_ID ?? "",
          parentId: process.env.TRELLIS_PARENT_ID,
          token: this.token,
        });
        resolve();
        this.sendPendingMessages();
      });

      socket.on("message", (raw) => this.handleMessage(raw));
      socket.on("close", () => this.handleClose(url));
      socket.on("error", (err) => {
        if (!this.clientReady) reject(err);
      });
    });
  }

  /** Close the server connection and cancel any pending reconnect. */
  closeConnection(): void {
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = undefined;
    }
    this.client?.close();
  }

  /**
   * Publish a transient event to the root server.
   * The server routes the event to interested peers by target, requestId,
   * broadcast flag, or topic subscription.
   */
  publish(topic: string, payload: unknown, options?: PublishOptions): void {
    this.sendMessage({
      type: "publish",
      topic,
      payload,
      target: options?.target,
      requestId: options?.requestId,
      broadcast: options?.broadcast,
    });
  }

  /** Subscribe to an untargeted topic so the server fans it out efficiently. */
  subscribe(topic: string): void {
    this.sendMessage({ type: "subscribe", topic });
  }

  unsubscribe(topic: string): void {
    this.sendMessage({ type: "unsubscribe", topic });
  }

  // ─── Message handling ─────────────────────────────────────────────────────

  private handleMessage(raw: RawData): void {
    try {
      const message = JSON.parse(raw.toString()) as WebsocketMessage;
      switch (message.type) {
        case "event":
          this.pi.events.emit(message.topic, message.payload);
          break;
        case "register_ack":
          // Optionally log/debug.
          break;
        case "pong":
          // keepalive
          break;
        default:
          break;
      }
    } catch {
      // ignore malformed
    }
  }

  private handleClose(url: string): void {
    this.clientReady = false;
    this.scheduleReconnect(url);
  }

  private scheduleReconnect(url: string): void {
    if (this.reconnectionTimer) return;
    this.reconnectionTimer = setTimeout(() => {
      this.reconnectionTimer = undefined;
      this.openConnection(url).catch(() => {
        this.scheduleReconnect(url);
      });
    }, 2000);
  }

  private sendMessage(message: WebsocketMessage): void {
    if (this.client && this.client.readyState === WebSocket.OPEN) {
      this.client.send(JSON.stringify(message));
    } else {
      this.pendingMessages.push(message);
    }
  }

  private sendPendingMessages(): void {
    while (
      this.client &&
      this.client.readyState === WebSocket.OPEN &&
      this.pendingMessages.length > 0
    ) {
      const message = this.pendingMessages.shift();
      if (message) {
        this.client.send(JSON.stringify(message));
      }
    }
  }
}
