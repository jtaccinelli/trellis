/**
 * JSON serialization helpers.
 */

/**
 * Serialise a value to a JSON string.
 *
 * Thin wrapper around `JSON.stringify` so callers can import a single helper
 * without reaching for the global.
 */
export function json<T>(value: T): string {
  return JSON.stringify(value);
}

/**
 * Parse a JSON string into a typed value.
 *
 * Returns `undefined` for `null` or `undefined` input so storage handlers can
 * treat missing values safely without extra guards at every call site.
 */
export function parseJson<T>(value: string | null | undefined): T {
  if (value == null) return undefined as T;
  return JSON.parse(value) as T;
}
