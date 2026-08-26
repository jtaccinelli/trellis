import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { Type } from "typebox";

import type { Domain } from "~/extensions/storage/domains/types.ts";
import type { StorageAdapter } from "~/extensions/storage/types.ts";

import { formatToolResult } from "~/extensions/utils/index.ts";

interface UpdateDomainDetails {
  domain?: Domain;
  updated: boolean;
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

export function registerUpdateDomainTool(
  pi: ExtensionAPI,
  storage: StorageAdapter,
): void {
  pi.registerTool({
    name: "update-domain",
    label: "Update Domain",
    description: "Overwrite fields of an existing project domain.",
    promptSnippet:
      "Use when the user wants to change the description, remit, or exclusions of an existing domain.",
    parameters,
    async execute(_toolCallId, params) {
      const existing = await storage.domains.get(params.id);
      if (!existing) {
        return formatToolResult<UpdateDomainDetails>(
          `Domain "${params.id}" does not exist. Create it first.`,
          { updated: false, domain: undefined },
        );
      }

      const domain: Domain = { ...params };
      await storage.domains.update(domain);

      return formatToolResult<UpdateDomainDetails>(
        `Domain "${params.id}" updated successfully.`,
        { domain, updated: true },
      );
    },
  });
}
