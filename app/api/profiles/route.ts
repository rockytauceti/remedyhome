import { NextResponse } from "next/server";
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
