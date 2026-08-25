import { strict as assert } from "node:assert";

import { SQLiteStorageAdapter } from "~/extensions/storage/index.ts";

async function run() {
  const storage = new SQLiteStorageAdapter({ databasePath: ":memory:" });

  await storage.init();
  await storage.migrate();

  const domain = {
    id: "frontend",
    name: "Frontend",
    description: "Browser-facing code.",
    remit: "Owns UI components, client-side state, and browser APIs.",
    exclusions: ["backend", "database", "infrastructure"],
  };

  await storage.domains.create(domain);

  const listed = await storage.domains.list();
  assert.equal(listed.length, 1);
  assert.deepEqual(listed[0], domain);

  const fetched = await storage.domains.get("frontend");
  assert.deepEqual(fetched, domain);

  const updated = { ...domain, description: "Updated description." };
  const updateResult = await storage.domains.update(updated);
  assert.equal(updateResult, true);

  const fetchedUpdated = await storage.domains.get("frontend");
  assert.equal(fetchedUpdated?.description, "Updated description.");

  const missing = await storage.domains.get("missing");
  assert.equal(missing, undefined);

  await storage.close();

  console.log("Storage tests passed.");
}

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
