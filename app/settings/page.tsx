import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { getOrCreateDbUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { saveSourcePreferences } from "@/app/actions/settings";

// Recommended defaults for new users
const DEFAULT_SOURCE_SLUGS = ["kent", "boericke", "boericke-new", "castro-handbook", "ullman-children", "hershoff-remedies"];

export default async function SettingsPage() {
  const user = await getOrCreateDbUser();
  if (!user) redirect("/sign-in");

  const [sources, existingPrefs] = await Promise.all([
    prisma.source.findMany({ orderBy: { year: "asc" } }),
    prisma.sourcePreference.findMany({ where: { userId: user.id } }),
  ]);

  const enabledSourceIds = new Set(existingPrefs.map((p) => p.sourceId));
  // For new users with no prefs, use defaults
  const isFirstTime = existingPrefs.length === 0;
  const defaultSlugs = new Set(DEFAULT_SOURCE_SLUGS);

  function isChecked(source: (typeof sources)[number]) {
    if (isFirstTime) return defaultSlugs.has(source.slug);
    return enabledSourceIds.has(source.id);
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xl font-semibold text-green-800">RemedyHome</Link>
          <span className="text-stone-300">/</span>
          <span className="text-stone-600 font-medium">Settings</span>
        </div>
        <UserButton />
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-semibold mb-1">Research Sources</h2>
        <p className="text-stone-500 text-sm mb-8">
          Choose which books and references to include when finding remedy matches. Claude will cite these in its recommendations.
        </p>

        <form action={saveSourcePreferences}>
          <div className="space-y-3 mb-8">
            {sources.map((source) => (
              <label
                key={source.id}
                className="flex items-start gap-4 bg-white rounded-xl border border-stone-200 p-4 cursor-pointer hover:border-green-300 transition-colors"
              >
                <input
                  type="checkbox"
                  name={`source_${source.id}`}
                  defaultChecked={isChecked(source)}
                  className="mt-1 accent-green-700"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-stone-900">{source.name}</span>
                    {source.isPublicDomain && (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">Public domain</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">{source.author}{source.year ? ` · ${source.year}` : ""}</p>
                  <p className="text-sm text-stone-500 mt-1">{source.description}</p>
                </div>
              </label>
            ))}
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800"
          >
            Save preferences
          </button>
        </form>
      </main>
    </div>
  );
}
