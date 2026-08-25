# Cataloguing Tools

Cataloguing happens during scoping, after a requirement has been assigned to a domain but before the final scope document is approved. These tools map needs to durable `Item` records.

## `querying-items`

```typescript
Type.Object({
  domain_id: Type.String(),
  status: Type.Optional(Type.String()),
  contract_shape: Type.Optional(Type.String()),
});
```

List items in a domain, optionally filtered by status or contract shape.

## `upserting-item`

```typescript
Type.Object({
  domain_id: Type.String(),
  slug: Type.String(),
  contract_summary: Type.String(),
  status: Type.Optional(Type.StringEnum(["proposed", "modify", "satisfied", "blocked"])),
  parent_item_id: Type.Optional(Type.String()),
});
```

Insert a proposed item or update an existing item.

## `linking-requirement`

```typescript
Type.Object({
  requirement_id: Type.String(),
  item_ids: Type.Array(Type.String()),
});
```

Associate a scope requirement with one or more items.

## `resolving-item-conflict`

```typescript
Type.Object({
  catalogue_decision_id: Type.String(),
  decision: StringEnum(["escalate", "resolve"] as const),
  resolution: Type.Optional(Type.String()),
});
```

Mark an ambiguous catalogue decision as escalated or resolved.

## See also

- [Cataloguing items workflow](../35-actions/cataloguing-items.md)
- [Data model: Item](../60-data-model/entities.md)
