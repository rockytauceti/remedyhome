"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";

export async function addToTesting(data: {
  profileId: string;
  remedyAbbreviation: string;
  remedyName: string;
  symptoms: string;
  suggestedPotency: string;
}) {
  const user = await getOrCreateDbUser();
  if (!user) redirect("/sign-in");

  const profile = await prisma.profile.findFirst({ where: { id: data.profileId, userId: user.id } });
  if (!profile) return { error: "Profile not found" };

  const remedy = await prisma.remedy.findFirst({ where: { abbreviation: data.remedyAbbreviation } });
  if (!remedy) return { error: "Remedy not found" };

  await prisma.journalEntry.create({
    data: {
      userId: user.id,
      profileId: data.profileId,
      remedyId: remedy.id,
      symptoms: data.symptoms,
      potency: data.suggestedPotency || null,
      outcome: "TESTING",
    },
  });

  revalidatePath(`/profiles/${data.profileId}`);
  return { success: true };
}

export async function updateOutcome(entryId: string, outcome: string) {
  const user = await getOrCreateDbUser();
  if (!user) redirect("/sign-in");

  const entry = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId: user.id },
  });
  if (!entry) return { error: "Entry not found" };

  await prisma.journalEntry.update({
    where: { id: entryId },
    data: { outcome: outcome as "TESTING" | "WORKED" | "PARTIAL" | "NO_EFFECT" | "AGGRAVATION" | "WRONG_REMEDY" | "UNKNOWN" },
  });

  revalidatePath(`/profiles/${entry.profileId}`);
  return { success: true };
}
