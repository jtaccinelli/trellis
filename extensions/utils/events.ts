/**
 * Trellis event topic registry.
 *
 * Centralises every custom event topic that is emitted over the WebSocket
 * event bus or the local `pi.events` bus. Using these constants (and the
 * associated payload types) keeps event senders and consumers consistent and lets
 * code vet topics before publishing or subscribing.
 */

import type { AgentMode, AgentUsageStats } from "~/extensions/managers/types.ts";

export const TRELLIS_AGENT_SPAWNED = "trellis:agent_spawned" as const;
export const TRELLIS_AGENT_CLOSED = "trellis:agent_closed" as const;
export const TRELLIS_AGENT_SETTLED = "trellis:agent_settled" as const;
export const TRELLIS_QUEUE_ITEM_COMPLETED = "trellis:queue_item_completed" as const;
export const TRELLIS_COORDINATOR_STARTED = "trellis:coordinator_started" as const;
export const TRELLIS_COORDINATOR_UPDATED = "trellis:coordinator_updated" as const;
export const TRELLIS_NOTE_SENT = "trellis:note" as const;

export const TRELLIS_EVENT_TOPICS = [
  TRELLIS_AGENT_SPAWNED,
  TRELLIS_AGENT_CLOSED,
  TRELLIS_AGENT_SETTLED,
  TRELLIS_QUEUE_ITEM_COMPLETED,
  TRELLIS_COORDINATOR_STARTED,
  TRELLIS_COORDINATOR_UPDATED,
  TRELLIS_NOTE_SENT,
] as const;

export type TrellisEventTopic = (typeof TRELLIS_EVENT_TOPICS)[number];

const KNOWN_TRELLIS_EVENT_TOPICS = new Set<string>(TRELLIS_EVENT_TOPICS);

export interface TrellisAgentDetails {
  id: string;
  name: string;
  role: string;
  mode: AgentMode;
  requestId: string;
  parentId?: string;
}

export interface TrellisAgentLifecycleEvent {
  agent: TrellisAgentDetails;
}

export interface TrellisAgentSpawnedEvent extends TrellisAgentLifecycleEvent {}

export interface TrellisAgentClosedEvent extends TrellisAgentLifecycleEvent {
  exitCode: number;
  stopReason?: string;
  errorMessage?: string;
  resultText?: string;
  usage?: AgentUsageStats;
}

export interface TrellisAgentSettledEvent extends TrellisAgentLifecycleEvent {
  timestamp: number;
  resultText?: string;
}

export interface TrellisQueueItemCompletedEvent {
  requestId: string;
  queueItemId: string;
  coordinatorId: string;
  failed: boolean;
}

export interface TrellisCoordinatorStartedEvent {
  requestId: string;
  coordinatorId: string;
}

export interface TrellisCoordinatorUpdatedEvent {
  requestId: string;
  queueItemId: string;
  failed: boolean;
}

export interface TrellisNoteSentEvent {
  noteId: string;
  requestId: string;
  fromAgentId: string;
  toAgentId: string;
  payload: unknown;
}

export interface TrellisEventPayloadMap {
  [TRELLIS_AGENT_SPAWNED]: TrellisAgentSpawnedEvent;
  [TRELLIS_AGENT_CLOSED]: TrellisAgentClosedEvent;
  [TRELLIS_AGENT_SETTLED]: TrellisAgentSettledEvent;
  [TRELLIS_QUEUE_ITEM_COMPLETED]: TrellisQueueItemCompletedEvent;
  [TRELLIS_COORDINATOR_STARTED]: TrellisCoordinatorStartedEvent;
  [TRELLIS_COORDINATOR_UPDATED]: TrellisCoordinatorUpdatedEvent;
  [TRELLIS_NOTE_SENT]: TrellisNoteSentEvent;
}

export type TrellisEventPayload<T extends TrellisEventTopic = TrellisEventTopic> =
  TrellisEventPayloadMap[T];

/** Check whether a string is a known Trellis event topic. */
export function isTrellisEventTopic(topic: string): topic is TrellisEventTopic {
  return KNOWN_TRELLIS_EVENT_TOPICS.has(topic);
}

/** Assert that a string is a known Trellis event topic. */
export function assertTrellisEventTopic(topic: string): asserts topic is TrellisEventTopic {
  if (!isTrellisEventTopic(topic)) {
    throw new Error(
      `Unknown Trellis event topic "${topic}". Expected one of: ${TRELLIS_EVENT_TOPICS.join(", ")}.`,
    );
  }
}

/** Return a shallow copy of all known Trellis event topics. */
export function listTrellisEventTopics(): readonly TrellisEventTopic[] {
  return TRELLIS_EVENT_TOPICS.slice();
}
