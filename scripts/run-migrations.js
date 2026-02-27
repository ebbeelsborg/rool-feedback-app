import { RoolClient } from "@rool-dev/sdk";
import { NodeAuthProvider } from "@rool-dev/sdk/node";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "migrations");
const SHARED_SPACE_ID = "vYI49S";

async function runMigrations() {
  const client = new RoolClient({
    authProvider: new NodeAuthProvider()
  });
  await client.initialize();

  const space = await client.openSpace(SHARED_SPACE_ID);
  if (!space) {
    console.error(`Could not open space ${SHARED_SPACE_ID}`);
    return;
  }

  // 1. Get current schema version
  const { objects } = await space.findObjects({ where: { type: "SchemaInfo" } });
  let schemaInfo = objects?.[0];
  let currentVersion = schemaInfo?.data?.version ?? 0;

  console.log(`Current Schema Version: ${currentVersion}`);

  // 2. Load migration files
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith(".js") || f.endsWith(".mjs"))
    .sort();

  for (const file of files) {
    const version = parseInt(file.split("_")[0]);
    if (isNaN(version)) continue;

    if (version > currentVersion) {
      console.log(`\n>>> Running Migration ${file}...`);
      const migration = await import(path.join(MIGRATIONS_DIR, file));

      try {
        await migration.up(space);

        // Update version with retry
        const updateVersion = async () => {
          if (schemaInfo) {
            await space.updateObject(schemaInfo.id, { data: { version } });
          } else {
            const res = await space.createObject({ data: { type: "SchemaInfo", version } });
            schemaInfo = { id: res.id };
          }
        };

        try {
          await updateVersion();
        } catch (vErr) {
          if (vErr.message.includes("429")) {
            console.warn(`  Rate limited on version update. Waiting 30s...`);
            await new Promise(r => setTimeout(r, 30000));
            await updateVersion();
          } else {
            throw vErr;
          }
        }

        currentVersion = version;
        console.log(`>>> Success! New version: ${currentVersion}`);
      } catch (err) {
        console.error(`>>> FAILED migration ${file}:`, err.message);
        process.exit(1);
      }
    }
  }

  console.log("\nAll caught up!");
  process.exit(0);
}

runMigrations().catch(console.error);
