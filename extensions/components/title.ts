import type { Theme } from "@earendil-works/pi-coding-agent";
import type { Component } from "@earendil-works/pi-tui";

import { truncateToWidth } from "@earendil-works/pi-tui";

export class TitleComponent implements Component {
  constructor(
    private readonly theme: Theme,
    private readonly title: string,
  ) {}

  invalidate(): void {
    // Cache-free component.
  }

  render(width: number): string[] {
    return [
      truncateToWidth(
        this.theme.fg("accent", this.theme.bold(this.title)),
        width,
      ),
    ];
  }
}
