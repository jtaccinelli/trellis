import { matchesKey } from "@earendil-works/pi-tui";
import type { KeyId } from "@earendil-works/pi-tui";

/**
 * Route a raw keypress to the first matching handler in a key map.
 *
 * Handlers should be small, named actions declared inside the component's
 * `handleInput` method so the key-to-action mapping is visible at a glance.
 * Returns `true` if a handler matched and ran, otherwise `false`.
 */
export function mapInputs(
  data: string,
  handlers: Partial<Record<KeyId, () => void>>,
): boolean {
  for (const [key, handler] of Object.entries(handlers)) {
    if (!handler) {
      continue;
    }
    if (matchesKey(data, key as KeyId)) {
      handler();
      return true;
    }
  }
  return false;
}

/**
 * A single renderable line or a falsy value to drop.
 */
type LineItem = string | false | null | undefined;

/**
 * A renderable content block, supporting conditional items and one level of
 * nested arrays (enough for spread helpers such as `wrapTextWithAnsi(...)`).
 */
type LineContent = LineItem | LineItem[] | (LineItem | LineItem[])[];

/**
 * Build a rendered line list from a mix of strings, arrays, and falsy values.
 *
 * Works like `clsx` for lines: conditional items and nested arrays are
 * flattened and falsy values are dropped. Useful inside component `render`
 * methods to keep layout declarative.
 */
export function renderLines(...items: LineContent[]): string[] {
  return items
    .flat(2)
    .filter((item): item is string => typeof item === "string");
}
