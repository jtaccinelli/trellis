import type { Domain } from "~/extensions/storage/domains/types.ts";

import type { Theme } from "@earendil-works/pi-coding-agent";

import { DynamicBorder } from "@earendil-works/pi-coding-agent";
import {
  Container,
  HStack,
  Spacer,
} from "@earendil-works/pi-tui";

import { DomainDetailsComponent } from "~/extensions/components/domain-details.ts";
import { DomainListComponent } from "~/extensions/components/domain-list.ts";
import { HelpLineComponent } from "~/extensions/components/help-line.ts";
import { TitleComponent } from "~/extensions/components/title.ts";
import { mapInputs } from "~/extensions/utils.ts";

export type DomainManagerAction =
  | { kind: "close" }
  | { kind: "delete"; domain: Domain }
  | { kind: "edit"; domain: Domain };

interface DomainManagerComponentOptions {
  domains: Domain[];
  done: (action: DomainManagerAction) => void;
  initialSelectedDomainId?: string;
  requestRender: () => void;
  theme: Theme;
}

export class DomainManagerComponent extends Container {
  private readonly done: (action: DomainManagerAction) => void;
  private readonly list: DomainListComponent;

  constructor(options: DomainManagerComponentOptions) {
    super();

    this.done = options.done;
    const initialSelectedIndex = options.initialSelectedDomainId
      ? Math.max(
        0,
        options.domains.findIndex(
          (domain) => domain.id === options.initialSelectedDomainId,
        ),
      )
      : 0;

    this.list = new DomainListComponent(
      options.domains,
      initialSelectedIndex,
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
    const domain = this.list.getSelectedDomain();

    const handleClose = () => this.done({ kind: "close" });
    const handleDelete = () => {
      if (domain) {
        this.done({ kind: "delete", domain });
      }
    };
    const handleEdit = () => {
      if (domain) {
        this.done({ kind: "edit", domain });
      }
    };

    if (
      mapInputs(data, {
        d: handleDelete,
        e: handleEdit,
        escape: handleClose,
        q: handleClose,
      })
    ) {
      return;
    }

    this.list.handleInput(data);
  }
}
