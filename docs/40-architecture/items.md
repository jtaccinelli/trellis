# Items

An **item** is a durable named artifact that lives inside a domain.

## What an item is

- A concrete thing a domain owns: a component, a service, a function, a route, an endpoint, a store.
- Reused across requests once it exists.
- The unit that is actually built during the `building-items` phase.
- Not a **domain** (the area of responsibility) and not a **scope requirement** (the transient requirement slice).

```
Domain: frontend
    │
    ├── Item: UserAvatar
    ├── Item: Button
    └── Item: Modal
```

## Storage

The canonical storage model for an item is the `Item` entity:

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

Eventually the same data will be surfaced through overlay files such as:

- `CONTRACT.md` — the ratified output shape and consumer/provider verdicts.
- `USAGE.md` — how other items or domains should consume it.
- `CHANGELOG.md` — history of changes to this item.
- `REFERENCES.md` — generated list of consumers.
- `attempts/ATTEMPT_<NNN>.md` — one build attempt record per attempt.
- Domain `INVENTORY.md` — generated list of all items in the domain.

Until the file overlay is built, the storage adapter is the source of truth.

## Lifecycle

### Scoping-time

1. A scope requirement is assigned to a domain.
2. The domain’s domain agent assesses whether the need is already satisfied by an existing item.
3. If yes, the requirement may be marked `satisfied` and linked to the item.
4. If no, the coordinator schedules item creation and the item is inserted with status `proposed`.

### Build-time

1. The coordinator computes build waves based on the ratified contract graph.
2. For each ready item, the extension’s queue manager spawns a domain agent inside a worktree.
3. The agent writes code to the mapped host path.
4. On pass, the item status becomes `satisfied` and its documentation is updated.
5. On failure, the item may retry up to a cap or be marked `blocked`.

### Post-build

- New requests that touch the same capability look up the item and may create `modify` items instead of `create` items.
- The domain agent regenerates `REFERENCES.md` and `INVENTORY.md`.
- The domain’s learned-patterns log is extended if the new item establishes a pattern.

## Reuse guardrails

Before creating a new item, the coordinator or domain agent checks:

1. **Existing items in the domain** — does an existing item already satisfy this shape?
2. **Historical requests** — has this same need appeared repeatedly and should be consolidated?
3. **Consumer references** — would creating this item break an existing consumer? If so, propose a `Partial · breaking` variant instead.

## Relationship to scope requirements

| | Scope Requirement | Item |
|---|---|---|
| Lifetime | Per request | Durable across requests |
| Owner | Coordinator, transient | Domain, persisted |
| Result of assessment | Assigned to a domain, may produce contracts | Concrete artifact built inside a domain |
| Status | `provisional`, `assigned`, `decomposed`, `final`, `absorbed`, `escalated` | `proposed`, `satisfied`, `modify`, `blocked` |

A requirement is “what we need.” An item is “what we build.”

## Reuse graph

Items form a consume/consumed-by graph:

- A consumer item references provider items through contracts.
- `REFERENCES.md` for an item is generated from those references.
- `visualizing-consumption` reads this graph and renders it without writing anything back.

## See also

- [Data model: Item](../60-data-model/entities.md)
- [Action: Cataloguing items](../35-actions/cataloguing-items.md)
- [Delegation model](./delegation.md)
- [Queue management](./queue-manager.md)
