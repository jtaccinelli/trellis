import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { Type } from "typebox";

import type { StorageAdapter } from "~/extensions/storage/types.ts";

import { formatToolResult } from "~/extensions/utils/index.ts";

interface ListDomainsDetails {
  domains: Awaited<ReturnType<StorageAdapter["domains"]["list"]>>;
}

const parameters = Type.Object({});

export function registerListDomainsTool(
  pi: ExtensionAPI,
  storage: StorageAdapter,
): void {
  pi.registerTool({
    name: "list-domains",
    label: "List Domains",
    description: "List all defined Trellis domains.",
    promptSnippet:
      "Use when the user or a coordinator needs to see the current domain taxonomy.",
    parameters,
    async execute() {
      const domains = await storage.domains.list();

      const summary = domains
        .map((domain) => `- ${domain.id}: ${domain.name} — ${domain.description}`)
        .join("\n");

      return formatToolResult<ListDomainsDetails>(
        `${domains.length} domain(s) defined.\n${summary}`,
        { domains },
      );
    },
  });
}
