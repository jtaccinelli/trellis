import type { AgentToolResult } from "@earendil-works/pi-coding-agent";

import { matchesKey } from "@earendil-works/pi-tui";
import type { KeyId } from "@earendil-works/pi-tui";

/**
 * One-off utility helpers shared across the extension.
 *
 * Keep this file small and focused. If a helper grows domain logic, promote it
 * to a manager, tool, or dedicated module instead.
 */

export function json<T>(value: T): string {
  return JSON.stringify(value);
}

export function parseJson<T>(value: string | null | undefined): T {
  if (value == null) return undefined as T;
  return JSON.parse(value) as T;
}

export interface ToolTextContent {
  type: "text";
  text: string;
}

export function textBlock(text: string): ToolTextContent {
  return { type: "text", text };
}

export function formatToolResult<TDetails>(
  text: string,
  details: TDetails,
): AgentToolResult<TDetails> {
  return {
    content: [textBlock(text)],
    details,
  };
}

/**
 * Routes a raw keypress to the first matching handler in a key map.
 *
 * Handlers should be small, named actions declared inside the component's
 * handleInput method so the key-to-action mapping is visible at a glance.
 */
export function mapInputs(
  data: string,
  handlers: Partial<Record<KeyId, () => void>>,
): boolean {
  for (const [key, handler] of Object.entries(handlers)) {
    if (!handler) {
      continue;
    }
    if (matchesKey(data, key as KeyId)) {
      handler();
      return true;
    }
  }
  return false;
}
