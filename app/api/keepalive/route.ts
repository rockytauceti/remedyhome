import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await prisma.$queryRaw`SELECT 1`;

  // Trigger community data aggregation in the background (fire-and-forget)
  fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.remedyhome.app"}/api/community/aggregate`, {
    method: "POST",
  }).catch(() => {}); // ignore errors — keepalive should never fail

  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}
