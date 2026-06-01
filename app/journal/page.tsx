import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreateDbUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import NavHeader from "@/components/NavHeader";

const OUTCOME_STYLES: Record<string, string> = {
  WORKED: "bg-green-100 text-green-700",
  PARTIAL: "bg-yellow-100 text-yellow-700",
  NO_EFFECT: "bg-stone-100 text-stone-500",
  AGGRAVATION: "bg-orange-100 text-orange-700",
  WRONG_REMEDY: "bg-red-100 text-red-600",
  UNKNOWN: "bg-stone-100 text-stone-400",
  TESTING: "bg-amber-100 text-amber-700",
};

const OUTCOME_LABELS: Record<string, string> = {
  WORKED: "Worked",
  PARTIAL: "Partial",
  NO_EFFECT: "No effect",
  AGGRAVATION: "Aggravation",
  WRONG_REMEDY: "Wrong remedy",
  UNKNOWN: "Unknown",
  TESTING: "Testing",
};

export default async function JournalPage() {
  const user = await getOrCreateDbUser();
  if (!user) redirect("/sign-in");

  const entries = await prisma.journalEntry.findMany({
    where: { userId: user.id },
    include: {
      remedy: true,
      profile: true,
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <NavHeader section="Remedy Journal" />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold mb-1">Remedy Journal</h2>
            <p className="text-stone-500 text-sm">Everything you&apos;ve tried across your family.</p>
          </div>
          <Link
            href="/journal/new"
            className="px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800"
          >
            + Log a remedy
          </Link>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-stone-200 rounded-2xl">
            <p className="text-stone-400 mb-3">No entries yet.</p>
            <Link href="/journal/new" className="text-green-700 text-sm hover:underline font-medium">
              Log your first remedy →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-xl border border-stone-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{entry.remedy.name}</span>
                      {entry.potency && (
                        <span className="text-stone-400 text-sm">{entry.potency}</span>
                      )}
                      <span className="text-stone-300 text-xs">·</span>
                      <Link
                        href={`/profiles/${entry.profile.id}`}
                        className="text-sm text-green-700 hover:underline"
                      >
                        {entry.profile.name}
                      </Link>
                    </div>
                    <p className="text-sm text-stone-500 mt-1 line-clamp-2">{entry.symptoms}</p>
                    {entry.notes && (
                      <p className="text-xs text-stone-400 mt-1 italic">{entry.notes}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        OUTCOME_STYLES[entry.outcome] ?? OUTCOME_STYLES.UNKNOWN
                      }`}
                    >
                      {OUTCOME_LABELS[entry.outcome] ?? entry.outcome}
                    </span>
                    <p className="text-xs text-stone-400 mt-1">
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
