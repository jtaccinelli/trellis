import type { Theme } from "@earendil-works/pi-coding-agent";
import { DynamicBorder } from "@earendil-works/pi-coding-agent";
import type { Component } from "@earendil-works/pi-tui";
import {
  Container,
  HStack,
  Spacer,
  Text,
  VStack,
  truncateToWidth,
} from "@earendil-works/pi-tui";

import type { Agent } from "~/extensions/storage/agents/types.ts";
import type { Domain } from "~/extensions/storage/domains/types.ts";
import type { Note } from "~/extensions/storage/notes/types.ts";
import type { QueueItem } from "~/extensions/storage/queue/types.ts";
import { mapInputs, parseJson } from "~/extensions/utils/index.ts";
import { HelpLineComponent } from "~/extensions/components/help-line.ts";
import { TitleComponent } from "~/extensions/components/title.ts";

export type AgentManagerAction =
  | { kind: "close" }
  | {
      kind: "stop_coordinator";
      agentId: string;
      agentName: string;
      selectedIndex: number;
    };

export interface CoordinatorData {
  agent: Agent;
  notes: Note[];
}

export interface DomainData {
  domain: Domain;
  queueItems: QueueItem[];
  domainAgents: Agent[];
  activeCount: number;
}

interface AgentManagerComponentOptions {
  coordinators: CoordinatorData[];
  domains: DomainData[];
  done: (action: AgentManagerAction) => void;
  initialCoordinatorIndex?: number;
  initialDomainIndex?: number;
  initialView?: "coordinators" | "domains";
  requestRender: () => void;
  theme: Theme;
}

export class AgentManagerComponent extends Container {
  private readonly done: (action: AgentManagerAction) => void;
  private readonly requestRender: () => void;
  private readonly theme: Theme;
  private readonly coordinators: CoordinatorData[];
  private readonly domains: DomainData[];
  private view: "coordinators" | "domains";

  private readonly rootStack: VStack;
  private readonly leftStack: VStack;
  private readonly rightStack: VStack;

  private currentList:
    | CoordinatorListComponent
    | DomainListComponent
    | undefined;
  private currentListHeader: Text | undefined;

  constructor(options: AgentManagerComponentOptions) {
    super();

    this.done = options.done;
    this.requestRender = options.requestRender;
    this.theme = options.theme;
    this.coordinators = options.coordinators;
    this.domains = options.domains;
    this.view = options.initialView ?? "coordinators";

    this.rootStack = new VStack([], { gap: 0, align: "stretch" });
    this.addChild(this.rootStack);

    this.rootStack.addChild(
      new DynamicBorder((s: string) => this.theme.fg("accent", s)),
    );
    this.rootStack.addChild(new TitleComponent(this.theme, "Managing agents"));
    this.rootStack.addChild(
      new AgentTypeNavComponent(this.view, this.theme),
    );
    this.rootStack.addChild(new Spacer(1));

    this.leftStack = new VStack([], { gap: 1, align: "stretch" });
    this.rightStack = new VStack([], { gap: 1, align: "stretch" });

    this.rootStack.addChild(
      new HStack(
        [
          {
            component: this.leftStack,
            minSize: 28,
            maxSize: 40,
            grow: 0,
            shrink: 1,
          },
          {
            component: this.rightStack,
            minSize: 24,
            grow: 1,
            shrink: 1,
          },
        ],
        { gap: 2, align: "stretch" },
      ),
    );

    this.rootStack.addChild(new Spacer(1));
    this.rootStack.addChild(
      new HelpLineComponent(
        this.theme,
        "↑/↓ or j/k navigate · tab/←/→ switch type · c/d jump · x stop coordinator · q close",
      ),
    );
    this.rootStack.addChild(
      new DynamicBorder((s: string) => this.theme.fg("accent", s)),
    );

    this.refreshPanels(
      options.initialCoordinatorIndex ?? 0,
      options.initialDomainIndex ?? 0,
    );
  }

  handleInput(data: string): void {
    if (
      mapInputs(data, {
        escape: () => this.done({ kind: "close" }),
        q: () => this.done({ kind: "close" }),
        c: () => this.setView("coordinators"),
        d: () => this.setView("domains"),
        tab: () =>
          this.setView(
            this.view === "coordinators" ? "domains" : "coordinators",
          ),
        right: () =>
          this.setView(
            this.view === "coordinators" ? "domains" : "coordinators",
          ),
        left: () =>
          this.setView(
            this.view === "coordinators" ? "domains" : "coordinators",
          ),
      })
    ) {
      return;
    }

    if (this.view === "coordinators") {
      const list = this.currentList as CoordinatorListComponent | undefined;
      const selected = list?.getSelected?.();
      if (
        selected &&
        selected.agent.role === "coordinator" &&
        selected.agent.status === "running"
      ) {
        if (
          mapInputs(data, {
            x: () =>
              this.done({
                kind: "stop_coordinator",
                agentId: selected.agent.id,
                agentName: selected.agent.name,
                selectedIndex: list?.getSelectedIndex() ?? 0,
              }),
          })
        ) {
          return;
        }
      }
    }

    this.currentList?.handleInput?.(data);
  }

  invalidate(): void {
    super.invalidate();
  }

  private setView(view: "coordinators" | "domains"): void {
    if (this.view === view) return;
    this.view = view;
    this.refreshPanels(
      this.currentList?.getSelectedIndex?.() ?? 0,
      this.currentList?.getSelectedIndex?.() ?? 0,
    );
    this.requestRender();
  }

  private refreshPanels(
    coordinatorInitialIndex: number,
    domainInitialIndex: number,
  ): void {
    this.leftStack.clear();
    this.rightStack.clear();

    if (this.currentListHeader) {
      this.rootStack.removeChild(this.currentListHeader);
      this.currentListHeader = undefined;
    }

    this.currentListHeader = new Text(
      this.theme.fg(
        "muted",
        this.theme.bold(
          this.view === "coordinators" ? "Coordinators" : "Domains",
        ),
      ),
    );
    this.leftStack.addChild(this.currentListHeader);

    if (this.view === "coordinators") {
      const list = new CoordinatorListComponent(
        this.coordinators,
        this.theme,
        this.requestRender,
        coordinatorInitialIndex,
      );
      this.currentList = list;
      this.leftStack.addChild(list, { grow: 1 });

      const detail = new CoordinatorDetailComponent(
        () => list.getSelected(),
        this.theme,
      );
      this.rightStack.addChild(
        new Text(
          this.theme.fg("muted", this.theme.bold("Coordinator details")),
        ),
      );
      this.rightStack.addChild(detail, { grow: 1 });
    } else {
      const list = new DomainListComponent(
        this.domains,
        this.theme,
        this.requestRender,
        domainInitialIndex,
      );
      this.currentList = list;
      this.leftStack.addChild(list, { grow: 1 });

      const detail = new DomainDetailComponent(
        () => list.getSelected(),
        this.theme,
      );
      this.rightStack.addChild(
        new Text(
          this.theme.fg("muted", this.theme.bold("Domain queue")),
        ),
      );
      this.rightStack.addChild(detail, { grow: 1 });
    }
  }
}

class AgentTypeNavComponent implements Component {
  constructor(
    private readonly selectedView: "coordinators" | "domains",
    private readonly theme: Theme,
  ) {}

  invalidate(): void {
    // Cache-free component.
  }

  render(width: number): string[] {
    const coordinatorsTab = this.theme.fg(
      this.selectedView === "coordinators" ? "accent" : "dim",
      this.selectedView === "coordinators"
        ? this.theme.bold("[ Coordinators ]")
        : "[ Coordinators ]",
    );
    const domainsTab = this.theme.fg(
      this.selectedView === "domains" ? "accent" : "dim",
      this.selectedView === "domains"
        ? this.theme.bold("[ Domains ]")
        : "[ Domains ]",
    );
    return [
      truncateToWidth(`${coordinatorsTab}    ${domainsTab}`, width),
    ];
  }
}

class CoordinatorListComponent implements Component {
  private selectedIndex: number;

  constructor(
    private readonly coordinators: CoordinatorData[],
    private readonly theme: Theme,
    private readonly requestRender: () => void,
    initialSelectedIndex = 0,
  ) {
    this.selectedIndex = Math.min(
      Math.max(0, initialSelectedIndex),
      Math.max(0, this.coordinators.length - 1),
    );
  }

  getSelected(): CoordinatorData | undefined {
    return this.coordinators[this.selectedIndex];
  }

  getSelectedIndex(): number {
    return this.selectedIndex;
  }

  handleInput(data: string): void {
    const navigateUp = () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.requestRender();
    };
    const navigateDown = () => {
      this.selectedIndex = Math.min(
        this.coordinators.length - 1,
        this.selectedIndex + 1,
      );
      this.requestRender();
    };

    mapInputs(data, {
      up: navigateUp,
      k: navigateUp,
      down: navigateDown,
      j: navigateDown,
    });
  }

  invalidate(): void {
    // Cache-free component.
  }

  render(width: number): string[] {
    if (this.coordinators.length === 0) {
      return [truncateToWidth(this.theme.fg("dim", "No coordinators."), width)];
    }

    return this.coordinators.map((data, index) => {
      const { agent } = data;
      const isSelected = index === this.selectedIndex;
      const isRunning = agent.status === "running";

      const marker = isSelected ? this.theme.fg("accent", "› ") : "  ";
      const indicator = isRunning ? this.theme.fg("accent", "● ") : "  ";
      const noteCount = data.notes.length;
      const suffix = noteCount > 0
        ? ` · ${noteCount} note${noteCount === 1 ? "" : "s"}`
        : "";
      const preview = `${agent.name}${isRunning ? "" : ` · ${agent.status}`}${agent.pid ? ` · pid ${agent.pid}` : ""}${suffix}`;
      const label = isSelected ? this.theme.bold(preview) : preview;
      const styled = isRunning
        ? this.theme.fg("text", label)
        : this.theme.fg("dim", label);

      return truncateToWidth(`${marker}${indicator}${styled}`, width);
    });
  }
}

class DomainListComponent implements Component {
  private selectedIndex: number;

  constructor(
    private readonly domains: DomainData[],
    private readonly theme: Theme,
    private readonly requestRender: () => void,
    initialSelectedIndex = 0,
  ) {
    this.selectedIndex = Math.min(
      Math.max(0, initialSelectedIndex),
      Math.max(0, this.domains.length - 1),
    );
  }

  getSelected(): DomainData | undefined {
    return this.domains[this.selectedIndex];
  }

  getSelectedIndex(): number {
    return this.selectedIndex;
  }

  handleInput(data: string): void {
    const navigateUp = () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.requestRender();
    };
    const navigateDown = () => {
      this.selectedIndex = Math.min(
        this.domains.length - 1,
        this.selectedIndex + 1,
      );
      this.requestRender();
    };

    mapInputs(data, {
      up: navigateUp,
      k: navigateUp,
      down: navigateDown,
      j: navigateDown,
    });
  }

  invalidate(): void {
    // Cache-free component.
  }

  render(width: number): string[] {
    if (this.domains.length === 0) {
      return [truncateToWidth(this.theme.fg("dim", "No domains."), width)];
    }

    return this.domains.map((data, index) => {
      const { domain, activeCount } = data;
      const isSelected = index === this.selectedIndex;
      const isDimmed = activeCount === 0;

      const marker = isSelected ? this.theme.fg("accent", "› ") : "  ";
      const indicator = activeCount > 0 ? this.theme.fg("accent", "● ") : "  ";
      const preview = `${domain.name}${activeCount > 0 ? ` · ${activeCount} active` : ""}`;
      const label = isSelected ? this.theme.bold(preview) : preview;
      const styled = isDimmed ? this.theme.fg("dim", label) : label;

      return truncateToWidth(`${marker}${indicator}${styled}`, width);
    });
  }
}

class CoordinatorDetailComponent implements Component {
  constructor(
    private readonly getSelected: () => CoordinatorData | undefined,
    private readonly theme: Theme,
  ) {}

  invalidate(): void {
    // Cache-free component.
  }

  render(width: number): string[] {
    const data = this.getSelected();
    if (!data) {
      return [
        truncateToWidth(this.theme.fg("dim", "No coordinator selected."), width),
      ];
    }

    const { agent, notes } = data;
    const lines: string[] = [
      truncateToWidth(this.theme.fg("accent", this.theme.bold(agent.name)), width),
      truncateToWidth(this.theme.fg("muted", `id:      ${agent.id}`), width),
      truncateToWidth(
        this.theme.fg(
          agent.status === "running" ? "accent" : "muted",
          `status:  ${agent.status}${agent.status === "running" ? " (processing)" : ""}`,
        ),
        width,
      ),
      truncateToWidth(
        this.theme.fg("muted", `started: ${new Date(agent.started_at).toLocaleString()}`),
        width,
      ),
      "",
      truncateToWidth(
        this.theme.fg("text", this.theme.bold(`Pending notes (${notes.length})`)),
        width,
      ),
    ];

    if (notes.length === 0) {
      lines.push(truncateToWidth(this.theme.fg("dim", "No pending notes."), width));
    } else {
      for (const note of notes) {
        const payload = this.previewNotePayload(note);
        lines.push(
          truncateToWidth(
            this.theme.fg("muted", `from ${note.from_agent_id}`),
            width,
          ),
        );
        lines.push(truncateToWidth(payload, width));
        lines.push("");
      }
    }

    return lines;
  }

  private previewNotePayload(note: Note): string {
    try {
      const parsed = parseJson(note.payload);
      return JSON.stringify(parsed).slice(0, 120);
    } catch {
      return String(note.payload).slice(0, 120);
    }
  }
}

class DomainDetailComponent implements Component {
  constructor(
    private readonly getSelected: () => DomainData | undefined,
    private readonly theme: Theme,
  ) {}

  invalidate(): void {
    // Cache-free component.
  }

  render(width: number): string[] {
    const data = this.getSelected();
    if (!data) {
      return [
        truncateToWidth(this.theme.fg("dim", "No domain selected."), width),
      ];
    }

    const { domain, queueItems, domainAgents, activeCount } = data;
    const activeAgents = domainAgents.filter(
      (agent) => agent.status === "running",
    );

    const lines: string[] = [
      truncateToWidth(this.theme.fg("accent", this.theme.bold(domain.name)), width),
      truncateToWidth(this.theme.fg("muted", `id: ${domain.id}`), width),
      "",
      truncateToWidth(
        this.theme.fg(
          "text",
          this.theme.bold(`Queue items (${activeCount} active / ${queueItems.length} total)`),
        ),
        width,
      ),
    ];

    if (queueItems.length === 0 && domainAgents.length === 0) {
      lines.push(truncateToWidth(this.theme.fg("dim", "No queue items or agents."), width));
    } else {
      for (const item of queueItems) {
        lines.push(
          truncateToWidth(
            `${item.status.toUpperCase()} · ${item.id}`,
            width,
          ),
        );
        lines.push(
          truncateToWidth(
            this.theme.fg("muted", `  coordinator: ${item.enqueued_by_coordinator_id}`),
            width,
          ),
        );
        lines.push(
          truncateToWidth(
            this.theme.fg("muted", `  requirement: ${item.requirement_id}${item.domain_agent_id ? ` · agent ${item.domain_agent_id}` : ""}`),
            width,
          ),
        );
        lines.push("");
      }

      if (domainAgents.length > 0) {
        lines.push(
          truncateToWidth(
            this.theme.fg(
              "text",
              this.theme.bold(`Domain agents (${activeAgents.length} active / ${domainAgents.length} total)`),
            ),
            width,
          ),
        );
        for (const agent of domainAgents) {
          const status = agent.status === "running"
            ? this.theme.fg("accent", agent.status)
            : this.theme.fg("dim", agent.status);
          lines.push(
            truncateToWidth(
              `${agent.name} · ${status}${agent.pid ? ` · pid ${agent.pid}` : ""}`,
              width,
            ),
          );
        }
        lines.push("");
      }
    }

    return lines;
  }
}
