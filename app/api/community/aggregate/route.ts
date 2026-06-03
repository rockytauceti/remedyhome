import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Minimum cases before we surface community data publicly
const MIN_CASES = 5;

export async function POST() {
  // Aggregate resolved journal entries by remedy (exclude TESTING + UNKNOWN)
  const rows = await prisma.journalEntry.groupBy({
    by: ["remedyId"],
    where: {
      outcome: { in: ["WORKED", "PARTIAL", "NO_EFFECT", "AGGRAVATION", "WRONG_REMEDY"] },
    },
    _count: { id: true },
  });

  // For worked/partial counts we need a second pass per remedy
  const upserts = await Promise.all(
    rows.map(async (row) => {
      const [workedCount, partialCount] = await Promise.all([
        prisma.journalEntry.count({
          where: { remedyId: row.remedyId, outcome: "WORKED" },
        }),
        prisma.journalEntry.count({
          where: { remedyId: row.remedyId, outcome: "PARTIAL" },
        }),
      ]);

      return prisma.communityRemedyStat.upsert({
        where: { remedyId: row.remedyId },
        update: {
          totalCases: row._count.id,
          workedCases: workedCount,
          partialCases: partialCount,
          lastUpdatedAt: new Date(),
        },
        create: {
          remedyId: row.remedyId,
          totalCases: row._count.id,
          workedCases: workedCount,
          partialCases: partialCount,
        },
      });
    })
  );

  const surfaced = upserts.filter((s) => s.totalCases >= MIN_CASES).length;

  return NextResponse.json({
    ok: true,
    remediesProcessed: upserts.length,
    remediesSurfaced: surfaced,
    minCasesThreshold: MIN_CASES,
    ts: new Date().toISOString(),
  });
}
