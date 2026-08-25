# Rendering

Each Trellis tool can provide custom `renderCall` and `renderResult` functions so the TUI shows the right information at the right density.

## Tool-call rendering

```typescript
renderCall(args, theme, context) {
  // Mode, agent name(s), scope, task preview.
}
```

## Result rendering

```typescript
renderResult(result, options, theme, context) {
  // Status icon, last N display items, formatted tool calls, usage, final output.
}
```

Collapsed view shows:
- Status icon: `⏳` running, `✓` success, `✗` error.
- Agent name and mode.
- Last few display items (tool calls formatted like `$ cmd`, `read path:1-10`, etc.).
- Usage summary.

Expanded view (Ctrl+O) shows:
- Full final output as markdown.
- Per-agent/per-task details.
- All tool calls and their results.

## Parallel live status

A shared snapshot is emitted via `onUpdate` so the TUI can render `2/3 done, 1 running` for parallel fanout.

## Persistent widgets

- `ctx.ui.setWidget("inspecting-tree", ...)` renders a compact session/agent status line above/below the editor.

## Interactive inspector

- `/inspecting-tree` opens `ctx.ui.custom({ overlay: true })` with tree, details, and message panes.
- Navigation: `↑/↓` or `j/k`, `Tab` cycles panes, `Enter` copies/selects, `r` refreshes, `q`/`Escape` closes.

## See also

- [Pi TUI docs](https://pi.dev/docs/tui) for `Component`, `Container`, `SelectList`, `Markdown`, etc.
