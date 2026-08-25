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

      let lastSelectedDomainId: string | undefined;
      let running = true;

      while (running) {
        const domains = await storage.domains.list();

        const action = await ctx.ui.custom<DomainManagerAction | undefined>(
          (tui, theme, _keybindings, done) =>
            new DomainManagerComponent({
              domains,
              done,
              initialSelectedDomainId: lastSelectedDomainId,
              requestRender: () => tui.requestRender(),
              theme,
            }),
        );

        if (!action || action.kind === "close") {
          break;
        }

        lastSelectedDomainId = action.domain.id;

        if (action.kind === "delete") {
          const confirmed = await ctx.ui.confirm(
            "Delete domain?",
            `Remove "${action.domain.name}" (${action.domain.id})? This cannot be undone.`,
          );
          if (confirmed) {
            await storage.domains.delete(action.domain.id);
            ctx.ui.notify(`Domain "${action.domain.id}" deleted.`, "info");
            lastSelectedDomainId = undefined;
          }
          continue;
        }

        if (action.kind === "edit") {
          const remit = await ctx.ui.input("Edit remit", action.domain.remit);
          if (remit !== undefined) {
            await storage.domains.update({ ...action.domain, remit });
            ctx.ui.notify(`Domain "${action.domain.id}" updated.`, "info");
          }
          continue;
        }

        break;
      }
    },
  });
}
