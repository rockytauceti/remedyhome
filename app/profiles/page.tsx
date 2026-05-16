import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { getOrCreateDbUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { DeleteProfileButton } from "./delete-button";

export default async function ProfilesPage() {
  const user = await getOrCreateDbUser();
  if (!user) redirect("/sign-in");

  const profiles = await prisma.profile.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xl font-semibold text-green-800">RemedyHome</Link>
          <span className="text-stone-300">/</span>
          <span className="text-stone-600 font-medium">Family Profiles</span>
        </div>
        <UserButton />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold">Family Profiles</h2>
            <p className="text-stone-500 text-sm mt-1">Track remedies separately for each family member</p>
          </div>
          <Link
            href="/profiles/new"
            className="px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800"
          >
            + Add profile
          </Link>
        </div>

        {profiles.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-stone-200 rounded-xl">
            <p className="text-stone-400 text-lg mb-4">No profiles yet</p>
            <Link href="/profiles/new" className="text-green-700 font-medium hover:underline">
              Add your first family member
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="bg-white rounded-xl border border-stone-200 p-5 flex items-center justify-between hover:border-stone-300 transition-colors"
              >
                <Link href={`/profiles/${profile.id}`} className="flex items-center gap-4 flex-1">
                  <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-semibold text-lg">
                    {profile.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">{profile.name}</p>
                    <p className="text-sm text-stone-400">
                      {profile.dateOfBirth
                        ? new Date(profile.dateOfBirth).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                        : "No birthday set"}
                      {profile.gender ? ` · ${profile.gender}` : ""}
                    </p>
                  </div>
                </Link>
                <DeleteProfileButton profileId={profile.id} name={profile.name} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
