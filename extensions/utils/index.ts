/**
 * Shared utility helpers used across the extension.
 *
 * Each submodule is focused on a single concern. Prefer importing from the
 * relevant submodule when only one concern is needed.
 */
export * from "./events.ts";
export { json, parseJson } from "./json.ts";
export { textBlock, formatToolResult, type ToolTextContent } from "./tool.ts";
export { mapInputs, renderLines } from "./tui.ts";
