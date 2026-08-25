# Launcher

The launcher is the bridge between a bundled agent definition and a running child `pi` process. It is used for both **coordinator agents** and **domain agents**.

## Resolve launch contract

Given an agent name and a role (`coordinator` | `domain`):

1. Load the static agent catalog from bundled `agents/*.md`.
2. Look up by name; if missing, return an error listing available agents.
3. Build child argv:
   - `--mode json -p --no-session`
   - `--model <model>` if pinned; otherwise inherit `ctx.model.provider/ctx.model.id` and `thinkingLevel`.
   - `--thinking <level>` only when inherited.
   - `--tools <list>` if the agent restricts tools.
   - `--append-system-prompt <tempfile>` containing the agent's system prompt.
   - Role and identity env vars (`TRELLIS_AGENT_ID`, `TRELLIS_ROLE`, etc.) so the extension factory knows whether to start a coordinator-agent loop or a one-off domain-agent task.

## System prompt injection

- Write prompt to a temp file created with `mkdtemp`, mode `0o600`.
- Referenced by path, not shell-quoted inline.
- Remove temp dir in a `finally` block.
- Queue the write via `withFileMutationQueue()` if contention with other file operations is possible.

## Executable resolution

`getPiInvocation` decides whether to re-invoke `process.execPath` with the current script or fall back to the `pi` binary.

## Spawn and stream parsing

```typescript
spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
```

- stdout is newline-delimited JSON.
- Parse `message_end` and `tool_result_end` events.
- Accumulate `messages`, `usage`, `model`, `stopReason`.
- Call `onUpdate` after every event.
- Accumulate stderr for error reporting.

## Cancellation

```typescript
signal.addEventListener("abort", () => {
  child.kill("SIGTERM");
  setTimeout(() => child.kill("SIGKILL"), 5000).unref();
});
```

## Child loading for Trellis-aware agents

- Propagate the extension path (`-e <abs-path>`) or rely on package auto-discovery.
- Set `TRELLIS_AGENT_ID`, `TRELLIS_PARENT_ID`, `TRELLIS_SESSION_ID`, `TRELLIS_MAILBOX_DIR`.
- In agent mode the factory detects `TRELLIS_AGENT_ID` and registers only ambient tools.

## Return contract

For a long-lived subagent the launcher returns a process handle/registry record rather than a single final answer. The child process communicates results over time via the messaging layer and writes `result.json` on exit.

For failure surface:

- Throw on failure (`exitCode !== 0`, stopReason `error`/`aborted`).
- Usage is accumulated from `message_end` events and reported by whichever tool initiated the spawn.
