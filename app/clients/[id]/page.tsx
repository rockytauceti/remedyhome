import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOrCreateDbUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import NavHeader from "@/components/NavHeader";

export default async function ClientGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getOrCreateDbUser();
  if (!user) redirect("/sign-in");
  if (user.plan !== "PRACTITIONER") redirect("/dashboard");

  const group = await prisma.clientGroup.findFirst({
    where: { id, userId: user.id },
    include: {
      profiles: {
        include: {
          journalEntries: {
            orderBy: { date: "desc" },
            take: 3,
            include: { remedy: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!group) notFound();

  return (
    <div className="min-h-screen bg-stone-50">
      <NavHeader section={group.name} />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/clients" className="text-sm text-stone-400 hover:text-stone-600">
                ← Clients
              </Link>
            </div>
            <h2 className="text-2xl font-semibold">{group.name}</h2>
            {group.notes && (
              <p className="text-stone-500 text-sm mt-1 max-w-md">{group.notes}</p>
            )}
          </div>
          <Link
            href={`/profiles/new?clientGroupId=${group.id}`}
            className="px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800"
          >
            + Add member
          </Link>
        </div>

        {group.profiles.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-stone-200 rounded-xl">
            <p className="text-stone-400 text-lg mb-4">No profiles yet for this client</p>
            <Link
              href={`/profiles/new?clientGroupId=${group.id}`}
              className="text-green-700 font-medium hover:underline"
            >
              Add first family member
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {group.profiles.map((profile) => (
              <div key={profile.id} className="bg-white rounded-xl border border-stone-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <Link href={`/profiles/${profile.id}`} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-semibold">
                      {profile.name[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-stone-900 hover:text-green-800">{profile.name}</span>
                  </Link>
                  <div className="flex gap-2">
                    <Link
                      href={`/research`}
                      className="text-xs px-3 py-1.5 bg-green-700 text-white rounded-lg hover:bg-green-800"
                    >
                      Find remedy
                    </Link>
                    <Link
                      href={`/journal/new?profileId=${profile.id}`}
                      className="text-xs px-3 py-1.5 border border-stone-200 text-stone-600 rounded-lg hover:border-stone-300"
                    >
                      Log entry
                    </Link>
                  </div>
                </div>

                {profile.journalEntries.length > 0 && (
                  <div className="mt-2 space-y-1 pl-13">
                    <p className="text-xs text-stone-400 font-medium mb-1.5">Recent entries</p>
                    {profile.journalEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-2 text-sm text-stone-500">
                        <span className="text-stone-300">·</span>
                        <span>{entry.remedy.name}</span>
                        {entry.potency && <span className="text-stone-400 text-xs">{entry.potency}</span>}
                        <span className="text-xs text-stone-300">
                          {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
