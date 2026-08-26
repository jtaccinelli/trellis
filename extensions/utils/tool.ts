import type { AgentToolResult } from "@earendil-works/pi-coding-agent";

/**
 * Shape of a single text content block returned inside a tool result.
 */
export interface ToolTextContent {
  type: "text";
  text: string;
}

/**
 * Create a single text content block.
 *
 * Useful when assembling multi-block results manually or when a helper needs
 * to return raw content without the full tool-result wrapper.
 */
export function textBlock(text: string): ToolTextContent {
  return { type: "text", text };
}

/**
 * Build a complete tool result from a text summary and a typed details payload.
 *
 * Prefer this over hand-assembling `{ type: "text", text: ... }` blocks in
 * every tool so result shape stays consistent across the extension.
 */
export function formatToolResult<TDetails>(
  text: string,
  details: TDetails,
): AgentToolResult<TDetails> {
  return {
    content: [textBlock(text)],
    details,
  };
}
