/**
 * Repertorization engine — Phase 6.
 *
 * Pipeline:
 *   1. Claude extracts rubric queries from free-text symptoms
 *   2. DB looks up the best-grade Kent rubric match per remedy per query
 *   3. Remedies are scored with grade² per query (grade 3=9pts, 2=4pts, 1=1pt)
 *      — prevents bulk polychrests from dominating via thousands of grade-1 hits
 *   4. Claude explains the top matches using rubric evidence + Boericke keynotes
 *
 * Output shape is identical to /api/research so the UI swap (Phase 7) is trivial.
 */

import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RemedyMatch {
  abbreviation: string;
  name: string;
  matchScore: number;       // 0–100
  whyItMatches: string;
  keySymptoms: string[];
  suggestedPotency: string;
  notes?: string;
  sources?: string[];
  // Phase 6 extras
  rubricEvidence?: Array<{ path: string; grade: number }>;
  kentScore?: number;
  queriesMatched?: number;
}

interface RubricQuery {
  chapter: string;
  keywords: string[];
  symptomDescription: string;
}

interface QueryMatch {
  queryIndex: number;
  remedyId: string;
  abbreviation: string;
  name: string;
  grade: number;
  path: string;
}

interface ScoredRemedy {
  remedyId: string;
  abbreviation: string;
  name: string;
  totalScore: number;   // sum of grade² per query
  queriesMatched: number;
  rubricEvidence: Array<{ path: string; grade: number }>;
  boerickeKeynotes: string;
}

// ─── Kent chapters ────────────────────────────────────────────────────────────

const KENT_CHAPTERS = [
  "MIND", "HEAD", "EYE", "VISION", "EAR", "NOSE", "FACE", "MOUTH", "TEETH",
  "THROAT", "EXTERNAL THROAT", "STOMACH", "ABDOMEN", "RECTUM", "STOOL",
  "BLADDER", "KIDNEYS", "URETHRA", "URINE", "URINARY ORGANS",
  "GENITALIA MALE", "GENITALIA FEMALE", "LARYNX AND TRACHEA", "RESPIRATION",
  "EXPECTORATION", "COUGH", "CHEST", "BACK", "EXTREMITIES", "SLEEP",
  "CHILL", "FEVER", "PERSPIRATION", "SKIN", "VERTIGO", "GENERALITIES",
];

// ─── Step 1: Claude → rubric queries ─────────────────────────────────────────

async function extractRubricQueries(
  symptoms: string,
  client: Anthropic
): Promise<RubricQuery[]> {
  const KENT_PATH_EXAMPLES = [
    "MIND > FEAR", "MIND > ANXIETY", "MIND > RESTLESSNESS, nervousness",
    "MIND > ANGER, irascibility", "MIND > GRIEF",
    "HEAD > PAIN > throbbing", "HEAD > PAIN > motion, agg",
    "FEVER > DRY heat", "FEVER > HEAT > burning",
    "GENERALITIES > WIND > cold", "GENERALITIES > COLD > air > agg",
    "GENERALITIES > FOOD AND DRINKS > cold > desire",
    "STOMACH > THIRST > extreme", "STOMACH > THIRST > cold water",
    "SKIN > DRY", "SKIN > eruptions > red",
    "SLEEP > SLEEPLESSNESS > anxiety, from",
  ].join(" | ");

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    tools: [
      {
        name: "identify_rubrics",
        description:
          "Identify 4–8 Kent repertory rubrics that best match the symptom description. " +
          "Prioritise the most distinctive, differentiating symptoms.",
        input_schema: {
          type: "object" as const,
          properties: {
            rubrics: {
              type: "array",
              maxItems: 5,
              items: {
                type: "object",
                properties: {
                  chapter: {
                    type: "string",
                    description: `One of: ${KENT_CHAPTERS.join(", ")}`,
                  },
                  keywords: {
                    type: "array",
                    minItems: 1,
                    maxItems: 3,
                    items: { type: "string" },
                    description:
                      "1–3 SHORT keywords that literally appear in the Kent rubric path. " +
                      "Use single words or short 2-word phrases only. " +
                      "NEVER invent compound phrases — use exact Kent vocabulary. " +
                      `Reference paths: ${KENT_PATH_EXAMPLES}`,
                  },
                  symptomDescription: {
                    type: "string",
                    description: "Brief plain-English description for logging.",
                  },
                },
                required: ["chapter", "keywords", "symptomDescription"],
              },
            },
          },
          required: ["rubrics"],
        },
      },
    ],
    tool_choice: { type: "auto" },
    messages: [
      {
        role: "user",
        content:
          `You are an expert classical homeopath. Analyse this symptom description and identify ` +
          `the most important Kent repertory rubrics to look up.\n\nSymptoms:\n"${symptoms}"\n\n` +
          `Keywords must be SHORT and match Kent rubric naming exactly (see examples). ` +
          `Focus on modalities, time of day, mental state, location, onset cause, character of symptoms.`,
      },
    ],
  });

  const tool = msg.content.find((b) => b.type === "tool_use");
  if (!tool || tool.type !== "tool_use") return [];
  return ((tool.input as { rubrics: RubricQuery[] }).rubrics) ?? [];
}

// ─── Step 2: DB rubric lookup ─────────────────────────────────────────────────
// Returns one best-grade match per remedy per query (not all matching rubrics).
// This prevents polychrests from accumulating thousands of low-grade points.

async function searchRubrics(
  queries: RubricQuery[],
  kentSourceId: string,
  prisma: PrismaClient
): Promise<QueryMatch[]> {
  // Run all rubric lookups in parallel — same queries, same results, no serial wait
  const results = await Promise.all(
    queries.map(async (query, qi) => {
      try {
        const keywordConditions = query.keywords
          .map((_, i) => `r.path ILIKE $${i + 3}`)
          .join(" AND ");

        // DISTINCT ON rem.id + ORDER BY grade DESC → one row per remedy, best grade
        const sql = `
          SELECT DISTINCT ON (rem.id)
                 r.path,
                 rr.grade,
                 rem.id AS "remedyId", rem.abbreviation, rem.name
          FROM "Rubric" r
          JOIN "RubricRemedy" rr ON rr."rubricId" = r.id
          JOIN "Remedy" rem       ON rem.id = rr."remedyId"
          WHERE r.category = $1
            AND rr."sourceId" = $2
            ${query.keywords.length > 0 ? `AND ${keywordConditions}` : ""}
          ORDER BY rem.id, rr.grade DESC
        `;

        const params: (string | number)[] = [
          query.chapter,
          kentSourceId,
          ...query.keywords.map((k) => `%${k}%`),
        ];

        const rows = await prisma.$queryRawUnsafe<
          Array<{ path: string; grade: number; remedyId: string; abbreviation: string; name: string }>
        >(sql, ...params);

        return rows.map((row) => ({
          queryIndex: qi,
          remedyId: row.remedyId,
          abbreviation: row.abbreviation,
          name: row.name,
          grade: Number(row.grade),
          path: row.path,
        }));
      } catch (err) {
        console.error(`Rubric search failed [${query.chapter}/${query.keywords}]:`, err);
        return [] as QueryMatch[];
      }
    })
  );

  return results.flat();
}

// ─── Step 3: Score + rank remedies ───────────────────────────────────────────
//
// Scoring: grade² per query, one best-grade entry per query per remedy.
//   Grade 3 → 9 pts, Grade 2 → 4 pts, Grade 1 → 1 pt.
// Tiebreak: number of distinct queries matched (breadth).

function scoreRemedies(matches: QueryMatch[], boerickeMap: Map<string, string>): ScoredRemedy[] {
  type Entry = {
    abbreviation: string;
    name: string;
    byQuery: Map<number, { grade: number; path: string }>;
  };
  const remedyMap = new Map<string, Entry>();

  for (const m of matches) {
    if (!remedyMap.has(m.remedyId)) {
      remedyMap.set(m.remedyId, { abbreviation: m.abbreviation, name: m.name, byQuery: new Map() });
    }
    const entry = remedyMap.get(m.remedyId)!;
    const cur = entry.byQuery.get(m.queryIndex);
    if (!cur || m.grade > cur.grade) {
      entry.byQuery.set(m.queryIndex, { grade: m.grade, path: m.path });
    }
  }

  const scored: ScoredRemedy[] = [];
  for (const [remedyId, entry] of remedyMap) {
    const queryEntries = [...entry.byQuery.values()];
    const totalScore = queryEntries.reduce((sum, q) => sum + q.grade * q.grade, 0);
    scored.push({
      remedyId,
      abbreviation: entry.abbreviation,
      name: entry.name,
      totalScore,
      queriesMatched: entry.byQuery.size,
      rubricEvidence: queryEntries
        .sort((a, b) => b.grade - a.grade)
        .map((q) => ({ path: q.path, grade: q.grade })),
      boerickeKeynotes: boerickeMap.get(remedyId) ?? "",
    });
  }

  return scored.sort((a, b) =>
    b.totalScore !== a.totalScore
      ? b.totalScore - a.totalScore
      : b.queriesMatched - a.queriesMatched
  );
}

// ─── Step 4: Claude explanation ───────────────────────────────────────────────

async function explainMatches(
  symptoms: string,
  topRemedies: ScoredRemedy[],
  sourceNames: string[],
  client: Anthropic
): Promise<RemedyMatch[]> {
  const remedySummaries = topRemedies.map((r) => {
    const rubricList = r.rubricEvidence
      .slice(0, 6)
      .map((e) => `  • ${e.path} (grade ${e.grade})`)
      .join("\n");
    const kn = r.boerickeKeynotes
      ? `Boericke: ${r.boerickeKeynotes.slice(0, 150)}`
      : "";
    return (
      `REMEDY: ${r.name} (${r.abbreviation})\n` +
      `  Kent score: ${r.totalScore} across ${r.queriesMatched} rubric queries\n` +
      `  Matched rubrics:\n${rubricList}\n` +
      (kn ? `  ${kn}\n` : "")
    );
  }).join("\n---\n");

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    tools: [
      {
        name: "explain_remedies",
        description: "Return ranked remedy explanations grounded in the repertory evidence.",
        input_schema: {
          type: "object" as const,
          properties: {
            matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  abbreviation: { type: "string" },
                  name: { type: "string" },
                  matchScore: { type: "number", description: "0–100, reflect Kent score ranking" },
                  whyItMatches: {
                    type: "string",
                    description: "2–3 sentences referencing specific rubrics and keynotes.",
                  },
                  keySymptoms: { type: "array", items: { type: "string" } },
                  suggestedPotency: { type: "string" },
                  notes: { type: "string" },
                  sources: { type: "array", items: { type: "string" } },
                },
                required: ["abbreviation", "name", "matchScore", "whyItMatches", "keySymptoms", "suggestedPotency"],
              },
            },
          },
          required: ["matches"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "explain_remedies" },
    messages: [
      {
        role: "user",
        content:
          `You are an expert classical homeopath. Patient symptoms:\n\n"${symptoms}"\n\n` +
          `The following remedies were found by Kent repertory database search. ` +
          `Explain each using the rubric evidence and Boericke keynotes. ` +
          `Be specific — reference actual rubric paths. ` +
          `Rank by clinical appropriateness (consider Kent score AND overall fit). ` +
          `Active sources: ${sourceNames.join(", ")}.\n\n` +
          remedySummaries,
      },
    ],
  });

  const tool = msg.content.find((b) => b.type === "tool_use");
  if (!tool || tool.type !== "tool_use") {
    console.error("[repertorize] explain: no tool_use. stop_reason:", msg.stop_reason);
    return [];
  }
  const input = tool.input as { matches: RemedyMatch[] };

  const scoreMap = new Map(topRemedies.map((r) => [r.abbreviation, r]));
  return (input.matches ?? []).map((m) => {
    const scored = scoreMap.get(m.abbreviation);
    return {
      ...m,
      kentScore: scored?.totalScore,
      queriesMatched: scored?.queriesMatched,
      rubricEvidence: scored?.rubricEvidence ?? [],
    };
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function repertorize(
  symptoms: string,
  options: {
    prisma: PrismaClient;
    client: Anthropic;
    activeSources: Array<{ id: string; slug: string; name: string }>;
    excludedSymptoms?: string[];
    maxRemedies?: number;
    onProgress?: (message: string) => void;
  }
): Promise<RemedyMatch[]> {
  const { prisma, client, activeSources, maxRemedies = 8, onProgress } = options;
  const progress = (msg: string) => onProgress?.(msg);

  const kentSource =
    activeSources.find((s) => s.slug === "kent") ??
    (await prisma.source.findUnique({ where: { slug: "kent" } }));
  if (!kentSource) throw new Error("Kent source not found in DB");

  const sourceNames = activeSources.map((s) => s.name);

  // Step 1
  progress("Analyzing your symptoms...");
  const queries = await extractRubricQueries(symptoms, client);
  console.log(`[repertorize] ${queries.length} queries`);
  queries.forEach((q) => console.log(`  [${q.chapter}] ${q.keywords.join(" > ")} — ${q.symptomDescription}`));
  if (queries.length === 0) return [];

  // Step 2
  progress(`Found ${queries.length} rubric ${queries.length === 1 ? "query" : "queries"} — searching Kent's Repertory...`);
  const allMatches = await searchRubrics(queries, kentSource.id, prisma);
  const uniqueRemedies = new Set(allMatches.map((m) => m.remedyId)).size;
  console.log(`[repertorize] ${uniqueRemedies} remedies found across ${allMatches.length} query-matches`);
  if (uniqueRemedies === 0) return [];

  // Step 3 — score
  progress(`${uniqueRemedies} remedies matched — scoring and consulting Boericke...`);
  const remedyIds = [...new Set(allMatches.map((m) => m.remedyId))];
  const boerickeSource = await prisma.source.findUnique({ where: { slug: "boericke" } });
  const boerickeRows = boerickeSource
    ? await prisma.materiaMedica.findMany({
        where: { remedyId: { in: remedyIds }, sourceId: boerickeSource.id },
        select: { remedyId: true, keynotes: true },
      })
    : [];
  const boerickeMap = new Map(boerickeRows.map((r) => [r.remedyId, r.keynotes ?? ""]));

  const scored = scoreRemedies(allMatches, boerickeMap);
  const top = scored.slice(0, maxRemedies);
  console.log(
    `[repertorize] Top ${top.length}:`,
    top.map((r) => `${r.abbreviation}(score=${r.totalScore},q=${r.queriesMatched})`).join(", ")
  );

  // Step 4 — explain (longest step; cycle progress messages every 2s)
  const explanationPhrases = [
    "Generating explanations...",
    "Cross-referencing Boericke keynotes...",
    "Evaluating clinical fit...",
    "Reviewing modalities and triggers...",
    "Assessing potency guidance...",
    "Finalizing recommendations...",
  ];
  let phraseIndex = 0;
  progress(explanationPhrases[phraseIndex]);
  const progressInterval = setInterval(() => {
    phraseIndex = Math.min(phraseIndex + 1, explanationPhrases.length - 1);
    progress(explanationPhrases[phraseIndex]);
  }, 2000);

  try {
    return await explainMatches(symptoms, top, sourceNames, client);
  } finally {
    clearInterval(progressInterval);
  }
}
