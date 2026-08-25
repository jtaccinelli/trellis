import type { Domain } from "~/extensions/storage/domains/types.ts";

import type { Theme } from "@earendil-works/pi-coding-agent";
import type { Component } from "@earendil-works/pi-tui";

import { truncateToWidth, wrapTextWithAnsi } from "@earendil-works/pi-tui";

export class DomainDetailsComponent implements Component {
  constructor(
    private readonly getDomain: () => Domain | undefined,
    private readonly theme: Theme,
  ) {}

  invalidate(): void {
    // Cache-free component.
  }

  render(width: number): string[] {
    const domain = this.getDomain();
    const lines: string[] = [];

    if (!domain) {
      lines.push(
        truncateToWidth(this.theme.fg("dim", "No domain selected."), width),
      );
      return lines;
    }

    lines.push(
      truncateToWidth(
        this.theme.fg("accent", this.theme.bold(domain.name)),
        width,
      ),
    );
    lines.push(
      truncateToWidth(this.theme.fg("muted", `id: ${domain.id}`), width),
    );
    lines.push("");
    lines.push(truncateToWidth(this.theme.fg("muted", "Description"), width));
    lines.push(...wrapTextWithAnsi(domain.description, width));
    lines.push("");
    lines.push(truncateToWidth(this.theme.fg("muted", "Remit"), width));
    lines.push(...wrapTextWithAnsi(domain.remit, width));
    lines.push("");
    lines.push(truncateToWidth(this.theme.fg("muted", "Exclusions"), width));
    if (domain.exclusions.length === 0) {
      lines.push(truncateToWidth(this.theme.fg("dim", "None"), width));
    } else {
      for (const exclusion of domain.exclusions) {
        lines.push(truncateToWidth(`• ${exclusion}`, width));
      }
    }

    return lines;
  }
}
