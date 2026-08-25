import type { AgentToolResult } from "@earendil-works/pi-coding-agent";

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
