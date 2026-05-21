import { NextRequest, NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

const DEFAULT_SOURCE_SLUGS = ["kent", "boericke", "boericke-new", "clarke"];

export async function PATCH(req: NextRequest) {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sourceId, enabled } = await req.json();
  if (!sourceId || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "sourceId and enabled required" }, { status: 400 });
  }

  // If first time (no prefs), initialize from defaults before toggling
  const existingCount = await prisma.sourcePreference.count({ where: { userId: user.id } });
  if (existingCount === 0) {
    const defaultSources = await prisma.source.findMany({ where: { slug: { in: DEFAULT_SOURCE_SLUGS } } });
    await prisma.sourcePreference.createMany({
      data: defaultSources.map((s) => ({
        userId: user.id,
        sourceId: s.id,
        weight: 1,
        enabled: s.id === sourceId ? enabled : true,
      })),
    });
  } else {
    await prisma.sourcePreference.upsert({
      where: { userId_sourceId: { userId: user.id, sourceId } },
      create: { userId: user.id, sourceId, weight: 1, enabled },
      update: { enabled },
    });
  }

  return NextResponse.json({ ok: true });
}
