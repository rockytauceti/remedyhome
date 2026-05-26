"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";

export async function createJournalEntry(formData: FormData) {
  const user = await getOrCreateDbUser();
  if (!user) redirect("/sign-in");

  const profileId = formData.get("profileId") as string;
  const remedyId = formData.get("remedyId") as string;
  const symptoms = formData.get("symptoms") as string;
  const potency = formData.get("potency") as string;
  const dosage = formData.get("dosage") as string;
  const outcome = formData.get("outcome") as string;
  const notes = formData.get("notes") as string;
  const dateRaw = formData.get("date") as string;

  if (!profileId || !remedyId || !symptoms) {
    throw new Error("Profile, remedy, and symptoms are required");
  }

  // Verify profile belongs to user
  const profile = await prisma.profile.findFirst({ where: { id: profileId, userId: user.id } });
  if (!profile) redirect("/profiles");

  await prisma.journalEntry.create({
    data: {
      userId: user.id,
      profileId,
      remedyId,
      symptoms,
      potency: potency || null,
      dosage: dosage || null,
      outcome: (outcome as "TESTING" | "WORKED" | "PARTIAL" | "NO_EFFECT" | "AGGRAVATION" | "WRONG_REMEDY" | "UNKNOWN") || "UNKNOWN",
      notes: notes || null,
      date: dateRaw ? new Date(dateRaw) : new Date(),
    },
  });

  redirect(`/profiles/${profileId}`);
}
