"use client";

import { useState } from "react";
import Link from "next/link";

interface RemedyMatch {
  abbreviation: string;
  name: string;
  matchScore: number;
  whyItMatches: string;
  keySymptoms: string[];
  suggestedPotency: string;
  notes?: string;
  sources?: string[];
}

interface Profile {
  id: string;
  name: string;
}

export default function ResearchPage() {
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<RemedyMatch[]>([]);
  const [error, setError] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [addingTo, setAddingTo] = useState<string | null>(null); // abbreviation being added
  const [selectedProfile, setSelectedProfile] = useState("");
  const [addedEntries, setAddedEntries] = useState<Set<string>>(new Set());

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setLoading(true);
    setError("");
    setMatches([]);
    setAddedEntries(new Set());

    try {
      // Fetch profiles and search in parallel
      const [researchRes, profilesRes] = await Promise.all([
        fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symptoms }),
        }),
        fetch("/api/profiles"),
      ]);

      const data = await researchRes.json();
      if (data.error) throw new Error(data.error);
      setMatches(data.matches ?? []);

      if (profilesRes.ok) {
        const profileData = await profilesRes.json();
        setProfiles(profileData.profiles ?? []);
        if (profileData.profiles?.length > 0) setSelectedProfile(profileData.profiles[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToTesting(match: RemedyMatch) {
    if (!selectedProfile) return;
    setAddingTo(match.abbreviation);
    try {
      const res = await fetch("/api/testing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: selectedProfile,
          remedyAbbreviation: match.abbreviation,
          remedyName: match.name,
          symptoms,
          suggestedPotency: match.suggestedPotency,
        }),
      });
      if (res.ok) {
        setAddedEntries((prev) => new Set([...prev, match.abbreviation]));
      }
    } finally {
      setAddingTo(null);
    }
  }

  const selectedProfileName = profiles.find((p) => p.id === selectedProfile)?.name;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xl font-semibold text-green-800">RemedyHome</Link>
          <span className="text-stone-300">/</span>
          <span className="text-stone-600 font-medium">Find a Remedy</span>
        </div>
        <Link href="/settings" className="text-sm text-stone-400 hover:text-stone-600">Sources</Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-semibold mb-1">Find a Remedy</h2>
        <p className="text-stone-500 text-sm mb-8">
          Describe the symptoms in plain language — be specific about what makes them better or worse, time of day, mood, and any unusual details.
        </p>

        <form onSubmit={handleSearch} className="mb-10">
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows={5}
            placeholder="e.g. High fever that came on suddenly this afternoon. Skin is hot, dry and flushed. Very thirsty. Restless and irritable. Worse around 3pm. No sweat."
            className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
          <button
            type="submit"
            disabled={loading || !symptoms.trim()}
            className="mt-3 px-6 py-2.5 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing symptoms…" : "Find matching remedies"}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-16 text-stone-400">
            <div className="text-4xl mb-3">🌿</div>
            <p>Consulting the materia medica…</p>
          </div>
        )}

        {matches.length > 0 && (
          <div className="space-y-5">
            {/* Profile selector for adding to testing */}
            {profiles.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-sm text-green-800 font-medium">Add remedies to testing list for:</span>
                <select
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                  className="text-sm border border-green-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <h3 className="text-lg font-semibold">Top matches</h3>
            {matches.map((match, i) => (
              <div key={match.abbreviation} className="bg-white rounded-xl border border-stone-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-400">#{i + 1}</span>
                      <h4 className="font-semibold text-lg">{match.name}</h4>
                      <span className="text-stone-400 text-sm">({match.abbreviation})</span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">Suggested potency: <span className="font-medium text-stone-600">{match.suggestedPotency}</span></p>
                  </div>
                  <MatchBadge score={match.matchScore} />
                </div>

                <p className="text-sm text-stone-700 mb-3">{match.whyItMatches}</p>

                {match.keySymptoms?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {match.keySymptoms.map((s) => (
                      <span key={s} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {match.sources && match.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {match.sources.map((s) => (
                      <span key={s} className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                        📖 {s}
                      </span>
                    ))}
                  </div>
                )}

                {match.notes && (
                  <p className="text-xs text-stone-400 italic mb-3">{match.notes}</p>
                )}

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-3 flex-wrap">
                  {profiles.length > 0 && (
                    addedEntries.has(match.abbreviation) ? (
                      <span className="text-sm text-green-700 font-medium">
                        ✓ Added to {selectedProfileName}&apos;s testing list
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddToTesting(match)}
                        disabled={addingTo === match.abbreviation}
                        className="text-sm bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 disabled:opacity-50 font-medium"
                      >
                        {addingTo === match.abbreviation ? "Adding…" : `+ Add to ${selectedProfileName}'s testing list`}
                      </button>
                    )
                  )}
                  <Link
                    href={`/journal/new?remedy=${match.abbreviation}&remedyName=${encodeURIComponent(match.name)}&potency=${match.suggestedPotency}`}
                    className="text-sm text-stone-500 hover:text-stone-700"
                  >
                    Log with full details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function MatchBadge({ score }: { score: number }) {
  const color = score >= 85 ? "bg-green-100 text-green-700" : score >= 70 ? "bg-yellow-100 text-yellow-700" : "bg-stone-100 text-stone-500";
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>
      {score}% match
    </span>
  );
}
