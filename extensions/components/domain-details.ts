import type { Domain } from "~/extensions/storage/domains/types.ts";

import type { Theme } from "@earendil-works/pi-coding-agent";
import type { Component } from "@earendil-works/pi-tui";

import { truncateToWidth, wrapTextWithAnsi } from "@earendil-works/pi-tui";
import { renderLines } from "~/extensions/utils/tui.ts";

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

    return renderLines(
      !domain && truncateToWidth(this.theme.fg("dim", "No domain selected."), width),
      domain && [
        truncateToWidth(this.theme.fg("accent", this.theme.bold(domain.name)), width),
        truncateToWidth(this.theme.fg("muted", `id: ${domain.id}`), width),
        "",
        truncateToWidth(this.theme.fg("muted", "Description"), width),
        ...wrapTextWithAnsi(domain.description, width),
        "",
        truncateToWidth(this.theme.fg("muted", "Remit"), width),
        ...wrapTextWithAnsi(domain.remit, width),
        "",
        truncateToWidth(this.theme.fg("muted", "Exclusions"), width),
        domain.exclusions.length === 0
          ? truncateToWidth(this.theme.fg("dim", "None"), width)
          : domain.exclusions.map((exclusion) => truncateToWidth(`• ${exclusion}`, width)),
      ],
    );
  }
}
