import type { Domain } from "~/extensions/storage/domains/types.ts";

import type { Theme } from "@earendil-works/pi-coding-agent";
import type { Component } from "@earendil-works/pi-tui";

import { DynamicBorder } from "@earendil-works/pi-coding-agent";
import {
  Container,
  HStack,
  matchesKey,
  Spacer,
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

class TitleComponent implements Component {
  constructor(private readonly theme: Theme) {}

  invalidate(): void {}

  render(width: number): string[] {
    return [
      truncateToWidth(
        this.theme.fg("accent", this.theme.bold("Managing domains")),
        width,
      ),
    ];
  }
}

class HelpComponent implements Component {
  constructor(private readonly theme: Theme) {}

  invalidate(): void {}

  render(width: number): string[] {
    return [
      truncateToWidth(
        this.theme.fg(
          "dim",
          "↑/↓ or j/k navigate · e edit remit · d delete · q close",
        ),
        width,
      ),
    ];
  }
}

class DomainListComponent implements Component {
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

class DomainDetailsComponent implements Component {
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
      lines.push(truncateToWidth(this.theme.fg("dim", "No domain selected."), width));
      return lines;
    }

    lines.push(
      truncateToWidth(this.theme.fg("accent", this.theme.bold(domain.name)), width),
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
        lines.push(
          truncateToWidth(`• ${exclusion}`, width),
        );
      }
    }

    return lines;
  }
}

export class ManagingDomainsComponent extends Container {
  private readonly done: (action: ManagingDomainsAction) => void;
  private readonly list: DomainListComponent;

  constructor(options: ManagingDomainsComponentOptions) {
    super();

    this.done = options.done;
    this.list = new DomainListComponent(
      options.domains,
      options.initialSelectedIndex ?? 0,
      options.theme,
      options.requestRender,
    );

    const details = new DomainDetailsComponent(
      () => this.list.getSelectedDomain(),
      options.theme,
    );

    this.addChild(new Spacer(1));
    this.addChild(
      new DynamicBorder((s: string) => options.theme.fg("accent", s)),
    );
    this.addChild(new TitleComponent(options.theme));
    this.addChild(new Spacer(1));
    this.addChild(
      new HStack(
        [
          {
            component: this.list,
            minSize: 28,
            maxSize: 40,
            grow: 0,
            shrink: 1,
          },
          {
            component: details,
            minSize: 20,
            grow: 1,
            shrink: 1,
          },
        ],
        { gap: 1, align: "stretch" },
      ),
    );
    this.addChild(new Spacer(1));
    this.addChild(new HelpComponent(options.theme));
    this.addChild(
      new DynamicBorder((s: string) => options.theme.fg("accent", s)),
    );
  }

  handleInput(data: string): void {
    if (matchesKey(data, "q") || matchesKey(data, "escape")) {
      this.done({ kind: "close" });
      return;
    }

    const domain = this.list.getSelectedDomain();
    if (!domain) {
      return;
    }

    if (matchesKey(data, "d")) {
      this.done({ kind: "delete", domain });
      return;
    }

    if (matchesKey(data, "e")) {
      this.done({ kind: "edit", domain });
      return;
    }

    this.list.handleInput(data);
  }
}
