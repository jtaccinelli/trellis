import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { Type } from "typebox";

import type { Domain } from "~/extensions/storage/domains/types.ts";
import type { StorageAdapter } from "~/extensions/storage/types.ts";

import { formatToolResult } from "~/extensions/utils.ts";

interface GettingDomainDetails {
  domain?: Domain;
}

const parameters = Type.Object({
  id: Type.String({ description: "Stable domain identifier" }),
});

export function registerGettingDomainTool(
  pi: ExtensionAPI,
  storage: StorageAdapter,
): void {
  pi.registerTool({
    name: "getting-domain",
    label: "Get Domain",
    description: "Read a single project domain by identifier.",
    promptSnippet:
      "Use when the user or an agent needs the full record for one domain.",
    parameters,
    async execute(_toolCallId, params) {
      const domain = await storage.domains.get(params.id);
      if (!domain) {
        return formatToolResult<GettingDomainDetails>(
          `Domain "${params.id}" was not found.`,
          { domain: undefined },
        );
      }

      return formatToolResult<GettingDomainDetails>(
        `Domain "${params.id}" found: ${domain.name} — ${domain.description}`,
        { domain },
      );
    },
  });
}
