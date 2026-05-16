import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { getOrCreateDbUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getOrCreateDbUser();
  if (!user) redirect("/sign-in");

  const profile = await prisma.profile.findFirst({
    where: { id, userId: user.id },
    include: {
      journalEntries: {
        include: { remedy: true },
        orderBy: { date: "desc" },
        take: 10,
      },
      profileRemedyNotes: {
        include: { remedy: true },
      },
    },
  });

  if (!profile) notFound();

  const age = profile.dateOfBirth
    ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xl font-semibold text-green-800">RemedyHome</Link>
          <span className="text-stone-300">/</span>
          <Link href="/profiles" className="text-stone-600 font-medium hover:text-stone-900">Family Profiles</Link>
          <span className="text-stone-300">/</span>
          <span className="text-stone-600">{profile.name}</span>
        </div>
        <UserButton />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Profile header */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-2xl">
            {profile.name[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{profile.name}</h2>
            <p className="text-stone-500 text-sm">
              {age !== null ? `${age} years old` : "Age unknown"}
              {profile.gender ? ` · ${profile.gender}` : ""}
            </p>
            {profile.notes && (
              <p className="text-stone-500 text-sm mt-1 max-w-md">{profile.notes}</p>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 mb-10">
          <Link
            href={`/research?profileId=${profile.id}`}
            className="px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800"
          >
            Find a remedy
          </Link>
          <Link
            href={`/journal/new?profileId=${profile.id}`}
            className="px-4 py-2 border border-stone-200 text-stone-700 text-sm font-medium rounded-lg hover:border-stone-300 bg-white"
          >
            Log a remedy
          </Link>
        </div>

        {/* Remedy journal */}
        <section className="mb-10">
          <h3 className="text-lg font-semibold mb-4">Recent remedy history</h3>
          {profile.journalEntries.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-stone-200 rounded-xl">
              <p className="text-stone-400 mb-2">No entries yet</p>
              <Link href={`/journal/new?profileId=${profile.id}`} className="text-green-700 text-sm hover:underline">
                Log the first remedy
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {profile.journalEntries.map((entry) => (
                <div key={entry.id} className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-medium">{entry.remedy.name}</span>
                      {entry.potency && <span className="text-stone-400 text-sm ml-2">{entry.potency}</span>}
                      <p className="text-sm text-stone-500 mt-1">{entry.symptoms}</p>
                    </div>
                    <div className="text-right">
                      <OutcomeBadge outcome={entry.outcome} />
                      <p className="text-xs text-stone-400 mt-1">
                        {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pinned remedy notes */}
        {profile.profileRemedyNotes.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold mb-4">Pinned remedy notes</h3>
            <div className="space-y-3">
              {profile.profileRemedyNotes.map((note) => (
                <div key={note.id} className="bg-white rounded-xl border border-stone-200 p-4">
                  <p className="font-medium text-sm">{note.remedy.name}</p>
                  <p className="text-sm text-stone-500 mt-1">{note.note}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const styles: Record<string, string> = {
    WORKED: "bg-green-100 text-green-700",
    PARTIAL: "bg-yellow-100 text-yellow-700",
    NO_EFFECT: "bg-stone-100 text-stone-500",
    AGGRAVATION: "bg-orange-100 text-orange-700",
    WRONG_REMEDY: "bg-red-100 text-red-600",
    UNKNOWN: "bg-stone-100 text-stone-400",
  };
  const labels: Record<string, string> = {
    WORKED: "Worked",
    PARTIAL: "Partial",
    NO_EFFECT: "No effect",
    AGGRAVATION: "Aggravation",
    WRONG_REMEDY: "Wrong remedy",
    UNKNOWN: "Unknown",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[outcome] ?? styles.UNKNOWN}`}>
      {labels[outcome] ?? outcome}
    </span>
  );
}
