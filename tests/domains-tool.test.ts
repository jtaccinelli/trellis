import { strict as assert } from "node:assert";

import type { ExtensionAPI, ToolDefinition } from "@earendil-works/pi-coding-agent";

import { SQLiteStorageAdapter } from "~/extensions/storage/index.ts";
import {
  registerCreatingDomainTool,
  registerDeletingDomainTool,
  registerGettingDomainTool,
  registerListingDomainsTool,
  registerUpdatingDomainTool,
} from "~/extensions/tools/domains/index.ts";

async function run() {
  const registeredTools: ToolDefinition[] = [];
  const pi = {
    registerTool: (tool: ToolDefinition) => {
      registeredTools.push(tool);
    },
  } as unknown as ExtensionAPI;

  const storage = new SQLiteStorageAdapter({ databasePath: ":memory:" });
  await storage.init();
  await storage.migrate();

  registerCreatingDomainTool(pi, storage);
  registerGettingDomainTool(pi, storage);
  registerUpdatingDomainTool(pi, storage);
  registerDeletingDomainTool(pi, storage);
  registerListingDomainsTool(pi, storage);

  for (const name of [
    "creating-domain",
    "getting-domain",
    "updating-domain",
    "deleting-domain",
    "listing-domains",
  ]) {
    assert.ok(
      registeredTools.some((tool) => tool.name === name),
      `${name} tool should be registered`,
    );
  }

  const creatingTool = registeredTools.find(
    (tool) => tool.name === "creating-domain",
  )!;
  const gettingTool = registeredTools.find(
    (tool) => tool.name === "getting-domain",
  )!;
  const updatingTool = registeredTools.find(
    (tool) => tool.name === "updating-domain",
  )!;
  const deletingTool = registeredTools.find(
    (tool) => tool.name === "deleting-domain",
  )!;
  const listingTool = registeredTools.find(
    (tool) => tool.name === "listing-domains",
  )!;

  const domain = {
    id: "frontend",
    name: "Frontend",
    description: "Browser-facing code.",
    remit: "Owns UI components, client-side state, and browser APIs.",
    exclusions: ["backend", "database", "infrastructure"],
  };

  const created = await (creatingTool.execute as any)("call-1", domain);
  assert.deepEqual(created.details.domain, domain);
  assert.equal(created.details.existing, undefined);

  const duplicate = await (creatingTool.execute as any)("call-2", {
    ...domain,
    name: "Different name",
  });
  assert.equal(duplicate.details.domain, undefined);
  assert.deepEqual(duplicate.details.existing, domain);

  const fetched = await (gettingTool.execute as any)("call-3", {
    id: domain.id,
  });
  assert.deepEqual(fetched.details.domain, domain);

  const missing = await (gettingTool.execute as any)("call-4", {
    id: "missing",
  });
  assert.equal(missing.details.domain, undefined);

  const updated = await (updatingTool.execute as any)("call-5", {
    ...domain,
    description: "Updated description.",
  });
  assert.equal(updated.details.updated, true);
  assert.equal(updated.details.domain?.description, "Updated description.");

  const missingUpdate = await (updatingTool.execute as any)("call-6", {
    ...domain,
    id: "missing",
  });
  assert.equal(missingUpdate.details.updated, false);

  const listed = await (listingTool.execute as any)("call-7", {});
  assert.equal(listed.details.domains.length, 1);
  assert.equal(listed.details.domains[0].description, "Updated description.");

  const deleted = await (deletingTool.execute as any)("call-8", {
    id: domain.id,
  });
  assert.equal(deleted.details.deleted, true);

  const missingDelete = await (deletingTool.execute as any)("call-9", {
    id: domain.id,
  });
  assert.equal(missingDelete.details.deleted, false);

  const emptyList = await (listingTool.execute as any)("call-10", {});
  assert.equal(emptyList.details.domains.length, 0);

  await storage.close();

  console.log("Domain tool tests passed.");
}

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
