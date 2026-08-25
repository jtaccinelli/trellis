# Domain

A **domain** is a project-defined area of responsibility. Domains are explicit; there is no inheritance.

## Definition

Domains are declared at the project level via `creating-domain` and stored in the storage adapter. Each project has its own taxonomy.

## Fields

| Field | Purpose |
|---|---|
| `remit` | What the domain owns. |
| `exclusions` | What the domain explicitly does not own. |
| `above` | Parent domain for one-off absorption. |
| `below` | Optional child domains for reference only, not delegation. |
| `agent_definition_id` | Which bundled agent definition handles work for this domain. |

## Rules

- `above` is for **absorption**, not inheritance. A domain does not automatically inherit its parent’s remit.
- `below` is for reference; work is not delegated downward.
- There is no runtime discovery of new domains from user or project directories.

## Example domains

- `frontend`
- `backend`
- `infrastructure`
- `design-system`

## See also

- [Scope requirement](./requirement.md)
- [Item](./item.md)
- [API: domains](../50-api/domains.md)
- [Data model: Domain](../60-data-model/entities.md)
