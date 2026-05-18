"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";
import { redirect } from "next/navigation";

export async function saveSourcePreferences(formData: FormData) {
  const user = await getOrCreateDbUser();
  if (!user) redirect("/sign-in");

  const sources = await prisma.source.findMany();

  // Delete existing preferences and recreate
  await prisma.sourcePreference.deleteMany({ where: { userId: user.id } });

  const creates = sources
    .filter((s) => formData.get(`source_${s.id}`) === "on")
    .map((s) => ({
      userId: user.id,
      sourceId: s.id,
      weight: 1,
      enabled: true,
    }));

  if (creates.length > 0) {
    await prisma.sourcePreference.createMany({ data: creates });
  }

  revalidatePath("/settings");
}
