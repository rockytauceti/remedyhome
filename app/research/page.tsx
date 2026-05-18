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
  notes: string;
}

export default function ResearchPage() {
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<RemedyMatch[]>([]);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setLoading(true);
    setError("");
    setMatches([]);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.raw ? `${data.error}: ${data.raw.slice(0, 300)}` : data.error);
      setMatches(data.matches ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-xl font-semibold text-green-800">RemedyHome</Link>
        <span className="text-stone-300">/</span>
        <span className="text-stone-600 font-medium">Find a Remedy</span>
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
          <div className="space-y-4">
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
                  <div className="text-right">
                    <MatchBadge score={match.matchScore} />
                  </div>
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

                {match.notes && (
                  <p className="text-xs text-stone-400 italic">{match.notes}</p>
                )}

                <div className="mt-4 pt-3 border-t border-stone-100">
                  <Link
                    href={`/journal/new?remedy=${match.abbreviation}&remedyName=${encodeURIComponent(match.name)}&potency=${match.suggestedPotency}`}
                    className="text-sm text-green-700 font-medium hover:underline"
                  >
                    + Log this remedy in journal
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
