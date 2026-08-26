/**
 * Shared types for Trellis runtime managers.
 *
 * Keep this file dependency-light so every manager can import it without
 * risking circular references.
 */

import type { ChildProcess } from "node:child_process";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { WebSocket } from "ws";

// ─── Agent manager types ───────────────────────────────────────────────────

export type AgentRole = "coordinator" | "domain" | "background";

export type AgentMode = "json" | "rpc";

export interface AgentDefinition {
  name: string;
  description: string;
  mode?: AgentMode;
  tools?: string[];
  model?: string;
  thinking?: string;
  systemPrompt: string;
  filePath: string;
}

export interface AgentStartOptions {
  agentName: string;
  role: AgentRole;
  /** Runtime prompt/text passed as the final argv argument to the child. */
  task: string;
  cwd?: string;
  requestId: string;
  parentId?: string;
  agentId?: string;
  domainId?: string;
  queueItemId?: string;
  mailboxDir?: string;
  /** Override the inherited model (provider/id). */
  model?: string;
  /** Override the inherited thinking level. */
  thinkingLevel?: string;
  /** Override the launch mode defined in the agent frontmatter. */
  mode?: AgentMode;
}

export interface AgentProcessHandle {
  agentId: string;
  agentName: string;
  role: AgentRole;
  mode: AgentMode;
  startedAt: number;
  child: ChildProcess;
  promise: Promise<AgentExitInfo>;
}

export interface AgentExitInfo {
  exitCode: number;
  stopReason?: string;
  errorMessage?: string;
  resultText?: string;
  usage?: AgentUsageStats;
}

export interface AgentUsageStats {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cost: number;
  contextTokens: number;
  turns: number;
}

// ─── WebSocket manager types ─────────────────────────────────────────────────

export interface AgentRegistration {
  agentId: string;
  role: string;
  name: string;
  requestId: string;
  parentId?: string;
}

export interface WebSocketServerManagerOptions {
  pi: ExtensionAPI;
  token?: string;
}

export interface WebSocketClientManagerOptions {
  pi: ExtensionAPI;
  token?: string;
}

export interface PublishOptions {
  /** Send only to this agent id. */
  target?: string;
  /** Send to every agent registered for this request id. */
  requestId?: string;
  /** Send to every connected agent except the sender. */
  broadcast?: boolean;
}

export type WebsocketMessageType =
  | "register"
  | "register_ack"
  | "publish"
  | "event"
  | "subscribe"
  | "unsubscribe"
  | "ping"
  | "pong";

export interface WebsocketRegisterMessage extends AgentRegistration {
  type: "register";
  token: string;
}

export interface WebsocketRegisterAckMessage {
  type: "register_ack";
  agentId: string;
}

export interface WebsocketPublishMessage {
  type: "publish";
  topic: string;
  payload: unknown;
  target?: string;
  requestId?: string;
  broadcast?: boolean;
}

export interface WebsocketEventMessage {
  type: "event";
  topic: string;
  payload: unknown;
  from: string;
}

export interface WebsocketSubscribeMessage {
  type: "subscribe";
  topic: string;
}

export interface WebsocketUnsubscribeMessage {
  type: "unsubscribe";
  topic: string;
}

export interface WebsocketPingMessage {
  type: "ping";
}

export interface WebsocketPongMessage {
  type: "pong";
}

export type WebsocketMessage =
  | WebsocketRegisterMessage
  | WebsocketRegisterAckMessage
  | WebsocketPublishMessage
  | WebsocketEventMessage
  | WebsocketSubscribeMessage
  | WebsocketUnsubscribeMessage
  | WebsocketPingMessage
  | WebsocketPongMessage;

export interface EventManager {
  publish(topic: string, payload: unknown, options?: PublishOptions): void;
}

export interface WebsocketClientRecord extends AgentRegistration {
  socket: WebSocket;
  subscriptions: Set<string>;
}
