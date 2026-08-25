import type { Domain } from "~/extensions/storage/domains/types.ts";

import type { Theme } from "@earendil-works/pi-coding-agent";

import {
  matchesKey,
  truncateToWidth,
  wrapTextWithAnsi,
} from "@earendil-works/pi-tui";

export type ManagingDomainsAction =
  | { kind: "close" }
  | { kind: "delete"; domain: Domain }
  | { kind: "edit"; domain: Domain };

interface ManagingDomainsComponentOptions {
  domains: Domain[];
  done: (action: ManagingDomainsAction) => void;
  initialSelectedIndex?: number;
  requestRender: () => void;
  theme: Theme;
}

export class ManagingDomainsComponent {
  private domains: Domain[];
  private readonly done: (action: ManagingDomainsAction) => void;
  private readonly requestRender: () => void;
  private selectedIndex: number;
  private readonly theme: Theme;

  constructor(options: ManagingDomainsComponentOptions) {
    this.domains = options.domains;
    this.done = options.done;
    this.requestRender = options.requestRender;
    this.selectedIndex = Math.max(
      0,
      Math.min(
        options.initialSelectedIndex ?? 0,
        options.domains.length - 1,
      ),
    );
    this.theme = options.theme;
  }

  handleInput(data: string): void {
    if (matchesKey(data, "up") || matchesKey(data, "k")) {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.requestRender();
      return;
    }

    if (matchesKey(data, "down") || matchesKey(data, "j")) {
      this.selectedIndex = Math.min(
        this.domains.length - 1,
        this.selectedIndex + 1,
      );
      this.requestRender();
      return;
    }

    if (matchesKey(data, "q") || matchesKey(data, "escape")) {
      this.done({ kind: "close" });
      return;
    }

    const domain = this.domains[this.selectedIndex];
    if (!domain) return;

    if (matchesKey(data, "d")) {
      this.done({ kind: "delete", domain });
      return;
    }

    if (matchesKey(data, "e")) {
      this.done({ kind: "edit", domain });
      return;
    }
  }

  invalidate(): void {
    // Cache-free component: nothing to clear. Do not call requestRender()
    // here because TUI.invalidate() is recursive.
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
