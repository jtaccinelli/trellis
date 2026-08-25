import type { Domain } from "~/extensions/storage/domains/types.ts";
import type { StorageAdapter } from "~/extensions/storage/types.ts";

import type { ExtensionUIContext, Theme } from "@earendil-works/pi-coding-agent";

import {
  matchesKey,
  truncateToWidth,
  wrapTextWithAnsi,
} from "@earendil-works/pi-tui";

interface ManagingDomainsComponentOptions {
  domains: Domain[];
  done: () => void;
  redraw: () => void;
  storage: StorageAdapter;
  theme: Theme;
  ui: ExtensionUIContext;
}

export class ManagingDomainsComponent {
  private domains: Domain[];
  private readonly done: () => void;
  private readonly redraw: () => void;
  private selectedIndex: number;
  private readonly storage: StorageAdapter;
  private readonly theme: Theme;
  private readonly ui: ExtensionUIContext;

  constructor(options: ManagingDomainsComponentOptions) {
    this.domains = options.domains;
    this.done = options.done;
    this.redraw = options.redraw;
    this.selectedIndex = 0;
    this.storage = options.storage;
    this.theme = options.theme;
    this.ui = options.ui;
  }

  async refreshDomains(): Promise<void> {
    this.domains = await this.storage.domains.list();
    if (this.selectedIndex >= this.domains.length) {
      this.selectedIndex = Math.max(0, this.domains.length - 1);
    }
    this.redraw();
  }

  handleInput(data: string): void {
    if (matchesKey(data, "up") || matchesKey(data, "k")) {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      return;
    }

    if (matchesKey(data, "down") || matchesKey(data, "j")) {
      this.selectedIndex = Math.min(
        this.domains.length - 1,
        this.selectedIndex + 1,
      );
      return;
    }

    if (matchesKey(data, "q") || matchesKey(data, "escape")) {
      this.done();
      return;
    }

    const domain = this.domains[this.selectedIndex];
    if (!domain) return;

    if (matchesKey(data, "d")) {
      this.ui
        .confirm(
          "Delete domain?",
          `Remove "${domain.name}" (${domain.id})? This cannot be undone.`,
        )
        .then(async (confirmed) => {
          if (confirmed) {
            await this.storage.domains.delete(domain.id);
            this.ui.notify(`Domain "${domain.id}" deleted.`, "info");
            await this.refreshDomains();
          }
        });
      return;
    }

    if (matchesKey(data, "e")) {
      this.ui
        .input("Edit remit", domain.remit)
        .then(async (remit) => {
          if (remit === undefined) return;
          const updated: Domain = { ...domain, remit };
          await this.storage.domains.update(updated);
          this.ui.notify(`Domain "${domain.id}" updated.`, "info");
          await this.refreshDomains();
        });
    }
  }

  invalidate(): void {
    this.redraw();
  }

  render(width: number): string[] {
    const theme = this.theme;
    const listWidth = Math.min(28, Math.floor(width * 0.35));
    const detailWidth = Math.max(20, width - listWidth - 3);

    const lines: string[] = [];
    lines.push(
      truncateToWidth(
        theme.fg("accent", theme.bold("Managing domains")),
        width,
      ),
    );

    if (this.domains.length === 0) {
      lines.push("");
      lines.push(theme.fg("dim", "No domains defined."));
      lines.push(theme.fg("dim", "Press q to close."));
      return lines;
    }

    const domain = this.domains[this.selectedIndex];
    const maxVisible = Math.max(3, 20); // placeholder; we render all for simplicity

    const leftLines: string[] = [];
    for (let index = 0; index < this.domains.length; index++) {
      const item = this.domains[index];
      const isSelected = index === this.selectedIndex;
      const marker = isSelected ? theme.fg("accent", "› ") : "  ";
      const label = isSelected
        ? theme.fg("accent", theme.bold(item.name))
        : theme.fg("text", item.name);
      leftLines.push(
        truncateToWidth(`${marker}${label}`, listWidth - 1),
      );
    }

    const rightLines: string[] = [];
    rightLines.push(theme.fg("accent", theme.bold(domain.name)));
    rightLines.push(theme.fg("muted", `id: ${domain.id}`));
    rightLines.push("");
    rightLines.push(theme.fg("muted", "Description"));
    rightLines.push(...wrapTextWithAnsi(domain.description, detailWidth));
    rightLines.push("");
    rightLines.push(theme.fg("muted", "Remit"));
    rightLines.push(...wrapTextWithAnsi(domain.remit, detailWidth));
    rightLines.push("");
    rightLines.push(theme.fg("muted", "Exclusions"));
    if (domain.exclusions.length === 0) {
      rightLines.push(theme.fg("dim", "None"));
    } else {
      for (const exclusion of domain.exclusions) {
        rightLines.push(`• ${truncateToWidth(exclusion, detailWidth - 2)}`);
      }
    }

    const rowCount = Math.max(leftLines.length, rightLines.length);
    const verticalBorder = theme.fg("borderMuted", "│");

    for (let row = 0; row < rowCount; row++) {
      const left = leftLines[row] ?? "";
      const right = rightLines[row] ?? "";
      const paddedLeft = left.padEnd(listWidth, " ");
      lines.push(
        truncateToWidth(
          `${paddedLeft} ${verticalBorder} ${right}`,
          width,
        ),
      );
    }

    lines.push("");
    lines.push(
      truncateToWidth(
        theme.fg(
          "dim",
          "↑/↓ navigate • e edit remit • d delete • q close",
        ),
        width,
      ),
    );

    return lines;
  }
}
