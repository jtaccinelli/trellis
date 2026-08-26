import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { Type } from "typebox";

import type { StorageAdapter } from "~/extensions/storage/types.ts";

import { formatToolResult } from "~/extensions/utils/index.ts";

interface DeleteDomainDetails {
  deleted: boolean;
}

const parameters = Type.Object({
  id: Type.String({ description: "Stable domain identifier" }),
});

export function registerDeleteDomainTool(
  pi: ExtensionAPI,
  storage: StorageAdapter,
): void {
  pi.registerTool({
    name: "delete-domain",
    label: "Delete Domain",
    description: "Remove a project domain from the Trellis taxonomy.",
    promptSnippet:
      "Use when the user explicitly asks to remove a domain. This cannot be undone.",
    parameters,
    async execute(_toolCallId, params) {
      const deleted = await storage.domains.delete(params.id);
      if (!deleted) {
        return formatToolResult<DeleteDomainDetails>(
          `Domain "${params.id}" was not found.`,
          { deleted: false },
        );
      }

      return formatToolResult<DeleteDomainDetails>(
        `Domain "${params.id}" deleted successfully.`,
        { deleted: true },
      );
    },
  });
}
