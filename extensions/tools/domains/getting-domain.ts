import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { Type } from "typebox";

import type { Domain } from "~/extensions/storage/domains/types.ts";
import type { StorageAdapter } from "~/extensions/storage/types.ts";

interface GettingDomainDetails {
  domain?: Domain;
}

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
    parameters: Type.Object({
      id: Type.String({ description: "Stable domain identifier" }),
    }),
    async execute(_toolCallId, params) {
      const domain = await storage.domains.get(params.id);
      if (!domain) {
        return {
          content: [
            { type: "text", text: `Domain "${params.id}" was not found.` },
          ],
          details: { domain: undefined } as GettingDomainDetails,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Domain "${params.id}" found: ${domain.name} — ${domain.description}`,
          },
        ],
        details: { domain } as GettingDomainDetails,
      };
    },
  });
}
