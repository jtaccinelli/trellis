# Inspection Tools

## `inspecting-scope`

```typescript
Type.Object({
  session_id: Type.String(),
});
```

Returns the scope requirement tree and finalization status.

## `inspecting-queue`

```typescript
Type.Object({
  session_id: Type.String(),
  domain_id: Type.Optional(Type.String()),
});
```

Returns per-domain work-queue state: queued/running/done counts, active agent ids.

## `resolving-conflict`

Used inside the sign-off gate to resolve an escalated requirement.

```typescript
Type.Object({
  session_id: Type.String(),
  conflict_id: Type.String(),
  decision: StringEnum(["A", "B", "user_resolution"] as const),
  user_resolution: Type.Optional(Type.String()),
});
```

`A` and `B` select one of the two domains that kept reassigning the requirement. `user_resolution` lets the user provide an explicit instruction instead.

## Rendering

These tools return compact status lines when collapsed and a structured tree when expanded.
