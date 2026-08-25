import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { Type } from "typebox";

import type { StorageAdapter } from "~/extensions/storage/types.ts";

import { toolResult } from "~/extensions/utils.ts";

const parameters = Type.Object({});

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
    parameters,
    async execute() {
      const domains = await storage.domains.list();

      return toolResult(`${domains.length} domain(s) defined.`, { domains });
    },
  });
}
