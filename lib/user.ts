import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

// Ensures the signed-in Clerk user exists in our DB, creating them if not.
// Call this at the top of any server component that needs the DB user.
export async function getOrCreateDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  return prisma.user.upsert({
    where: { clerkId: userId },
    update: { email, name },
    create: { clerkId: userId, email, name },
  });
}
