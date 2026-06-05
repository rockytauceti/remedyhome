/**
 * POST /api/repertorize
 *
 * Streams SSE progress events while running the repertorization pipeline,
 * then emits a final "result" event with matches + activeSources.
 *
 * Event types:
 *   { type: "progress", message: string }
 *   { type: "result",   matches: RemedyMatch[], activeSources: Source[] }
 *   { type: "error",    error: string }
 */

import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { repertorize } from "@/lib/repertorize";

const client = new Anthropic();
const DEFAULT_SOURCE_SLUGS = ["kent", "boericke", "boericke-new", "clarke"];

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { symptoms, excludedSymptoms = [] } = await req.json();
  if (!symptoms?.trim()) {
    return new Response(JSON.stringify({ error: "Symptoms required" }), { status: 400 });
  }

  const user = await getOrCreateDbUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // Resolve active sources from user preferences
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

  const activeSourceInfo = activeSources.map((s) => ({ id: s.id, slug: s.slug, name: s.name }));
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        const matches = await repertorize(symptoms, {
          prisma,
          client,
          activeSources,
          excludedSymptoms,
          onProgress: (message) => send({ type: "progress", message }),
        });

        // Attach community stats to each match (if available, min 5 cases)
        // Wrapped in try/catch — table may not exist yet if migration hasn't run
        let matchesWithCommunity = matches;
        try {
          const abbreviations = matches.map((m) => m.abbreviation);
          const remediesWithStats = await prisma.remedy.findMany({
            where: { abbreviation: { in: abbreviations } },
            include: { communityStat: true },
          });
          const statsByAbbrev = Object.fromEntries(
            remediesWithStats
              .filter((r) => r.communityStat && r.communityStat.totalCases >= 5)
              .map((r) => [r.abbreviation, r.communityStat!])
          );
          matchesWithCommunity = matches.map((m) => {
            const stat = statsByAbbrev[m.abbreviation];
            if (!stat) return m;
            const effectiveRate = Math.round(((stat.workedCases + stat.partialCases) / stat.totalCases) * 100);
            return { ...m, communityStats: { totalCases: stat.totalCases, effectiveRate } };
          });
        } catch {
          // Community stats unavailable — proceed without them
        }

        send({ type: "result", matches: matchesWithCommunity, activeSources: activeSourceInfo });
      } catch (err) {
        console.error("[/api/repertorize]", err);
        send({ type: "error", error: err instanceof Error ? err.message : "Repertorization failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
