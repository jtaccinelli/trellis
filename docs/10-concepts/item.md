# Item

An **item** is a durable named artifact that lives inside a domain. Items are created and reused across requests; requirements are transient.

## What an item is

- A concrete thing a domain owns: a component, a service, a function, a route, an endpoint, a store.
- The unit that is actually built during the implementation phase.
- Not a [domain](./domain.md) (the area of responsibility) and not a [scope requirement](./requirement.md) (the transient slice).

## Example

```
Domain: frontend
├── Item: UserAvatar
├── Item: Button
└── Item: Modal
```

## Lifecycle

### Scoping-time

- A requirement is assigned to a domain.
- The domain agent checks whether the need is already satisfied by an existing item.
- If yes, the requirement may be marked `final` and linked to the item.
- If no, the coordinator inserts an item with status `proposed` (or `modify` for changes).

### Build-time

- The coordinator computes build waves from the ratified contract graph.
- The extension’s queue manager spawns a domain agent to write code for each ready item.
- On success, status becomes `satisfied`; on failure, it may become `blocked`.

### Post-build

- New requests look up items and may create `modify` items instead of duplicates.
- `REFERENCES.md` and `INVENTORY.md` are regenerated from item relationships.

## Statuses

| Status | Meaning |
|---|---|
| `proposed` | New item agreed during scoping, not yet built. |
| `satisfied` | Built and passing checks. |
| `modify` | Change to an existing item. |
| `blocked` | Build failed and could not recover. |

## Relationship to requirements

| | Scope Requirement | Item |
|---|---|---|
| Lifetime | Per request | Durable across requests |
| Owner | Coordinator, transient | Domain, persisted |
| Result of assessment | Assigned to a domain | Concrete artifact built inside a domain |

## See also

- [Domain](./domain.md)
- [Scope requirement](./requirement.md)
- [Action: Cataloguing items](../35-actions/cataloguing-items.md)
- [Architecture: Items](../40-architecture/items.md)
- [Data model: Item](../60-data-model/entities.md)
