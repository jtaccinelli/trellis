# Domain Management Tools

Domain tools mirror the storage handler verbs (`create`, `get`, `update`, `delete`, `list`).

## `creating-domain`

Create a domain. Returns the created domain, or the existing domain if the `id` is already taken.

```typescript
Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.String(),
  remit: Type.String(),
  exclusions: Type.Array(Type.String()),
});
```

## `getting-domain`

Read a single domain by `id`.

```typescript
Type.Object({
  id: Type.String(),
});
```

## `updating-domain`

Overwrite an existing domain. Same schema as `creating-domain`.

## `deleting-domain`

Remove a domain by `id`.

```typescript
Type.Object({
  id: Type.String(),
});
```

## `listing-domains`

List all configured domains. No parameters.

## Notes

- Domains are stored in the storage adapter, not files.
- Domains are flat; no hierarchy columns are stored. Agents infer absorption relationships during scoping.
- The domain taxonomy is project-defined; there is no runtime discovery of new domains from user or project directories.
