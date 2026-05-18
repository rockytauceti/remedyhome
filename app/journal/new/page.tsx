import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { getOrCreateDbUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { createJournalEntry } from "@/app/actions/journal";

export default async function NewJournalEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string; remedy?: string; remedyName?: string; potency?: string }>;
}) {
  const params = await searchParams;
  const user = await getOrCreateDbUser();
  if (!user) redirect("/sign-in");

  const [profiles, remedies] = await Promise.all([
    prisma.profile.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.remedy.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Pre-select remedy from search params (coming from research page)
  const preselectedRemedy = params.remedy
    ? remedies.find((r) => r.abbreviation === params.remedy)
    : null;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xl font-semibold text-green-800">RemedyHome</Link>
          <span className="text-stone-300">/</span>
          <span className="text-stone-600 font-medium">Log a Remedy</span>
        </div>
        <UserButton />
      </header>

      <main className="max-w-lg mx-auto px-6 py-10">
        <h2 className="text-2xl font-semibold mb-1">Log a remedy</h2>
        <p className="text-stone-500 text-sm mb-8">Record what you tried and how it worked.</p>

        <form action={createJournalEntry} className="space-y-5">
          {/* Profile */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Family member <span className="text-red-400">*</span>
            </label>
            <select
              name="profileId"
              required
              defaultValue={params.profileId ?? ""}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">Select a profile…</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Remedy */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Remedy <span className="text-red-400">*</span>
            </label>
            <select
              name="remedyId"
              required
              defaultValue={preselectedRemedy?.id ?? ""}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">Select a remedy…</option>
              {remedies.map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.abbreviation})</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Date given</label>
            <input
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Potency */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Potency</label>
            <input
              name="potency"
              type="text"
              defaultValue={params.potency ?? ""}
              placeholder="e.g. 30C, 200C, LM1"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Dosage */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Dosage</label>
            <input
              name="dosage"
              type="text"
              placeholder="e.g. 3 pellets, once"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Symptoms */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Symptoms at time of dosing <span className="text-red-400">*</span>
            </label>
            <textarea
              name="symptoms"
              required
              rows={3}
              placeholder="Describe the symptoms that led you to choose this remedy…"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Outcome</label>
            <select
              name="outcome"
              defaultValue="UNKNOWN"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="TESTING">Currently testing — outcome TBD</option>
              <option value="UNKNOWN">Unknown / still observing</option>
              <option value="WORKED">Worked — clear improvement</option>
              <option value="PARTIAL">Partial — some improvement</option>
              <option value="NO_EFFECT">No effect</option>
              <option value="AGGRAVATION">Aggravation (initial worsening, then better)</option>
              <option value="WRONG_REMEDY">Wrong remedy — discontinued</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Additional notes <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Any other observations…"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800"
            >
              Save entry
            </button>
            <Link
              href={params.profileId ? `/profiles/${params.profileId}` : "/profiles"}
              className="px-5 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 rounded-lg border border-stone-200 hover:border-stone-300"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
