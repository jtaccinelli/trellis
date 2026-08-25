import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { Type } from "typebox";

import type { StorageAdapter } from "~/extensions/storage/types.ts";

interface DeletingDomainDetails {
  deleted: boolean;
}

export function registerDeletingDomainTool(
  pi: ExtensionAPI,
  storage: StorageAdapter,
): void {
  pi.registerTool({
    name: "deleting-domain",
    label: "Delete Domain",
    description: "Remove a project domain from the Trellis taxonomy.",
    promptSnippet:
      "Use when the user explicitly asks to remove a domain. This cannot be undone.",
    parameters: Type.Object({
      id: Type.String({ description: "Stable domain identifier" }),
    }),
    async execute(_toolCallId, params) {
      const deleted = await storage.domains.delete(params.id);
      if (!deleted) {
        return {
          content: [
            { type: "text", text: `Domain "${params.id}" was not found.` },
          ],
          details: { deleted: false } as DeletingDomainDetails,
        };
      }

      return {
        content: [
          { type: "text", text: `Domain "${params.id}" deleted successfully.` },
        ],
        details: { deleted: true } as DeletingDomainDetails,
      };
    },
  });
}
