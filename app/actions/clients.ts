"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";

export async function createClientGroup(formData: FormData) {
  const user = await getOrCreateDbUser();
  if (!user) redirect("/sign-in");
  if (user.plan !== "PRACTITIONER") redirect("/dashboard");

  const name = formData.get("name") as string;
  const notes = formData.get("notes") as string;

  if (!name?.trim()) throw new Error("Name is required");

  const group = await prisma.clientGroup.create({
    data: {
      userId: user.id,
      name: name.trim(),
      notes: notes || null,
    },
  });

  redirect(`/clients/${group.id}`);
}
