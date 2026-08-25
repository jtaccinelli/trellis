# Domain Management Tools

Domains are project-defined areas of responsibility. They are stored in the storage adapter, not in files, and they are bundled with the extension. There is no runtime discovery of new domains from user or project directories.

Domain hierarchy is not stored in the schema. Domains are flat, semantic categories; parent/child absorption relationships are inferred by agents during scoping. If no existing domain claims a requirement, the coordinator flags a gap so a new domain can be defined.

The domain tools mirror the storage handler verbs:

| Tool | Handler verb | Purpose |
|------|--------------|---------|
| `creating-domain` | `create` | Add a new domain. |
| `getting-domain` | `get` | Read one domain by identifier. |
| `updating-domain` | `update` | Overwrite fields of an existing domain. |
| `deleting-domain` | `delete` | Remove a domain by identifier. |
| `listing-domains` | `list` | List all configured domains. |

Each tool has a focused gerund-noun name and a single responsibility.

There is also an interactive TUI command for browsing and managing domains without leaving the chat:

- `/managing-domains` — Open a two-pane overlay: navigate with ↑/↓, edit the selected domain's remit with `e`, delete it with `d`, and close with `q` or Escape.

---

## `creating-domain`

Add a domain to the current project taxonomy.

### Purpose

Create what a domain owns and what it excludes.

### Who calls it

The user, during project setup or when refining the domain taxonomy. Coordinators do **not** create domains on their own.

### Schema

```typescript
Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.String(),
  remit: Type.String(),
  exclusions: Type.Array(Type.String()),
});
```

| Param | Required | Meaning |
|-------|----------|---------|
| `id` | yes | Stable domain identifier (e.g. "api", "frontend", "payments"). |
| `name` | yes | Human-readable domain name. |
| `description` | yes | Short summary of what the domain covers. |
| `remit` | yes | What this domain is responsible for assessing or building. |
| `exclusions` | yes | Topics explicitly outside this domain. |

### What happens

- Checks whether a domain with the same `id` already exists.
- If it exists, returns the existing domain without overwriting.
- If it does not exist, persists the domain in the storage adapter.

### Result

```typescript
{
  content: [{ type: "text", text: "Domain '<id>' created successfully." }],
  details: { domain }
}
```

On duplicate:

```typescript
{
  content: [{ type: "text", text: "Domain '<id>' already exists..." }],
  details: { existing }
}
```

### Example prompt

> "Create a domain with id 'api', name 'API', description 'HTTP surface', remit 'routes, controllers, request validation', and exclusions 'database schema, frontend components'."

---

## `getting-domain`

Read a single domain.

### Schema

```typescript
Type.Object({
  id: Type.String(),
});
```

### Result

```typescript
{
  content: [{ type: "text", text: "Domain '<id>' found: ..." }],
  details: { domain }
}
```

---

## `updating-domain`

Overwrite fields of an existing domain.

### Schema

Same as `creating-domain`.

### Result

```typescript
{
  content: [{ type: "text", text: "Domain '<id>' updated successfully." }],
  details: { updated: true, domain }
}
```

---

## `deleting-domain`

Remove a domain.

### Schema

```typescript
Type.Object({
  id: Type.String(),
});
```

### Result

```typescript
{
  content: [{ type: "text", text: "Domain '<id>' deleted successfully." }],
  details: { deleted: true }
}
```

---

## `listing-domains`

List configured domains.

### Purpose

Show the current domain taxonomy so users can verify it before running `scoping-item`.

### Schema

No parameters.

### Result

```typescript
{
  content: [{ type: "text", text: summary }],
  details: {
    domains: Array<{
      id: string;
      name: string;
      description: string;
      remit: string;
      exclusions: string[];
    }>
  }
}
```

### See also

- [Domain concept](../10-concepts/domain.md)
- [Delegation model](../40-architecture/delegation.md)
- [API reference: domain tools](../50-api/domains.md)
