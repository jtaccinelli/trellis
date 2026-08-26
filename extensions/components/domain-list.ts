import type { Domain } from "~/extensions/storage/domains/types.ts";

import type { Theme } from "@earendil-works/pi-coding-agent";
import type { Component } from "@earendil-works/pi-tui";

import { truncateToWidth } from "@earendil-works/pi-tui";

import { mapInputs, renderLines } from "~/extensions/utils/index.ts";

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
    const handlePrevious = () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.requestRender();
    };

    const handleNext = () => {
      this.selectedIndex = Math.min(
        this.domains.length - 1,
        this.selectedIndex + 1,
      );
      this.requestRender();
    };

    mapInputs(data, {
      up: handlePrevious,
      k: handlePrevious,
      down: handleNext,
      j: handleNext,
    });
  }

  invalidate(): void {
    // Cache-free component.
  }

  render(width: number): string[] {
    return renderLines(
      this.domains.length === 0 &&
        truncateToWidth(this.theme.fg("dim", "No domains"), width),
      this.domains.length > 0 &&
        this.domains.map((item, index) => {
          const isSelected = index === this.selectedIndex;
          const marker = isSelected ? this.theme.fg("accent", "› ") : "  ";
          const label = isSelected
            ? this.theme.fg("accent", this.theme.bold(item.name))
            : this.theme.fg("text", item.name);
          return truncateToWidth(`${marker}${label}`, width);
        }),
    );
  }
}
