import type { Domain } from "~/extensions/storage/domains/types.ts";

import type { Theme } from "@earendil-works/pi-coding-agent";

import { DynamicBorder } from "@earendil-works/pi-coding-agent";
import {
  Container,
  HStack,
  matchesKey,
  Spacer,
} from "@earendil-works/pi-tui";

import { DomainDetailsComponent } from "~/extensions/components/domain-details.ts";
import { DomainListComponent } from "~/extensions/components/domain-list.ts";
import { HelpLineComponent } from "~/extensions/components/help-line.ts";
import { TitleComponent } from "~/extensions/components/title.ts";

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
    this.addChild(
      new TitleComponent(options.theme, "Managing domains"),
    );
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
    this.addChild(
      new HelpLineComponent(
        options.theme,
        "↑/↓ or j/k navigate · e edit remit · d delete · q close",
      ),
    );
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
