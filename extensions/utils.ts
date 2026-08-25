/**
 * One-off utility helpers shared across the extension.
 *
 * Keep this file small and focused. If a helper grows domain logic, promote it
 * to a manager, tool, or dedicated module instead.
 */

export function json<T>(value: T): string {
  return JSON.stringify(value);
}

export function parseJson<T>(value: string | null | undefined): T {
  if (value == null) return undefined as T;
  return JSON.parse(value) as T;
}
