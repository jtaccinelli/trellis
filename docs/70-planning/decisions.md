# Decisions

| # | Decision | Ruling |
|---|----------|--------|
| 1 | Subagent primitive | Replicate Pi's built-in `--mode json` child process contract, not `pi-subagents` runtime. |
| 2 | Agent definitions | Markdown + YAML frontmatter; static bundled catalog loaded at startup. |
| 3 | Dispatch surface | One `delegating-requirement` tool used by coordinators to enqueue a scope requirement onto a domain's shared queue. |
| 4 | Model inheritance | Inherit parent's active model + thinking when agent omits `model`. |
| 5 | Runtime configurability | Domain settings (`creating-domain`) determine which agent handles which domain, not runtime agent discovery. |
| 6 | Output cap | 50 KB per parallel task into model-visible text. |
| 7 | Domain taxonomy | Project-defined; no fixed boilerplate; no inheritance. |
| 8 | Domain storage | Structured plugin-managed store, not files. |
| 9 | Queue ownership | Each domain owns its FIFO queue. |
| 10 | Agent dispatch | One ephemeral domain agent per work-queue item. |
| 11 | Conflict resolution | Domain agents perform all scope assessment. Coordinators only detect excessive back-and-forth (oscillation) and escalate to the user when a bounce threshold is crossed. |
| 12 | Storage default | SQLite via `StorageAdapter` interface; Cloudflare adapter later. |
| 13 | Native Pi persistence | Use only for transient session-visible state, not source of truth. |
| 14 | Queue management | Implemented in the extension runtime, not as a subagent. The extension owns each domain queue, serializes domain-agent execution, and spawns the next agent on child exit. |
| 15 | Messaging / notifications | One-to-one only. No shared channels. Messages are used for extension runtime notifications and user steering notes to running agents; agents do not message each other. |
