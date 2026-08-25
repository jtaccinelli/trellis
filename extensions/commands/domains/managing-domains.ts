import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import type { Domain } from "~/extensions/storage/domains/types.ts";
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

        const handleDelete = async (domain: Domain) => {
          selectedDomainId = domain.id;

          const confirmed = await ctx.ui.confirm(
            "Delete domain?",
            `Remove "${domain.name}" (${domain.id})? This cannot be undone.`,
          );
          if (confirmed) {
            await storage.domains.delete(domain.id);
            ctx.ui.notify(`Domain "${domain.id}" deleted.`, "info");
            selectedDomainId = undefined;
          }
        };

        const handleEdit = async (domain: Domain) => {
          selectedDomainId = domain.id;

          const remit = await ctx.ui.input("Edit remit", domain.remit);
          if (remit !== undefined) {
            await storage.domains.update({ ...domain, remit });
            ctx.ui.notify(`Domain "${domain.id}" updated.`, "info");
          }
        };

        switch (action.kind) {
          case "close": {
            handleClose();
            break;
          }
          case "delete": {
            await handleDelete(action.domain);
            break;
          }
          case "edit": {
            await handleEdit(action.domain);
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
