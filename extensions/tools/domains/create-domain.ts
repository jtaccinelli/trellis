import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { Type } from "typebox";

import type { Domain } from "~/extensions/storage/domains/types.ts";
import type { StorageAdapter } from "~/extensions/storage/types.ts";

import { formatToolResult } from "~/extensions/utils/index.ts";

interface CreateDomainDetails {
  domain?: Domain;
  existing?: Domain;
}

const parameters = Type.Object({
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
});

export function registerCreateDomainTool(
  pi: ExtensionAPI,
  storage: StorageAdapter,
): void {
  pi.registerTool({
    name: "create-domain",
    label: "Create Domain",
    description: "Create a project domain in the Trellis taxonomy.",
    promptSnippet:
      "Use when the user wants to add a new domain to the project taxonomy.",
    parameters,
    async execute(_toolCallId, params) {
      const existing = await storage.domains.get(params.id);
      if (existing) {
        return formatToolResult<CreateDomainDetails>(
          `Domain "${params.id}" already exists. Choose a different identifier or update the existing domain.`,
          { existing, domain: undefined },
        );
      }

      const domain: Domain = { ...params };
      await storage.domains.create(domain);

      return formatToolResult<CreateDomainDetails>(
        `Domain "${params.id}" created successfully.`,
        { existing: undefined, domain },
      );
    },
  });
}
