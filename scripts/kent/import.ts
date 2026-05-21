/**
 * Phase 4: Import kent.json into the database.
 *
 * Run: npm run kent:import
 *
 * Steps:
 *  1. Upsert the "kent" Source record
 *  2. Upsert all unique Remedy abbreviations
 *  3. Upsert all Rubric records (no parentId yet)
 *  4. Set parentId via raw SQL (string-based parent path lookup)
 *  5. Insert RubricRemedy junction rows in batches
 */

import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.join(__dirname, "../../.env") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

const prisma = createPrisma();
const BATCH = 500;
const DATA_PATH = path.join(__dirname, "../../prisma/seeds/data/kent.json");

interface RemedyGrade {
  abbreviation: string;
  grade: 1 | 2 | 3;
}
interface RubricRecord {
  path: string;
  label: string;
  category: string;
  remedies: RemedyGrade[];
}

async function main() {
  // ── 1. Load data ───────────────────────────────────────────────────────────
  console.log("Loading kent.json...");
  const rubrics: RubricRecord[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  console.log(`  ${rubrics.length.toLocaleString()} rubrics loaded`);

  // ── 2. Upsert Source ───────────────────────────────────────────────────────
  const source = await prisma.source.upsert({
    where: { slug: "kent" },
    update: {},
    create: {
      slug: "kent",
      name: "Kent's Repertory",
      author: "James Tyler Kent",
      year: 1897,
      description:
        "The foundational classical repertory. Comprehensive symptom-to-remedy mapping with grades 1-3.",
      isPublicDomain: true,
    },
  });
  console.log(`Source: ${source.id}`);

  // ── 3. Upsert Remedies ─────────────────────────────────────────────────────
  const abbrevSet = new Set<string>();
  for (const r of rubrics) {
    for (const rem of r.remedies) abbrevSet.add(rem.abbreviation);
  }
  const abbrevs = [...abbrevSet];
  console.log(`Upserting ${abbrevs.length} remedy abbreviations...`);

  for (let i = 0; i < abbrevs.length; i += BATCH) {
    await prisma.remedy.createMany({
      data: abbrevs.slice(i, i + BATCH).map((a) => ({ abbreviation: a, name: a })),
      skipDuplicates: true,
    });
  }

  const remedyRows = await prisma.remedy.findMany({
    select: { id: true, abbreviation: true },
  });
  const remedyMap = new Map(remedyRows.map((r) => [r.abbreviation, r.id]));
  console.log(`  ${remedyMap.size} remedies in map`);

  // ── 4. Upsert Rubrics (no parentId) ───────────────────────────────────────
  console.log("Upserting rubrics...");
  for (let i = 0; i < rubrics.length; i += BATCH) {
    const batch = rubrics.slice(i, i + BATCH);
    await prisma.rubric.createMany({
      data: batch.map((r) => ({
        path: r.path,
        category: r.category,
        label: r.label,
      })),
      skipDuplicates: true,
    });
    if ((i / BATCH) % 20 === 0) {
      process.stdout.write(`  ${i.toLocaleString()}/${rubrics.length.toLocaleString()} rubrics\r`);
    }
  }
  console.log(`  ${rubrics.length.toLocaleString()} rubrics upserted        `);

  // ── 5. Set parentId via raw SQL ────────────────────────────────────────────
  // Parent path = everything before the last " > " segment.
  // LEFT(path, len - POSITION(' > ' IN REVERSE(path)) - 2) gives the parent path.
  console.log("Setting parent relationships...");
  const updated = await prisma.$executeRaw`
    UPDATE "Rubric" child
    SET "parentId" = parent.id
    FROM "Rubric" parent
    WHERE child.path LIKE '% > %'
      AND parent.path = LEFT(
        child.path,
        LENGTH(child.path) - POSITION(' > ' IN REVERSE(child.path)) - 2
      )
  `;
  console.log(`  ${updated.toLocaleString()} parent relationships set`);

  // ── 6. Build rubric path → id map ─────────────────────────────────────────
  console.log("Building rubric map...");
  const rubricRows = await prisma.rubric.findMany({
    select: { id: true, path: true },
  });
  const rubricMap = new Map(rubricRows.map((r) => [r.path, r.id]));
  console.log(`  ${rubricMap.size.toLocaleString()} rubrics in map`);

  // ── 7. Insert RubricRemedy links ───────────────────────────────────────────
  console.log("Building rubric-remedy links...");
  const links: { rubricId: string; remedyId: string; sourceId: string; grade: number }[] = [];

  for (const rubric of rubrics) {
    const rubricId = rubricMap.get(rubric.path);
    if (!rubricId) continue;
    for (const rem of rubric.remedies) {
      const remedyId = remedyMap.get(rem.abbreviation);
      if (!remedyId) continue;
      links.push({ rubricId, remedyId, sourceId: source.id, grade: rem.grade });
    }
  }
  console.log(`  ${links.length.toLocaleString()} links to insert`);

  for (let i = 0; i < links.length; i += BATCH) {
    await prisma.rubricRemedy.createMany({
      data: links.slice(i, i + BATCH),
      skipDuplicates: true,
    });
    if ((i / BATCH) % 40 === 0) {
      process.stdout.write(`  ${i.toLocaleString()}/${links.length.toLocaleString()} links\r`);
    }
  }
  console.log(`  ${links.length.toLocaleString()} links inserted        `);

  console.log("\nImport complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
