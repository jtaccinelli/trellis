import { build } from "esbuild";
import { copyFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootPath = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDirectory = join(rootPath, "dist");
const outputFile = join(outputDirectory, "extensions", "index.js");

async function main() {
  await build({
    bundle: true,
    entryPoints: [join(rootPath, "extensions", "index.ts")],
    external: ["@earendil-works/*", "typebox"],
    format: "esm",
    outfile: outputFile,
    platform: "node",
    tsconfig: join(rootPath, "tsconfig.json"),
  });

  // Bundle the markdown agent definitions alongside the built extension. The
  // catalog path is resolved from the plugin entry file, so agents must live
  // in `dist/extensions/agents` to mirror the source layout.
  const agentsSourceDirectory = join(rootPath, "extensions", "agents");
  const agentsTargetDirectory = join(outputDirectory, "extensions", "agents");
  mkdirSync(agentsTargetDirectory, { recursive: true });
  for (const entry of readdirSync(agentsSourceDirectory)) {
    if (!entry.endsWith(".md")) continue;
    copyFileSync(
      join(agentsSourceDirectory, entry),
      join(agentsTargetDirectory, entry),
    );
  }

  const storageDirectory = join(rootPath, "extensions", "storage");
  for (const entry of readdirSync(storageDirectory)) {
    const schemaPath = join(storageDirectory, entry, "schema.sql");
    try {
      const stats = statSync(schemaPath);
      if (!stats.isFile()) continue;
    } catch {
      continue;
    }

    const targetDirectory = join(outputDirectory, entry);
    mkdirSync(targetDirectory, { recursive: true });
    copyFileSync(schemaPath, join(targetDirectory, "schema.sql"));
  }

  console.log(`Built ${outputFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
