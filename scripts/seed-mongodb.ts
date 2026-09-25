/**
 * MongoDB seed — imports the projects from data/projects.ts into the Atlas
 * `projects` collection so "My Works" looks identical after migration.
 *
 * Run with:  npm run db:seed   (requires MONGODB_URI in .env)
 *
 * To restore the exact rows that lived in the previous PostgreSQL/Neon
 * database (real URLs, orders, timestamps), pass the exported JSON:
 *
 *   npx tsx scripts/seed-mongodb.ts --from-export .freebuff/neon-export.json
 *
 * Idempotent: existing documents are matched by slug and updated, so re-running
 * restores the default project set (admin edits are overwritten on purpose).
 */
import { MongoClient } from "mongodb";
import { existsSync, readFileSync } from "node:fs";

/** Minimal .env loader (no dependency): fills process.env from a local .env. */
function loadEnvFile(path = ".env") {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!(key in process.env)) {
      process.env[key] = trimmed.slice(eq + 1).trim().replace(/^"|"$/g, "");
    }
  }
}
loadEnvFile();

/** Minimal local copies so this script stays standalone (no path aliases). */
type SeedProject = {
  title: string;
  category: string;
  description: string;
  tech: string[];
  image: string;
  github: string;
  live: string;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const uri = process.env.MONGODB_URI;

// Parse the seed source out of data/projects.ts without a TS toolchain.
const source = readFileSync("data/projects.ts", "utf8");
const arrayMatch = source.match(/export const projects: Project\[\] = (\[[\s\S]*\n\]);/);
if (!arrayMatch) {
  console.error("Could not locate the projects array in data/projects.ts");
  process.exitCode = 1;
  process.exit(1);
}
const projects = eval(arrayMatch[1]) as SeedProject[];

/** Rows exported from the previous Neon/PostgreSQL database (Prisma shapes). */
type ExportedRow = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  githubUrl: string | null;
  liveUrl: string | null;
  technologies: string[];
  category: string;
  featured: boolean;
  order: number;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const exportArgIdx = process.argv.indexOf("--from-export");
const exportPath = exportArgIdx > -1 ? process.argv[exportArgIdx + 1] : undefined;

async function main() {
  if (!uri) {
    console.error("MONGODB_URI is not set. Add it to .env first.");
    process.exitCode = 1;
    return;
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const col = client.db().collection("projects");

    let created = 0;
    let updated = 0;

    // Prefer the exact rows from the previous database when provided.
    const rows: Array<Record<string, unknown>> = exportPath
      ? (JSON.parse(readFileSync(exportPath, "utf8")) as ExportedRow[]).map((r) => ({
          title: r.title,
          slug: r.slug,
          description: r.description,
          image: r.image,
          githubUrl: r.githubUrl,
          liveUrl: r.liveUrl,
          technologies: r.technologies,
          category: r.category,
          featured: r.featured,
          order: r.order,
          published: r.published,
          ...(r.id ? { id: r.id } : {}),
          ...(r.createdAt ? { createdAt: new Date(r.createdAt) } : {}),
          ...(r.updatedAt ? { updatedAt: new Date(r.updatedAt) } : {}),
        }))
      : projects.map((project, index) => ({
          title: project.title,
          slug: slugify(project.title),
          description: project.description,
          image: project.image,
          githubUrl: project.github,
          liveUrl: project.live,
          technologies: project.tech,
          category: project.category,
          // First two projects are flagged featured for the dashboard stat.
          featured: index < 2,
          order: index + 1,
          published: true,
        }));

    for (const doc of rows) {

      const { id, createdAt, updatedAt, ...fields } = doc as {
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
      } & Record<string, unknown>;
      const result = await col.updateOne(
        { slug: fields.slug as string },
        {
          $set: { ...fields, updatedAt: updatedAt ?? new Date() },
          $setOnInsert: {
            id: id ?? makeId(),
            createdAt: createdAt ?? new Date(),
          },
        },
        { upsert: true },
      );

      if (result.upsertedCount > 0) created += 1;
      else updated += 1;
    }

    const total = await col.countDocuments({});
    console.log(
      `Seed complete — ${created} created, ${updated} updated, ` +
        `${total} total documents in the projects collection.`,
    );
  } finally {
    await client.close();
  }
}

function makeId(): string {
  return [...Array(24)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
