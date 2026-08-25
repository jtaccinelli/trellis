import type {
  ExtensionCommandContext,
  Theme,
} from "@earendil-works/pi-coding-agent";

import { DynamicBorder } from "@earendil-works/pi-coding-agent";
import {
  Container,
  HStack,
  matchesKey,
  Spacer,
} from "@earendil-works/pi-tui";

import type { Domain } from "~/extensions/storage/domains/types.ts";
import type { StorageAdapter } from "~/extensions/storage/types.ts";

import { DomainDetailsComponent } from "~/extensions/components/domain-details.ts";
import { DomainListComponent } from "~/extensions/components/domain-list.ts";
import { HelpLineComponent } from "~/extensions/components/help-line.ts";
import { TitleComponent } from "~/extensions/components/title.ts";

type ManagedUI = ExtensionCommandContext["ui"];

interface ManagingDomainsComponentOptions {
  domains: Domain[];
  done: () => void;
  initialSelectedIndex?: number;
  requestRender: () => void;
  storage: StorageAdapter;
  theme: Theme;
  ui: ManagedUI;
}

export class ManagingDomainsComponent extends Container {
  private disposed = false;
  private readonly done: () => void;
  private readonly list: DomainListComponent;
  private readonly requestRender: () => void;
  private readonly storage: StorageAdapter;
  private readonly theme: Theme;
  private readonly ui: ManagedUI;

  constructor(options: ManagingDomainsComponentOptions) {
    super();

    this.done = options.done;
    this.requestRender = options.requestRender;
    this.storage = options.storage;
    this.theme = options.theme;
    this.ui = options.ui;

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
    this.addChild(new TitleComponent(options.theme, "Managing domains"));
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

  dispose(): void {
    this.disposed = true;
  }

  handleInput(data: string): void {
    if (matchesKey(data, "q") || matchesKey(data, "escape")) {
      this.done();
      return;
    }

    const domain = this.list.getSelectedDomain();
    if (!domain) {
      return;
    }

    if (matchesKey(data, "d")) {
      void this.deleteDomain(domain).catch((error) => {
        this.ui.notify(
          `Failed to delete domain: ${this.errorMessage(error)}`,
          "error",
        );
      });
      return;
    }

    if (matchesKey(data, "e")) {
      void this.editRemit(domain).catch((error) => {
        this.ui.notify(
          `Failed to update domain: ${this.errorMessage(error)}`,
          "error",
        );
      });
      return;
    }

    this.list.handleInput(data);
  }

  private async deleteDomain(domain: Domain): Promise<void> {
    const confirmed = await this.ui.confirm(
      "Delete domain?",
      `Remove "${domain.name}" (${domain.id})? This cannot be undone.`,
    );
    if (this.disposed || !confirmed) {
      return;
    }

    await this.storage.domains.delete(domain.id);
    if (this.disposed) {
      return;
    }

    await this.refresh(domain.id);
    this.ui.notify(`Domain "${domain.id}" deleted.`, "info");
  }

  private async editRemit(domain: Domain): Promise<void> {
    const remit = await this.ui.input("Edit remit", domain.remit);
    if (this.disposed || remit === undefined) {
      return;
    }

    await this.storage.domains.update({ ...domain, remit });
    if (this.disposed) {
      return;
    }

    await this.refresh(domain.id);
    this.ui.notify(`Domain "${domain.id}" updated.`, "info");
  }

  private async refresh(preserveDomainId?: string): Promise<void> {
    const domains = await this.storage.domains.list();
    if (this.disposed) {
      return;
    }

    this.list.updateDomains(domains, preserveDomainId);
    this.requestRender();
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
