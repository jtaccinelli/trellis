/**
 * Trellis — pi extension entry point.
 *
 * Factory distinguishes root mode from agent mode via TRELLIS_AGENT_ID and
 * TRELLIS_ROLE. Root mode registers tools, commands, lifecycle hooks, and the
 * deterministic runtime managers. Agent modes register only the ambient tools
 * required for that role.
 *
 * Tools and commands use gerund-noun naming (no trellis_ prefix):
 *   - scoping-item, delegating-requirement, spawning-agent
 *   - sending-message, receiving-message, listing-agents
 *   - creating-domain, listing-domains
 *   - inspecting-scope, inspecting-queue, resolving-conflict
 *   - /scoping-item, /building-item, /reviewing-item, /cataloging-project, /inspecting-tree
 *
 * Runtime managers live in `extensions/managers/`:
 *   - QueueManager — owns each domain's shared FIFO queue.
 *   - NotificationManager — pushes domain-agent completion to coordinators.
 *   - CoordinatorManager — coordinator lifecycle and session orchestration.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { registerManagingDomainsCommand } from "~/extensions/commands/domains/managing-domains.ts";
import {
  CoordinatorManager,
  NotificationManager,
  QueueManager,
} from "~/extensions/managers/index.ts";
import { SQLiteStorageAdapter } from "~/extensions/storage/index.ts";
import {
  registerCreatingDomainTool,
  registerDeletingDomainTool,
  registerGettingDomainTool,
  registerListingDomainsTool,
  registerUpdatingDomainTool,
} from "~/extensions/tools/domains/index.ts";

export default function extension(pi: ExtensionAPI) {
  const databasePath = process.env.TRELLIS_DATABASE_PATH;
  const storage = new SQLiteStorageAdapter({ databasePath });

  let queueManager: QueueManager | undefined;
  let notificationManager: NotificationManager | undefined;
  let coordinatorManager: CoordinatorManager | undefined;

  pi.on("session_start", async (_event, ctx) => {
    await storage.init();
    await storage.migrate();

    registerCreatingDomainTool(pi, storage);
    registerGettingDomainTool(pi, storage);
    registerUpdatingDomainTool(pi, storage);
    registerDeletingDomainTool(pi, storage);
    registerListingDomainsTool(pi, storage);

    registerManagingDomainsCommand(pi, storage);

    queueManager = new QueueManager({ storage });
    notificationManager = new NotificationManager({ storage });
    coordinatorManager = new CoordinatorManager({ storage });

    ctx.ui.notify("Trellis loaded", "info");
  });

  pi.on("session_shutdown", async () => {
    await storage.close();
  });

  // TODO: register remaining tools (scoping, delegation, agents, inspection, cataloging).
  // TODO: register commands in root mode.
  // TODO: register ambient tools in coordinator / domain / background agent modes.
}
