import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { Type } from "typebox";

import type { Domain } from "~/extensions/storage/domains/types.ts";
import type { StorageAdapter } from "~/extensions/storage/types.ts";

import { formatToolResult } from "~/extensions/utils/index.ts";

interface GetDomainDetails {
  domain?: Domain;
}

const parameters = Type.Object({
  id: Type.String({ description: "Stable domain identifier" }),
});

export function registerGetDomainTool(
  pi: ExtensionAPI,
  storage: StorageAdapter,
): void {
  pi.registerTool({
    name: "get-domain",
    label: "Get Domain",
    description: "Read a single project domain by identifier.",
    promptSnippet:
      "Use when the user or an agent needs the full record for one domain.",
    parameters,
    async execute(_toolCallId, params) {
      const domain = await storage.domains.get(params.id);
      if (!domain) {
        return formatToolResult<GetDomainDetails>(
          `Domain "${params.id}" was not found.`,
          { domain: undefined },
        );
      }

      return formatToolResult<GetDomainDetails>(
        `Domain "${params.id}" found: ${domain.name} — ${domain.description}`,
        { domain },
      );
    },
  });
}
