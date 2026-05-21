/**
 * Phase 5 (Boericke): Import boericke.json into the MateriaMedica table.
 *
 * Steps:
 *   1. Upsert the "boericke" Source record
 *   2. Build abbreviation → remedy ID map from DB
 *   3. Upsert MateriaMedica rows (one per matched remedy)
 *   4. Report unmatched abbreviations
 *
 * Usage: npm run boericke:import
 */
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.join(__dirname, "../../.env") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import type { BoerickeRecord } from "./parse";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DATA_PATH = path.join(__dirname, "../../prisma/seeds/data/boericke.json");
const BATCH = 100;

async function main() {
  console.log("Loading boericke.json...");
  const records: BoerickeRecord[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  console.log(`  ${records.length} records`);

  // ── 1. Upsert Source ──────────────────────────────────────────────────────
  const source = await prisma.source.upsert({
    where: { slug: "boericke" },
    update: {},
    create: {
      slug: "boericke",
      name: "Boericke's Materia Medica",
      author: "William Boericke",
      year: 1901,
      description:
        "Widely used materia medica with keynotes, clinical indications, and modalities for each remedy.",
      isPublicDomain: true,
    },
  });
  console.log(`Source: ${source.id}`);

  // ── 2. Build abbreviation → remedyId map ─────────────────────────────────
  const remedyRows = await prisma.remedy.findMany({ select: { id: true, abbreviation: true } });
  const remedyMap = new Map(remedyRows.map((r) => [r.abbreviation.toLowerCase(), r.id]));
  console.log(`  ${remedyMap.size} remedies in DB`);

  // ── 3. Match and upsert ───────────────────────────────────────────────────
  const matched: Array<{ remedyId: string; sourceId: string; fullText: string; keynotes: string }> = [];
  const unmatched: string[] = [];

  for (const rec of records) {
    // Try exact match first, then lowercase slug
    const remedyId =
      remedyMap.get(rec.abbreviation.toLowerCase()) ??
      remedyMap.get(rec.slug.toLowerCase());

    if (!remedyId) {
      unmatched.push(rec.abbreviation);
      continue;
    }
    matched.push({
      remedyId,
      sourceId: source.id,
      fullText: rec.fullText,
      keynotes: rec.keynotes,
    });
  }

  console.log(`  ${matched.length} matched, ${unmatched.length} unmatched`);

  console.log("Upserting MateriaMedica records...");
  for (let i = 0; i < matched.length; i += BATCH) {
    const batch = matched.slice(i, i + BATCH);
    for (const row of batch) {
      await prisma.materiaMedica.upsert({
        where: { remedyId_sourceId: { remedyId: row.remedyId, sourceId: row.sourceId } },
        update: { fullText: row.fullText, keynotes: row.keynotes },
        create: row,
      });
    }
    process.stdout.write(`  ${Math.min(i + BATCH, matched.length)}/${matched.length}\r`);
  }
  console.log(`  ${matched.length} records upserted        `);

  if (unmatched.length > 0) {
    console.log("\nUnmatched abbreviations (no remedy in DB):");
    console.log("  " + unmatched.slice(0, 30).join(", ") + (unmatched.length > 30 ? ` ... +${unmatched.length - 30}` : ""));
  }

  console.log("\nBoericke import complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
