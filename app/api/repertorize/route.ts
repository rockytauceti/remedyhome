/**
 * POST /api/repertorize
 *
 * Phase 6: Repertorization engine endpoint.
 * Uses Kent rubric DB + Boericke keynotes to ground remedy recommendations.
 *
 * Request:  { symptoms: string, excludedSymptoms?: string[] }
 * Response: { matches: RemedyMatch[], activeSources: Source[], rubricQueries?: RubricQuery[] }
 *
 * Same response shape as /api/research so the Phase 7 UI swap is a one-liner.
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { repertorize } from "@/lib/repertorize";

const client = new Anthropic();
const DEFAULT_SOURCE_SLUGS = ["kent", "boericke", "boericke-new", "clarke"];

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symptoms, excludedSymptoms = [] } = await req.json();
  if (!symptoms?.trim()) return NextResponse.json({ error: "Symptoms required" }, { status: 400 });

  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Resolve active sources from user preferences (same logic as /api/research)
  const prefs = await prisma.sourcePreference.findMany({
    where: { userId: user.id, enabled: true },
    include: { source: true },
  });

  let activeSources;
  if (prefs.length > 0) {
    activeSources = prefs.map((p) => p.source);
  } else {
    activeSources = await prisma.source.findMany({
      where: { slug: { in: DEFAULT_SOURCE_SLUGS } },
    });
  }

  // Ensure Kent is always included (required for repertorization)
  const hasKent = activeSources.some((s) => s.slug === "kent");
  if (!hasKent) {
    const kent = await prisma.source.findUnique({ where: { slug: "kent" } });
    if (kent) activeSources = [kent, ...activeSources];
  }

  try {
    const matches = await repertorize(symptoms, {
      prisma,
      client,
      activeSources,
      excludedSymptoms,
    });

    const activeSourceInfo = activeSources.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
    }));

    return NextResponse.json({ matches, activeSources: activeSourceInfo });
  } catch (err) {
    console.error("[/api/repertorize]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Repertorization failed" },
      { status: 500 }
    );
  }
}
