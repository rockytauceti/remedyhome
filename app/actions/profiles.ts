"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";

export async function createProfile(formData: FormData) {
  const user = await getOrCreateDbUser();
  if (!user) redirect("/sign-in");

  const name = formData.get("name") as string;
  const dateOfBirthRaw = formData.get("dateOfBirth") as string;
  const gender = formData.get("gender") as string;
  const notes = formData.get("notes") as string;
  const clientGroupId = formData.get("clientGroupId") as string;

  if (!name?.trim()) throw new Error("Name is required");

  await prisma.profile.create({
    data: {
      userId: user.id,
      name: name.trim(),
      dateOfBirth: dateOfBirthRaw ? new Date(dateOfBirthRaw) : null,
      gender: gender || null,
      notes: notes || null,
      clientGroupId: clientGroupId || null,
    },
  });

  redirect(clientGroupId ? `/clients/${clientGroupId}` : "/profiles");
}

export async function deleteProfile(profileId: string) {
  const user = await getOrCreateDbUser();
  if (!user) redirect("/sign-in");

  await prisma.profile.deleteMany({
    where: { id: profileId, userId: user.id },
  });

  redirect("/profiles");
}
