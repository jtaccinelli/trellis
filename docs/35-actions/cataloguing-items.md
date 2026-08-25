# Cataloguing Items

Cataloguing is the process of mapping a validated need to zero, one, or more durable `Item` records inside a domain. It happens during scoping, after a scope requirement has been assigned to a domain but before the final scope document is approved.

The goal is to avoid duplicate items, reuse existing work, and leave a clear trail from a requirement to the item(s) that satisfy it.

## When it runs

Cataloguing is triggered when a domain agent completes assessment of a scope requirement and the coordinator needs to decide what durable artifacts the requirement implies.

 Typical triggers:

- A requirement is assigned to a domain for decomposition.
- A child requirement narrows to a concrete capability.
- A contract between domains identifies a required output shape.

## Roles

| Role | Responsibility in this action |
|------|------------------------------|
| **Coordinator agent** | Drives the loop, asks for reuse checks, records item decisions, links requirements to items, escalates ambiguity. |
| **Extension queue manager** | Pulls cataloguing work items serially and spawns fresh domain agents. |
| **Domain agent** | Looks at the requirement and the domain's existing items, then returns a catalogue decision. It does not create items directly; it only recommends. |

## Inputs

- `Requirement` — the need being considered.
- `Domain` — the assigned domain (remit, exclusions, `above`/`below` relationships).
- Existing `Item` records in the domain.
- Historical scope requirement fingerprints, if available, to detect recurring needs.

## Outputs

One of the following decisions for the requirement:

- **`satisfied-by-existing`** — the need is already covered by one or more existing items.
- **`modify-existing`** — the need changes an existing item's contract enough to warrant a `modify` item.
- **`propose-new`** — a new item should be created.
- **`absorbed`** — the need is out of scope and absorbed by an `above` domain (rare). This is recorded, not built.
- **`escalated`** — the agent cannot decide whether the need duplicates existing work or contradicts an existing contract.

## Process

### Step 1 — Determine catalogue candidacy

The coordinator inspects the requirement. If the requirement is still high-level or cross-cutting, the coordinator decomposes it further before cataloguing.

If the requirement is concrete enough to imply a durable artifact, the coordinator enqueues a `catalogue-work-item` for the domain.

### Step 2 — Domain agent performs reuse checks

For each candidate need, the domain agent checks, in order:

1. **Exact or near-existing item**  
   Is there an item in this domain whose `slug` or `contract_summary` already satisfies the capability?
2. **Shape match**  
   Does an existing item have a similar output shape, inputs, or consumer set? If so, the need should extend it (`modify-existing`) rather than create a duplicate.
3. **Historical recurrence**  
   Has the same request signature appeared multiple times in the domain without an existing item? This may indicate a missing canonical item.
4. **Consumer impact**  
   If a new item would replace or break an existing consumer, the agent must flag a `Partial · breaking` variant.

The domain agent returns a structured catalogue decision with reasoning, item ids if any, and any suggested new item slugs.

### Step 3 — Coordinator records the decision

The coordinator writes the result to durable storage:

- Links the requirement to existing item ids (`satisfied-by-existing`).
- Inserts a new `Item` with status `proposed` (`propose-new`).
- Inserts a `modify` item referencing the original (`modify-existing`).
- Increments `reassignment_count` and re-queues if the agent recommends moving the requirement to another domain.
- Marks ambiguous decisions as `escalated` after a bounce threshold.

### Step 4 — Reuse guardrails

Before finalizing, the coordinator verifies:

- No two `proposed` items in the same domain have overlapping contracts.
- A `modify` item does not contradict its parent item's ratified contract without escalation.
- Absorption is upward-only (`above` domain) and not used to hide scope.

### Step 5 — Loop until stable

A catalogue decision for one requirement may produce narrower child requirements or contracts for other domains. Those are delegated through `delegating-requirement` and re-enter the catalogue process.

The loop ends when every requirement either:

- maps to existing items,
- has become a proposed/modify item,
- has been absorbed, or
- has been escalated.

## Status transitions

| Trigger | Item status | Requirement status |
|---|---|---|
| Existing item covers the need | `satisfied` (unchanged) | `final` |
| New item proposed | `proposed` | `decomposed` |
| Existing item needs change | `modify` | `decomposed` |
| Could not resolve duplicate/contract conflict | `proposed` / `blocked` | `escalated` |

## Tool surface (to be implemented)

| Tool | Purpose |
|---|---|
| `querying-items` | List items in a domain, optionally filter by status or contract shape. |
| `upserting-item` | Insert a `proposed` item or update an existing item. |
| `linking-requirement` | Associate a scope requirement with one or more items. |
| `resolving-item-conflict` | Mark an ambiguous decision as escalated or resolved. |

Until these tools exist, the coordinator and domain agent can use storage-adapter reads and `delegating-requirement` results to perform the same steps.

## Relationship to other actions

- **Scoping** produces requirements; cataloguing turns requirements into item decisions.
- **Building** consumes `proposed` and `modify` items and turns them into `satisfied` items.
- **Self-documenting** regenerates domain inventory and item references after items change.

## See also

- [Item architecture](../40-architecture/items.md)
- [Data model: Item](../60-data-model/entities.md)
- [API: delegating-requirement](../50-api/delegating-requirement.md)
