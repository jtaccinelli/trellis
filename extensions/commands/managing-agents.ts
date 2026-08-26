import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import type { AgentManager } from "~/extensions/managers/agent-manager.ts";
import type { Agent } from "~/extensions/storage/agents/types.ts";
import type { StorageAdapter } from "~/extensions/storage/types.ts";

import {
  AgentManagerComponent,
  type AgentManagerAction,
  type CoordinatorData,
  type DomainData,
} from "~/extensions/components/agent-manager.ts";

function isActiveCoordinator(agent: Agent): boolean {
  return agent.status === "running";
}

function coordinatorPriority(a: CoordinatorData, b: CoordinatorData): number {
  const aActive = isActiveCoordinator(a.agent) ? 0 : 1;
  const bActive = isActiveCoordinator(b.agent) ? 0 : 1;
  if (aActive !== bActive) return aActive - bActive;
  return a.agent.started_at - b.agent.started_at;
}

function domainPriority(a: DomainData, b: DomainData): number {
  if (a.activeCount > 0 && b.activeCount === 0) return -1;
  if (a.activeCount === 0 && b.activeCount > 0) return 1;
  return a.domain.name.localeCompare(b.domain.name);
}

export function registerManagingAgentsCommand(
  pi: ExtensionAPI,
  storage: StorageAdapter,
  agentManager: AgentManager,
): void {
  pi.registerCommand("managing-agents", {
    description:
      "Open an interactive TUI for managing coordinators, domain agents, and queues",
    handler: async (_args, ctx) => {
      if (ctx.mode !== "tui") {
        ctx.ui.notify("/managing-agents requires TUI mode", "error");
        return;
      }

      let selectedView: "coordinators" | "domains" | undefined;
      let selectedCoordinatorIndex = 0;
      let selectedDomainIndex = 0;
      let running = true;

      while (running) {
        const agents = await storage.agents.list();

        const coordinatorAgents = agents
          .filter((agent) => agent.role === "coordinator")
          .sort((a, b) => a.started_at - b.started_at);

        const coordinators: CoordinatorData[] = await Promise.all(
          coordinatorAgents.map(async (agent) => {
            const notes = await storage.notes.listByRecipient(
              agent.request_id,
              agent.id,
            );
            return { agent, notes };
          }),
        );
        coordinators.sort(coordinatorPriority);

        const domains = await storage.domains.list();
        const domainsData: DomainData[] = await Promise.all(
          domains.map(async (domain) => {
            const queueItems = await storage.queue.listByDomain(domain.id);
            const domainAgents = agents.filter(
              (agent) => agent.role === "domain" && agent.domain_id === domain.id,
            );
            const activeQueueCount = queueItems.filter(
              (item) => item.status === "queued" || item.status === "running",
            ).length;
            const activeDomainAgents = domainAgents.filter(
              (agent) => agent.status === "running",
            ).length;
            const activeCount = activeQueueCount + activeDomainAgents;
            return { domain, queueItems, domainAgents, activeCount };
          }),
        );
        domainsData.sort(domainPriority);

        selectedCoordinatorIndex = Math.min(
          selectedCoordinatorIndex,
          Math.max(0, coordinators.length - 1),
        );
        selectedDomainIndex = Math.min(
          selectedDomainIndex,
          Math.max(0, domainsData.length - 1),
        );

        const action = await ctx.ui.custom<AgentManagerAction | undefined>(
          (tui, theme, _keybindings, done) =>
            new AgentManagerComponent({
              coordinators,
              domains: domainsData,
              done,
              initialCoordinatorIndex: selectedCoordinatorIndex,
              initialDomainIndex: selectedDomainIndex,
              initialView: selectedView,
              requestRender: () => tui.requestRender(),
              theme,
            }),
        );

        if (!action) {
          break;
        }

        switch (action.kind) {
          case "close": {
            running = false;
            break;
          }
          case "stop_coordinator": {
            selectedCoordinatorIndex = action.selectedIndex;
            selectedView = "coordinators";

            const confirmed = await ctx.ui.confirm(
              "Stop coordinator?",
              `Send SIGTERM to "${action.agentName}" (${action.agentId})?`,
            );
            if (confirmed) {
              const stopped = agentManager.stopAgentProcess(action.agentId);
              ctx.ui.notify(
                stopped
                  ? `Coordinator "${action.agentId}" stopping.`
                  : `Coordinator "${action.agentId}" is not running.`,
                stopped ? "info" : "warning",
              );
            }
            break;
          }
          default: {
            running = false;
            break;
          }
        }
      }
    },
  });
}
