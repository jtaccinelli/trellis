/**
 * Trellis WebSocket server manager.
 *
 * Runs in the root pi process, accepts connections from spawned agents,
 * and routes published events between them.
 */

import { randomBytes } from "node:crypto";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { WebSocket, WebSocketServer, type RawData } from "ws";

import type {
  EventManager,
  PublishOptions,
  WebSocketServerManagerOptions,
  WebsocketClientRecord,
  WebsocketMessage,
  WebsocketPublishMessage,
} from "~/extensions/managers/types.ts";

export class WebSocketServerManager implements EventManager {
  readonly pi: ExtensionAPI;
  readonly token: string;

  private server?: WebSocketServer;
  private url?: string;
  private registeredAgents = new Map<WebSocket, WebsocketClientRecord>();

  constructor(options: WebSocketServerManagerOptions) {
    this.pi = options.pi;
    this.token = options.token ?? randomBytes(16).toString("hex");
  }

  /** Start the WebSocket server. Returns the URL agents should connect to. */
  async startServer(): Promise<string> {
    return new Promise((resolve, reject) => {
      const server = new WebSocketServer({ host: "127.0.0.1", port: 0 });
      this.server = server;

      server.once("error", reject);
      server.on("connection", (socket) => this.handleConnection(socket));
      server.on("listening", () => this.handleListening(server, resolve, reject));
    });
  }

  /** Stop the server and drop all connections. */
  stopServer(): void {
    this.server?.close();
  }

  /** Publish an event to connected clients. */
  publish(topic: string, payload: unknown, options?: PublishOptions): void {
    const message: WebsocketMessage = {
      type: "publish",
      topic,
      payload,
      target: options?.target,
      requestId: options?.requestId,
      broadcast: options?.broadcast,
    };
    this.pi.events.emit(topic, payload);
    this.routeMessage(message, "trellis:root");
  }

  /** List ids of every registered agent. */
  getRegisteredAgentIds(): string[] {
    return Array.from(this.registeredAgents.values()).map((record) => record.agentId);
  }

  // ─── Server handlers ───────────────────────────────────────────────────────

  private handleConnection(socket: WebSocket): void {
    socket.on("message", (raw) => this.handleSocketMessage(socket, raw));
    socket.on("close", () => this.handleSocketClose(socket));
  }

  private handleSocketMessage(socket: WebSocket, raw: RawData): void {
    try {
      const message = JSON.parse(raw.toString()) as WebsocketMessage;

      switch (message.type) {
        case "register":
          this.handleRegister(socket, message);
          return;

        case "publish":
        case "subscribe":
        case "unsubscribe":
        case "ping": {
          const record = this.registeredAgents.get(socket);
          if (!record) {
            socket.close(1008, "not registered");
            return;
          }

          switch (message.type) {
            case "publish":
              this.pi.events.emit(message.topic, message.payload);
              this.routeMessage(message, record.agentId);
              break;
            case "subscribe":
              record.subscriptions.add(message.topic);
              break;
            case "unsubscribe":
              record.subscriptions.delete(message.topic);
              break;
            case "ping":
              this.send(socket, { type: "pong" });
              break;
          }
          return;
        }

        default:
          return;
      }
    } catch {
      // Malformed messages are ignored.
    }
  }

  private handleSocketClose(socket: WebSocket): void {
    this.registeredAgents.delete(socket);
  }

  private handleRegister(
    socket: WebSocket,
    message: Extract<WebsocketMessage, { type: "register" }>,
  ): void {
    if (message.token !== this.token) {
      socket.close(1008, "invalid token");
      return;
    }

    for (const [existingSocket, record] of this.registeredAgents) {
      if (record.agentId === message.agentId && existingSocket !== socket) {
        existingSocket.close();
        this.registeredAgents.delete(existingSocket);
        break;
      }
    }

    const record: WebsocketClientRecord = {
      agentId: message.agentId,
      role: message.role,
      name: message.name,
      requestId: message.requestId,
      parentId: message.parentId,
      socket,
      subscriptions: new Set<string>(),
    };

    this.registeredAgents.set(socket, record);
    this.send(socket, { type: "register_ack", agentId: message.agentId });
  }

  private handleListening(
    server: WebSocketServer,
    resolve: (url: string) => void,
    reject: (reason: Error) => void,
  ): void {
    const address = server.address();
    if (typeof address === "object" && address !== null) {
      this.url = `ws://127.0.0.1:${address.port}`;
      resolve(this.url);
    } else {
      reject(new Error("Unexpected WebSocket server address"));
    }
  }

  // ─── Routing and utilities ─────────────────────────────────────────────────

  private routeMessage(message: WebsocketPublishMessage, senderId: string): void {
    if (message.broadcast) {
      for (const record of this.registeredAgents.values()) {
        if (record.agentId !== senderId) {
          this.send(record.socket, { type: "event", topic: message.topic, payload: message.payload, from: senderId });
        }
      }
      return;
    }

    if (message.target) {
      for (const record of this.registeredAgents.values()) {
        if (record.agentId === message.target && record.agentId !== senderId) {
          this.send(record.socket, { type: "event", topic: message.topic, payload: message.payload, from: senderId });
          break;
        }
      }
      return;
    }

    if (message.requestId) {
      for (const record of this.registeredAgents.values()) {
        if (record.requestId === message.requestId && record.agentId !== senderId) {
          this.send(record.socket, { type: "event", topic: message.topic, payload: message.payload, from: senderId });
        }
      }
      return;
    }

    for (const record of this.registeredAgents.values()) {
      if (record.agentId !== senderId && record.subscriptions.has(message.topic)) {
        this.send(record.socket, { type: "event", topic: message.topic, payload: message.payload, from: senderId });
      }
    }
  }

  private send(socket: WebSocket, message: WebsocketMessage): void {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }
}
