// extensions/components/managing-domains.ts
import {
  matchesKey,
  truncateToWidth,
  wrapTextWithAnsi
} from "@earendil-works/pi-tui";
var ManagingDomainsComponent = class {
  domains;
  done;
  redraw;
  selectedIndex;
  storage;
  theme;
  ui;
  constructor(options) {
    this.domains = options.domains;
    this.done = options.done;
    this.redraw = options.redraw;
    this.selectedIndex = 0;
    this.storage = options.storage;
    this.theme = options.theme;
    this.ui = options.ui;
  }
  async refreshDomains() {
    this.domains = await this.storage.domains.list();
    if (this.selectedIndex >= this.domains.length) {
      this.selectedIndex = Math.max(0, this.domains.length - 1);
    }
    this.redraw();
  }
  handleInput(data) {
    if (matchesKey(data, "up") || matchesKey(data, "k")) {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      return;
    }
    if (matchesKey(data, "down") || matchesKey(data, "j")) {
      this.selectedIndex = Math.min(
        this.domains.length - 1,
        this.selectedIndex + 1
      );
      return;
    }
    if (matchesKey(data, "q") || matchesKey(data, "escape")) {
      this.done();
      return;
    }
    const domain = this.domains[this.selectedIndex];
    if (!domain) return;
    if (matchesKey(data, "d")) {
      this.ui.confirm(
        "Delete domain?",
        `Remove "${domain.name}" (${domain.id})? This cannot be undone.`
      ).then(async (confirmed) => {
        if (confirmed) {
          await this.storage.domains.delete(domain.id);
          this.ui.notify(`Domain "${domain.id}" deleted.`, "info");
          await this.refreshDomains();
        }
      });
      return;
    }
    if (matchesKey(data, "e")) {
      this.ui.input("Edit remit", domain.remit).then(async (remit) => {
        if (remit === void 0) return;
        const updated = { ...domain, remit };
        await this.storage.domains.update(updated);
        this.ui.notify(`Domain "${domain.id}" updated.`, "info");
        await this.refreshDomains();
      });
    }
  }
  invalidate() {
    this.redraw();
  }
  render(width) {
    const theme = this.theme;
    const listWidth = Math.min(28, Math.floor(width * 0.35));
    const detailWidth = Math.max(20, width - listWidth - 3);
    const lines = [];
    lines.push(
      truncateToWidth(
        theme.fg("accent", theme.bold("Managing domains")),
        width
      )
    );
    if (this.domains.length === 0) {
      lines.push("");
      lines.push(theme.fg("dim", "No domains defined."));
      lines.push(theme.fg("dim", "Press q to close."));
      return lines;
    }
    const domain = this.domains[this.selectedIndex];
    const maxVisible = Math.max(3, 20);
    const leftLines = [];
    for (let index = 0; index < this.domains.length; index++) {
      const item = this.domains[index];
      const isSelected = index === this.selectedIndex;
      const marker = isSelected ? theme.fg("accent", "\u203A ") : "  ";
      const label = isSelected ? theme.fg("accent", theme.bold(item.name)) : theme.fg("text", item.name);
      leftLines.push(
        truncateToWidth(`${marker}${label}`, listWidth - 1)
      );
    }
    const rightLines = [];
    rightLines.push(theme.fg("accent", theme.bold(domain.name)));
    rightLines.push(theme.fg("muted", `id: ${domain.id}`));
    rightLines.push("");
    rightLines.push(theme.fg("muted", "Description"));
    rightLines.push(...wrapTextWithAnsi(domain.description, detailWidth));
    rightLines.push("");
    rightLines.push(theme.fg("muted", "Remit"));
    rightLines.push(...wrapTextWithAnsi(domain.remit, detailWidth));
    rightLines.push("");
    rightLines.push(theme.fg("muted", "Exclusions"));
    if (domain.exclusions.length === 0) {
      rightLines.push(theme.fg("dim", "None"));
    } else {
      for (const exclusion of domain.exclusions) {
        rightLines.push(`\u2022 ${truncateToWidth(exclusion, detailWidth - 2)}`);
      }
    }
    const rowCount = Math.max(leftLines.length, rightLines.length);
    const verticalBorder = theme.fg("borderMuted", "\u2502");
    for (let row = 0; row < rowCount; row++) {
      const left = leftLines[row] ?? "";
      const right = rightLines[row] ?? "";
      const paddedLeft = left.padEnd(listWidth, " ");
      lines.push(
        truncateToWidth(
          `${paddedLeft} ${verticalBorder} ${right}`,
          width
        )
      );
    }
    lines.push("");
    lines.push(
      truncateToWidth(
        theme.fg(
          "dim",
          "\u2191/\u2193 navigate \u2022 e edit remit \u2022 d delete \u2022 q close"
        ),
        width
      )
    );
    return lines;
  }
};

// extensions/commands/domains/managing-domains.ts
function registerManagingDomainsCommand(pi, storage) {
  pi.registerCommand("managing-domains", {
    description: "Open an interactive TUI for domain management",
    handler: async (_args, ctx) => {
      if (ctx.mode !== "tui") {
        ctx.ui.notify("/managing-domains requires TUI mode", "error");
        return;
      }
      const domains = await storage.domains.list();
      await ctx.ui.custom((tui, theme, _keybindings, done) => {
        return new ManagingDomainsComponent({
          domains,
          done,
          redraw: () => tui.invalidate(),
          storage,
          theme,
          ui: ctx.ui
        });
      });
    }
  });
}

// extensions/managers/coordinator-manager.ts
var CoordinatorManager = class {
  storage;
  constructor(options) {
    this.storage = options.storage;
  }
  // TODO: start root/child coordinators via launcher.
  // TODO: handle trellis:notification_pending events.
  // TODO: assemble final scope document and open sign-off gate.
};

// extensions/managers/notification-manager.ts
var NotificationManager = class {
  storage;
  constructor(options) {
    this.storage = options.storage;
  }
  // TODO: subscribe to pi.events, write messages via storage adapter,
  // and dispatch trellis:notification_pending events.
};

// extensions/managers/queue-manager.ts
var QueueManager = class {
  storage;
  // domain_id -> running domain_agent_id | null
  running = /* @__PURE__ */ new Map();
  constructor(options) {
    this.storage = options.storage;
  }
  // TODO: subscribe to trellis:work_item_enqueued events.
  // TODO: spawn domain agents via launcher on head item.
  // TODO: register child-exit handlers to reap results and drain queues.
  // TODO: access domains through storage.domains.*
};

// extensions/storage/domains/handler.ts
import "node:sqlite";

// extensions/utils.ts
function json(value) {
  return JSON.stringify(value);
}
function parseJson(value) {
  if (value == null) return void 0;
  return JSON.parse(value);
}

// extensions/storage/domains/handler.ts
var DomainHandler = class {
  database;
  constructor(options) {
    this.database = options.database;
  }
  async create(domain) {
    this.database.prepare(
      `INSERT INTO domains (
          id, name, description, remit, exclusions
        ) VALUES (?, ?, ?, ?, ?)`
    ).run(
      domain.id,
      domain.name,
      domain.description,
      domain.remit,
      json(domain.exclusions)
    );
  }
  async update(domain) {
    const result = this.database.prepare(
      `UPDATE domains SET
          name = ?, description = ?, remit = ?, exclusions = ?
        WHERE id = ?`
    ).run(
      domain.name,
      domain.description,
      domain.remit,
      json(domain.exclusions),
      domain.id
    );
    return result.changes > 0;
  }
  async get(identifier) {
    const row = this.database.prepare("SELECT * FROM domains WHERE id = ?").get(identifier);
    return row ? toDomain(row) : void 0;
  }
  async list() {
    const rows = this.database.prepare("SELECT * FROM domains ORDER BY name").all();
    return rows.map(toDomain);
  }
  async delete(identifier) {
    const result = this.database.prepare("DELETE FROM domains WHERE id = ?").run(identifier);
    return result.changes > 0;
  }
};
function toDomain(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    remit: row.remit,
    exclusions: parseJson(row.exclusions)
  };
}

// extensions/storage/migrations/handler.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import "node:sqlite";
var MigrationHandler = class {
  database;
  constructor(options) {
    this.database = options.database;
  }
  /**
   * Apply pending schema files for the given table names.
   *
   * Each entry in `tables` is expected to resolve to a sibling subfolder
   * containing a `schema.sql` file (e.g. `../domains/schema.sql`).
   */
  async apply(tables) {
    const basePath = join(import.meta.dirname ?? "", "..");
    const createMigrationsTableSql = readFileSync(
      join(basePath, "migrations", "schema.sql"),
      "utf-8"
    );
    this.database.exec(createMigrationsTableSql);
    const row = this.database.prepare("SELECT MAX(version) as version FROM migrations").get();
    const currentVersion = row?.version ?? 0;
    for (let index = 0; index < tables.length; index++) {
      const version = index + 1;
      if (version <= currentVersion) continue;
      const table = tables[index];
      const schemaPath = join(basePath, table, "schema.sql");
      const sql = readFileSync(schemaPath, "utf-8");
      this.database.exec(sql);
      this.database.prepare(
        "INSERT INTO migrations (version, applied_at) VALUES (?, ?)"
      ).run(version, Date.now());
    }
  }
  async create(migration) {
    this.database.prepare(
      "INSERT INTO migrations (version, applied_at) VALUES (?, ?)"
    ).run(migration.version, migration.appliedAt);
  }
  async update() {
    return false;
  }
  async get(version) {
    const row = this.database.prepare("SELECT * FROM migrations WHERE version = ?").get(version);
    return row ? toMigration(row) : void 0;
  }
  async list() {
    const rows = this.database.prepare("SELECT * FROM migrations ORDER BY version").all();
    return rows.map(toMigration);
  }
  async delete() {
    return false;
  }
};
function toMigration(row) {
  return {
    version: row.version,
    appliedAt: row.appliedAt
  };
}

// extensions/storage/sqlite.ts
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync as DatabaseSync3 } from "node:sqlite";
var SQLiteStorageAdapter = class {
  database;
  domains;
  migrations;
  constructor(options = {}) {
    const databasePath = options.databasePath ?? ".pi/trellis/store.db";
    if (databasePath !== ":memory:") {
      mkdirSync(dirname(databasePath), { recursive: true });
    }
    this.database = new DatabaseSync3(databasePath);
    this.domains = new DomainHandler({ database: this.database });
    this.migrations = new MigrationHandler({ database: this.database });
  }
  async init() {
  }
  async migrate() {
    await this.migrations.apply(["domains"]);
  }
  async close() {
    this.database.close();
  }
};

// extensions/tools/domains/creating-domain.ts
import { Type } from "typebox";
function registerCreatingDomainTool(pi, storage) {
  pi.registerTool({
    name: "creating-domain",
    label: "Create Domain",
    description: "Create a project domain in the Trellis taxonomy.",
    promptSnippet: "Use when the user wants to add a new domain to the project taxonomy.",
    parameters: Type.Object({
      id: Type.String({ description: "Stable domain identifier" }),
      name: Type.String({ description: "Human-readable domain name" }),
      description: Type.String({
        description: "Short summary of what the domain covers"
      }),
      remit: Type.String({
        description: "Detailed responsibility statement for domain agents assessing scope"
      }),
      exclusions: Type.Array(Type.String(), {
        description: "Concerns this domain explicitly refuses to own"
      })
    }),
    async execute(_toolCallId, params) {
      const existing = await storage.domains.get(params.id);
      if (existing) {
        return {
          content: [
            {
              type: "text",
              text: `Domain "${params.id}" already exists. Choose a different identifier or update the existing domain.`
            }
          ],
          details: { existing, domain: void 0 }
        };
      }
      const domain = { ...params };
      await storage.domains.create(domain);
      return {
        content: [
          { type: "text", text: `Domain "${params.id}" created successfully.` }
        ],
        details: { existing: void 0, domain }
      };
    }
  });
}

// extensions/tools/domains/deleting-domain.ts
import { Type as Type2 } from "typebox";
function registerDeletingDomainTool(pi, storage) {
  pi.registerTool({
    name: "deleting-domain",
    label: "Delete Domain",
    description: "Remove a project domain from the Trellis taxonomy.",
    promptSnippet: "Use when the user explicitly asks to remove a domain. This cannot be undone.",
    parameters: Type2.Object({
      id: Type2.String({ description: "Stable domain identifier" })
    }),
    async execute(_toolCallId, params) {
      const deleted = await storage.domains.delete(params.id);
      if (!deleted) {
        return {
          content: [
            { type: "text", text: `Domain "${params.id}" was not found.` }
          ],
          details: { deleted: false }
        };
      }
      return {
        content: [
          { type: "text", text: `Domain "${params.id}" deleted successfully.` }
        ],
        details: { deleted: true }
      };
    }
  });
}

// extensions/tools/domains/getting-domain.ts
import { Type as Type3 } from "typebox";
function registerGettingDomainTool(pi, storage) {
  pi.registerTool({
    name: "getting-domain",
    label: "Get Domain",
    description: "Read a single project domain by identifier.",
    promptSnippet: "Use when the user or an agent needs the full record for one domain.",
    parameters: Type3.Object({
      id: Type3.String({ description: "Stable domain identifier" })
    }),
    async execute(_toolCallId, params) {
      const domain = await storage.domains.get(params.id);
      if (!domain) {
        return {
          content: [
            { type: "text", text: `Domain "${params.id}" was not found.` }
          ],
          details: { domain: void 0 }
        };
      }
      return {
        content: [
          {
            type: "text",
            text: `Domain "${params.id}" found: ${domain.name} \u2014 ${domain.description}`
          }
        ],
        details: { domain }
      };
    }
  });
}

// extensions/tools/domains/listing-domains.ts
import { Type as Type4 } from "typebox";
function registerListingDomainsTool(pi, storage) {
  pi.registerTool({
    name: "listing-domains",
    label: "List Domains",
    description: "List all defined Trellis domains.",
    promptSnippet: "Use when the user or a coordinator needs to see the current domain taxonomy.",
    parameters: Type4.Object({}),
    async execute() {
      const domains = await storage.domains.list();
      return {
        content: [
          {
            type: "text",
            text: `${domains.length} domain(s) defined.`
          }
        ],
        details: { domains }
      };
    }
  });
}

// extensions/tools/domains/updating-domain.ts
import { Type as Type5 } from "typebox";
function registerUpdatingDomainTool(pi, storage) {
  pi.registerTool({
    name: "updating-domain",
    label: "Update Domain",
    description: "Overwrite fields of an existing project domain.",
    promptSnippet: "Use when the user wants to change the description, remit, or exclusions of an existing domain.",
    parameters: Type5.Object({
      id: Type5.String({ description: "Stable domain identifier" }),
      name: Type5.String({ description: "Human-readable domain name" }),
      description: Type5.String({
        description: "Short summary of what the domain covers"
      }),
      remit: Type5.String({
        description: "Detailed responsibility statement for domain agents assessing scope"
      }),
      exclusions: Type5.Array(Type5.String(), {
        description: "Concerns this domain explicitly refuses to own"
      })
    }),
    async execute(_toolCallId, params) {
      const existing = await storage.domains.get(params.id);
      if (!existing) {
        return {
          content: [
            { type: "text", text: `Domain "${params.id}" does not exist. Create it first.` }
          ],
          details: { updated: false, domain: void 0 }
        };
      }
      const domain = { ...params };
      await storage.domains.update(domain);
      return {
        content: [
          { type: "text", text: `Domain "${params.id}" updated successfully.` }
        ],
        details: { domain, updated: true }
      };
    }
  });
}

// extensions/index.ts
function extension(pi) {
  const databasePath = process.env.TRELLIS_DATABASE_PATH;
  const storage = new SQLiteStorageAdapter({ databasePath });
  let queueManager;
  let notificationManager;
  let coordinatorManager;
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
}
export {
  extension as default
};
