import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

import type { StorageAdapter } from "~/extensions/storage/types.ts";

import { ManagingDomainsComponent } from "~/extensions/components/managing-domains.ts";

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

      const domains = await storage.domains.list();

      await ctx.ui.custom<void>((tui, theme, _keybindings, done) => {
        return new ManagingDomainsComponent({
          domains,
          done,
          redraw: () => tui.invalidate(),
          storage,
          theme,
          ui: ctx.ui,
        });
      });
    },
  });
}
