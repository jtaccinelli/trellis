# Scope Requirement

A **scope requirement** is a unit of work under evaluation — a requirement, contract, or slice of a request.

## Lifecycle

```
provisional → assigned → decomposed → final | absorbed | escalated
```

## Properties

- Belongs to exactly one domain at a time.
- May carry contracts for other domains.
- Is **transient request-state**, not a durable artifact.
- Lives inside a domain during scoping.

## Statuses

| Status | Meaning |
|---|---|
| `provisional` | Created but not yet assigned to a domain. |
| `assigned` | Assigned to a domain, waiting for assessment. |
| `decomposed` | Broken into narrower child requirements or linked to items. |
| `final` | Ratified in the final scope document. |
| `absorbed` | Out of scope, absorbed by an `above` domain. |
| `escalated` | Disputed; awaiting human resolution. |

## Relationship to items

A requirement describes *what is needed*. An [item](./item.md) is *what is built*.

## See also

- [Domain](./domain.md)
- [Work item](./work-item.md)
- [Contract](./contract.md)
- [Item](./item.md)
- [API: scoping-item](../50-api/scoping-item.md)
- [API: delegating-requirement](../50-api/delegating-requirement.md)
