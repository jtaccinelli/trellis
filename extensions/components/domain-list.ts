import type { Domain } from "~/extensions/storage/domains/types.ts";

import type { Theme } from "@earendil-works/pi-coding-agent";
import type { Component } from "@earendil-works/pi-tui";

import { matchesKey, truncateToWidth } from "@earendil-works/pi-tui";

export class DomainListComponent implements Component {
  private selectedIndex: number;

  constructor(
    private domains: Domain[],
    initialSelectedIndex: number,
    private readonly theme: Theme,
    private readonly requestRender: () => void,
  ) {
    this.selectedIndex = Math.max(
      0,
      Math.min(initialSelectedIndex, domains.length - 1),
    );
  }

  getSelectedDomain(): Domain | undefined {
    return this.domains[this.selectedIndex];
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
  }

  invalidate(): void {
    // Cache-free component.
  }

  render(width: number): string[] {
    if (this.domains.length === 0) {
      return [truncateToWidth(this.theme.fg("dim", "No domains"), width)];
    }

    const lines: string[] = [];
    for (let index = 0; index < this.domains.length; index++) {
      const item = this.domains[index];
      const isSelected = index === this.selectedIndex;
      const marker = isSelected ? this.theme.fg("accent", "› ") : "  ";
      const label = isSelected
        ? this.theme.fg("accent", this.theme.bold(item.name))
        : this.theme.fg("text", item.name);
      lines.push(truncateToWidth(`${marker}${label}`, width));
    }

    return lines;
  }
}
