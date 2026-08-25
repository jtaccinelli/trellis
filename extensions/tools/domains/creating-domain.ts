import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { Type } from "typebox";

import type { Domain } from "~/extensions/storage/domains/types.ts";
import type { StorageAdapter } from "~/extensions/storage/types.ts";

interface CreatingDomainDetails {
  domain?: Domain;
  existing?: Domain;
}

export function registerCreatingDomainTool(
  pi: ExtensionAPI,
  storage: StorageAdapter,
): void {
  pi.registerTool({
    name: "creating-domain",
    label: "Create Domain",
    description: "Create a project domain in the Trellis taxonomy.",
    promptSnippet:
      "Use when the user wants to add a new domain to the project taxonomy.",
    parameters: Type.Object({
      id: Type.String({ description: "Stable domain identifier" }),
      name: Type.String({ description: "Human-readable domain name" }),
      description: Type.String({
        description: "Short summary of what the domain covers",
      }),
      remit: Type.String({
        description:
          "Detailed responsibility statement for domain agents assessing scope",
      }),
      exclusions: Type.Array(Type.String(), {
        description: "Concerns this domain explicitly refuses to own",
      }),
    }),
    async execute(_toolCallId, params) {
      const existing = await storage.domains.get(params.id);
      if (existing) {
        return {
          content: [
            {
              type: "text",
              text: `Domain "${params.id}" already exists. Choose a different identifier or update the existing domain.`,
            },
          ],
          details: { existing, domain: undefined } as CreatingDomainDetails,
        };
      }

      const domain: Domain = { ...params };
      await storage.domains.create(domain);

      return {
        content: [
          { type: "text", text: `Domain "${params.id}" created successfully.` },
        ],
        details: { existing: undefined, domain } as CreatingDomainDetails,
      };
    },
  });
}
