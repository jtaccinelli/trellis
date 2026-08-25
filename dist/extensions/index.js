// extensions/components/managing-domains.ts
import { DynamicBorder } from "@earendil-works/pi-coding-agent";
import {
  Container,
  HStack,
  Spacer
} from "@earendil-works/pi-tui";

// extensions/components/domain-details.ts
import { truncateToWidth, wrapTextWithAnsi } from "@earendil-works/pi-tui";
var DomainDetailsComponent = class {
  constructor(getDomain, theme) {
    this.getDomain = getDomain;
    this.theme = theme;
  }
  getDomain;
  theme;
  invalidate() {
  }
  render(width) {
    const domain = this.getDomain();
    const lines = [];
    if (!domain) {
      lines.push(
        truncateToWidth(this.theme.fg("dim", "No domain selected."), width)
      );
      return lines;
    }
    lines.push(
      truncateToWidth(
        this.theme.fg("accent", this.theme.bold(domain.name)),
        width
      )
    );
    lines.push(
      truncateToWidth(this.theme.fg("muted", `id: ${domain.id}`), width)
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
        lines.push(truncateToWidth(`\u2022 ${exclusion}`, width));
      }
    }
    return lines;
  }
};

// extensions/components/domain-list.ts
import { truncateToWidth as truncateToWidth2 } from "@earendil-works/pi-tui";

// extensions/utils.ts
import { matchesKey } from "@earendil-works/pi-tui";
function json(value) {
  return JSON.stringify(value);
}
function parseJson(value) {
  if (value == null) return void 0;
  return JSON.parse(value);
}
function textBlock(text) {
  return { type: "text", text };
}
function formatToolResult(text, details) {
  return {
    content: [textBlock(text)],
    details
  };
}
function mapInputs(data, handlers) {
  for (const [key, handler] of Object.entries(handlers)) {
    if (!handler) {
      continue;
    }
    if (matchesKey(data, key)) {
      handler();
      return true;
    }
  }
  return false;
}

// extensions/components/domain-list.ts
var DomainListComponent = class {
  constructor(domains, initialSelectedIndex, theme, requestRender) {
    this.domains = domains;
    this.theme = theme;
    this.requestRender = requestRender;
    this.selectedIndex = Math.max(
      0,
      Math.min(initialSelectedIndex, domains.length - 1)
    );
  }
  domains;
  theme;
  requestRender;
  selectedIndex;
  getSelectedDomain() {
    return this.domains[this.selectedIndex];
  }
  handleInput(data) {
    const handlePrevious = () => {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.requestRender();
    };
    const handleNext = () => {
      this.selectedIndex = Math.min(
        this.domains.length - 1,
        this.selectedIndex + 1
      );
      this.requestRender();
    };
    mapInputs(data, {
      up: handlePrevious,
      k: handlePrevious,
      down: handleNext,
      j: handleNext
    });
  }
  invalidate() {
  }
  render(width) {
    if (this.domains.length === 0) {
      return [truncateToWidth2(this.theme.fg("dim", "No domains"), width)];
    }
    const lines = [];
    for (let index = 0; index < this.domains.length; index++) {
      const item = this.domains[index];
      const isSelected = index === this.selectedIndex;
      const marker = isSelected ? this.theme.fg("accent", "\u203A ") : "  ";
      const label = isSelected ? this.theme.fg("accent", this.theme.bold(item.name)) : this.theme.fg("text", item.name);
      lines.push(truncateToWidth2(`${marker}${label}`, width));
    }
    return lines;
  }
};

// extensions/components/help-line.ts
import { truncateToWidth as truncateToWidth3 } from "@earendil-works/pi-tui";
var HelpLineComponent = class {
  constructor(theme, content) {
    this.theme = theme;
    this.content = content;
  }
  theme;
  content;
  invalidate() {
  }
  render(width) {
    return [truncateToWidth3(this.theme.fg("dim", this.content), width)];
  }
};

// extensions/components/title.ts
import { truncateToWidth as truncateToWidth4 } from "@earendil-works/pi-tui";
var TitleComponent = class {
  constructor(theme, title) {
    this.theme = theme;
    this.title = title;
  }
  theme;
  title;
  invalidate() {
  }
  render(width) {
    return [
      truncateToWidth4(
        this.theme.fg("accent", this.theme.bold(this.title)),
        width
      )
    ];
  }
};

// extensions/components/managing-domains.ts
var ManagingDomainsComponent = class extends Container {
  done;
  list;
  constructor(options) {
    super();
    this.done = options.done;
    this.list = new DomainListComponent(
      options.domains,
      options.initialSelectedIndex ?? 0,
      options.theme,
      options.requestRender
    );
    const details = new DomainDetailsComponent(
      () => this.list.getSelectedDomain(),
      options.theme
    );
    this.addChild(new Spacer(1));
    this.addChild(
      new DynamicBorder((s) => options.theme.fg("accent", s))
    );
    this.addChild(
      new TitleComponent(options.theme, "Managing domains")
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
            shrink: 1
          },
          {
            component: details,
            minSize: 20,
            grow: 1,
            shrink: 1
          }
        ],
        { gap: 1, align: "stretch" }
      )
    );
    this.addChild(new Spacer(1));
    this.addChild(
      new HelpLineComponent(
        options.theme,
        "\u2191/\u2193 or j/k navigate \xB7 e edit remit \xB7 d delete \xB7 q close"
      )
    );
    this.addChild(
      new DynamicBorder((s) => options.theme.fg("accent", s))
    );
  }
  handleInput(data) {
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
    if (mapInputs(data, {
      d: handleDelete,
      e: handleEdit,
      escape: handleClose,
      q: handleClose
    })) {
      return;
    }
    this.list.handleInput(data);
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
      let selectedDomainId;
      let running = true;
      while (running) {
        const domains = await storage.domains.list();
        const initialSelectedIndex = selectedDomainId ? Math.max(
          0,
          domains.findIndex((domain) => domain.id === selectedDomainId)
        ) : 0;
        const action = await ctx.ui.custom(
          (tui, theme, _keybindings, done) => {
            return new ManagingDomainsComponent({
              domains,
              done,
              initialSelectedIndex,
              requestRender: () => tui.requestRender(),
              theme
            });
          }
        );
        if (!action) {
          running = false;
          continue;
        }
        if (action.kind === "close") {
          running = false;
          continue;
        }
        selectedDomainId = action.domain.id;
        if (action.kind === "delete") {
          const confirmed = await ctx.ui.confirm(
            "Delete domain?",
            `Remove "${action.domain.name}" (${action.domain.id})? This cannot be undone.`
          );
          if (confirmed) {
            await storage.domains.delete(action.domain.id);
            ctx.ui.notify(`Domain "${action.domain.id}" deleted.`, "info");
            selectedDomainId = void 0;
          }
          continue;
        }
        if (action.kind === "edit") {
          const remit = await ctx.ui.input(
            "Edit remit",
            action.domain.remit
          );
          if (remit !== void 0) {
            await storage.domains.update({ ...action.domain, remit });
            ctx.ui.notify(`Domain "${action.domain.id}" updated.`, "info");
          }
          continue;
        }
        running = false;
      }
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
var parameters = Type.Object({
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
});
function registerCreatingDomainTool(pi, storage) {
  pi.registerTool({
    name: "creating-domain",
    label: "Create Domain",
    description: "Create a project domain in the Trellis taxonomy.",
    promptSnippet: "Use when the user wants to add a new domain to the project taxonomy.",
    parameters,
    async execute(_toolCallId, params) {
      const existing = await storage.domains.get(params.id);
      if (existing) {
        return formatToolResult(
          `Domain "${params.id}" already exists. Choose a different identifier or update the existing domain.`,
          { existing, domain: void 0 }
        );
      }
      const domain = { ...params };
      await storage.domains.create(domain);
      return formatToolResult(
        `Domain "${params.id}" created successfully.`,
        { existing: void 0, domain }
      );
    }
  });
}

// extensions/tools/domains/deleting-domain.ts
import { Type as Type2 } from "typebox";
var parameters2 = Type2.Object({
  id: Type2.String({ description: "Stable domain identifier" })
});
function registerDeletingDomainTool(pi, storage) {
  pi.registerTool({
    name: "deleting-domain",
    label: "Delete Domain",
    description: "Remove a project domain from the Trellis taxonomy.",
    promptSnippet: "Use when the user explicitly asks to remove a domain. This cannot be undone.",
    parameters: parameters2,
    async execute(_toolCallId, params) {
      const deleted = await storage.domains.delete(params.id);
      if (!deleted) {
        return formatToolResult(
          `Domain "${params.id}" was not found.`,
          { deleted: false }
        );
      }
      return formatToolResult(
        `Domain "${params.id}" deleted successfully.`,
        { deleted: true }
      );
    }
  });
}

// extensions/tools/domains/getting-domain.ts
import { Type as Type3 } from "typebox";
var parameters3 = Type3.Object({
  id: Type3.String({ description: "Stable domain identifier" })
});
function registerGettingDomainTool(pi, storage) {
  pi.registerTool({
    name: "getting-domain",
    label: "Get Domain",
    description: "Read a single project domain by identifier.",
    promptSnippet: "Use when the user or an agent needs the full record for one domain.",
    parameters: parameters3,
    async execute(_toolCallId, params) {
      const domain = await storage.domains.get(params.id);
      if (!domain) {
        return formatToolResult(
          `Domain "${params.id}" was not found.`,
          { domain: void 0 }
        );
      }
      return formatToolResult(
        `Domain "${params.id}" found: ${domain.name} \u2014 ${domain.description}`,
        { domain }
      );
    }
  });
}

// extensions/tools/domains/listing-domains.ts
import { Type as Type4 } from "typebox";
var parameters4 = Type4.Object({});
function registerListingDomainsTool(pi, storage) {
  pi.registerTool({
    name: "listing-domains",
    label: "List Domains",
    description: "List all defined Trellis domains.",
    promptSnippet: "Use when the user or a coordinator needs to see the current domain taxonomy.",
    parameters: parameters4,
    async execute() {
      const domains = await storage.domains.list();
      return formatToolResult(
        `${domains.length} domain(s) defined.`,
        { domains }
      );
    }
  });
}

// extensions/tools/domains/updating-domain.ts
import { Type as Type5 } from "typebox";
var parameters5 = Type5.Object({
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
});
function registerUpdatingDomainTool(pi, storage) {
  pi.registerTool({
    name: "updating-domain",
    label: "Update Domain",
    description: "Overwrite fields of an existing project domain.",
    promptSnippet: "Use when the user wants to change the description, remit, or exclusions of an existing domain.",
    parameters: parameters5,
    async execute(_toolCallId, params) {
      const existing = await storage.domains.get(params.id);
      if (!existing) {
        return formatToolResult(
          `Domain "${params.id}" does not exist. Create it first.`,
          { updated: false, domain: void 0 }
        );
      }
      const domain = { ...params };
      await storage.domains.update(domain);
      return formatToolResult(
        `Domain "${params.id}" updated successfully.`,
        { domain, updated: true }
      );
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
