import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOrCreateDbUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { OutcomeButtons } from "./outcome-buttons";
import NavHeader from "@/components/NavHeader";

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
        take: 50,
      },
      profileRemedyNotes: {
        include: { remedy: true },
      },
    },
  });

  if (!profile) notFound();

  const testingEntries = profile.journalEntries.filter((e) => e.outcome === "TESTING");
  const historyEntries = profile.journalEntries.filter((e) => e.outcome !== "TESTING").slice(0, 10);

  const age = profile.dateOfBirth
    ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  return (
    <div className="min-h-screen bg-stone-50">
      <NavHeader section={profile.name} />

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
            href={`/research`}
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

        {/* Currently Testing */}
        {testingEntries.length > 0 && (
          <section className="mb-10">
            <h3 className="text-lg font-semibold mb-1">Currently testing</h3>
            <p className="text-stone-400 text-sm mb-4">Remedies being trialed — mark an outcome when ready</p>
            <div className="space-y-3">
              {testingEntries.map((entry: (typeof profile.journalEntries)[number]) => (
                <div key={entry.id} className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-medium">{entry.remedy.name}</span>
                      {entry.potency && <span className="text-stone-400 text-sm ml-2">{entry.potency}</span>}
                      <p className="text-sm text-stone-500 mt-1">{entry.symptoms}</p>
                      <p className="text-xs text-stone-400 mt-1">
                        Added {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Testing</span>
                  </div>
                  <OutcomeButtons entryId={entry.id} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Remedy history */}
        <section className="mb-10">
          <h3 className="text-lg font-semibold mb-4">Remedy history</h3>
          {historyEntries.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-stone-200 rounded-xl">
              <p className="text-stone-400 mb-2">No entries yet</p>
              <Link href={`/journal/new?profileId=${profile.id}`} className="text-green-700 text-sm hover:underline">
                Log the first remedy
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {historyEntries.map((entry: (typeof profile.journalEntries)[number]) => (
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
              {profile.profileRemedyNotes.map((note: (typeof profile.profileRemedyNotes)[number]) => (
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
    TESTING: "bg-amber-100 text-amber-700",
  };
  const labels: Record<string, string> = {
    WORKED: "Worked",
    PARTIAL: "Partial",
    NO_EFFECT: "No effect",
    AGGRAVATION: "Aggravation",
    WRONG_REMEDY: "Wrong remedy",
    UNKNOWN: "Unknown",
    TESTING: "Testing",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[outcome] ?? styles.UNKNOWN}`}>
      {labels[outcome] ?? outcome}
    </span>
  );
}
