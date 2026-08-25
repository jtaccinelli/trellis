import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import type { StorageAdapter } from "~/extensions/storage/types.ts";

import {
  DomainManagerComponent,
  type DomainManagerAction,
} from "~/extensions/components/domain-manager.ts";

export function registerManagingDomainsCommand(
  pi: ExtensionAPI,
  storage: StorageAdapter,
): void {
  pi.registerCommand("managing-domains", {
    description: "Open an interactive TUI for domain management",
    handler: async (_args, ctx) => {
      if (ctx.mode !== "tui") {
        ctx.ui.notify("/managing-domains requires TUI mode", "error");
        return;
      }

      let selectedDomainId: string | undefined;
      let running = true;

      while (running) {
        const domains = await storage.domains.list();
        const initialSelectedIndex = selectedDomainId
          ? Math.max(
            0,
            domains.findIndex((domain) => domain.id === selectedDomainId),
          )
          : 0;

        const action = await ctx.ui.custom<DomainManagerAction | undefined>(
          (tui, theme, _keybindings, done) =>
            new DomainManagerComponent({
              domains,
              done,
              initialSelectedIndex,
              requestRender: () => tui.requestRender(),
              theme,
            }),
        );

        if (!action) {
          break;
        }

        const handleClose = () => {
          running = false;
        };

        const handleDelete = async (
          deleteAction: Extract<DomainManagerAction, { kind: "delete" }>,
        ) => {
          selectedDomainId = deleteAction.domain.id;

          const confirmed = await ctx.ui.confirm(
            "Delete domain?",
            `Remove "${deleteAction.domain.name}" (${deleteAction.domain.id})? This cannot be undone.`,
          );
          if (confirmed) {
            await storage.domains.delete(deleteAction.domain.id);
            ctx.ui.notify(
              `Domain "${deleteAction.domain.id}" deleted.`,
              "info",
            );
            selectedDomainId = undefined;
          }
        };

        const handleEdit = async (
          editAction: Extract<DomainManagerAction, { kind: "edit" }>,
        ) => {
          selectedDomainId = editAction.domain.id;

          const remit = await ctx.ui.input("Edit remit", editAction.domain.remit);
          if (remit !== undefined) {
            await storage.domains.update({ ...editAction.domain, remit });
            ctx.ui.notify(
              `Domain "${editAction.domain.id}" updated.`,
              "info",
            );
          }
        };

        switch (action.kind) {
          case "close": {
            handleClose();
            break;
          }
          case "delete": {
            await handleDelete(action);
            break;
          }
          case "edit": {
            await handleEdit(action);
            break;
          }
          default: {
            running = false;
            break;
          }
        }
      }
    },
  });
}
