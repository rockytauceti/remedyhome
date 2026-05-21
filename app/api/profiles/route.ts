import { NextRequest, NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profiles = await prisma.profile.findMany({
    where: { userId: user.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ profiles });
}

export async function POST(req: NextRequest) {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const profile = await prisma.profile.create({
    data: { userId: user.id, name: name.trim() },
    select: { id: true, name: true },
  });

  return NextResponse.json({ profile });
}
