import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { Type } from "typebox";

import type { StorageAdapter } from "~/extensions/storage/types.ts";

export function registerListingDomainsTool(
  pi: ExtensionAPI,
  storage: StorageAdapter,
): void {
  pi.registerTool({
    name: "listing-domains",
    label: "List Domains",
    description: "List all defined Trellis domains.",
    promptSnippet:
      "Use when the user or a coordinator needs to see the current domain taxonomy.",
    parameters: Type.Object({}),
    async execute() {
      const domains = await storage.domains.list();

      return {
        content: [
          {
            type: "text",
            text: `${domains.length} domain(s) defined.`,
          },
        ],
        details: { domains },
      };
    },
  });
}
