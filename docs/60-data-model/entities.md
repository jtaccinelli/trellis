# Entities

## Migration

Schema tracker. Defined in `extensions/storage/migrations/types.ts`.

```typescript
interface Migration {
  version: number;
  appliedAt: number;
}
```

The migration runner lives alongside the tracker in `extensions/storage/migrations/handler.ts` and follows the same subfolder pattern as other tables.

## Session

```typescript
interface Session {
  session_id: string;
  request: string;
  status: "scoping" | "awaiting_approval" | "approved" | "rejected" | "abandoned";
  coordinator_id: string;
}
```

## Domain

A project-defined area of responsibility. Defined in `extensions/storage/domains/types.ts`.

```typescript
interface Domain {
  id: string;
  name: string;
  description: string;
  remit: string;
  exclusions: string[];
}
```

Domains are **flat, semantic categories**. Parent/child absorption relationships and hierarchy are interpreted by agents during scoping, not stored in the domain record. If no existing domain claims a requirement, the coordinator flags a gap so a new domain can be defined.


## Domain Agent

Ephemeral worker spawned by the extension's queue manager for a single work item.

```typescript
interface DomainAgent {
  id: string;                 // trellis:<uuid>
  domain_id: string;
  session_id: string;
  work_item_id: string;
  agent_name: string;         // bundled agent definition name
  status: "running" | "completed" | "failed" | "aborted";
  process_pid?: number;
  spawned_at: number;
  completed_at?: number;
}
```

A domain agent is spawned fresh for each work item and torn down as soon as its result is recorded. It never persists between items.

## Scope Requirement

```typescript
interface Requirement {
  id: string;
  session_id: string;
  description: string;
  domain_id: string;
  parent_requirement_id?: string;
  status: "provisional" | "assigned" | "decomposed" | "final" | "absorbed" | "escalated";
  owned_scope?: string;
  contracts: Contract[];
  child_requirement_ids: string[];
  reassignment_count: number; // how many times this requirement has been handed to a different domain
  escalation_reason?: string;
  created_at: number;
  resolved_at?: number;
}
```

## Work Item

```typescript
interface WorkItem {
  id: string;
  domain_id: string;
  requirement_id: string;
  enqueued_by_coordinator_id: string;
  status: "queued" | "running" | "done" | "failed";
  domain_agent_id?: string; // ephemeral agent currently processing the item
  result_payload?: string;  // JSON result returned by the domain agent
}
```

Work items are placed on a domain's shared queue by coordinators. The queue manager pulls items serially, spawns a fresh domain agent for each, and records completion on child exit. The agent’s result lives in the work item; a lightweight message notifies the originating coordinator.

## Item

A durable named artifact that lives inside a domain. Items are created and reused across requests; requirements are transient.

```typescript
interface Item {
  id: string;
  domain_id: string;             // domain this item belongs to
  project_id: string;
  slug: string;                  // kebab-case item name
  status: "proposed" | "satisfied" | "modify" | "blocked";
  source_paths: string[];        // real code location(s) in the host project
  contract_summary?: string;
  created_at: number;
  updated_at?: number;
}
```

## Message

See [Messaging architecture](../40-architecture/messaging.md). Messaging is one-to-one only.

```typescript
interface Message {
  id: string;
  from_agent_id: string;
  to_agent_id: string;
  payload: string;
  in_reply_to?: string;
  created_at: number;
}
```

## Absorbed One-Off Log

```typescript
interface AbsorbedLog {
  id: string;
  domain_id: string;
  absorbing_domain_id: string;
  request_signature: string;
  requirement_id: string;
  count: number;
  created_at: number;
  last_seen_at: number;
}
```

## Final Scope Document

```typescript
interface FinalScopeDocument {
  id: string;
  session_id: string;
  status: "draft" | "approved" | "rejected";
  requirements: Requirement[];
  contracts: Contract[];
  escalations: Conflict[];
}
```
