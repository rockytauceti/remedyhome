"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

interface Source {
  id: string;
  name: string;
  slug: string;
}

interface RubricEvidence {
  path: string;
  grade: number;
}

interface RemedyMatch {
  abbreviation: string;
  name: string;
  matchScore: number;
  whyItMatches: string;
  keySymptoms: string[];
  suggestedPotency: string;
  notes?: string;
  sources?: string[];
  // Phase 6 additions
  rubricEvidence?: RubricEvidence[];
  kentScore?: number;
  queriesMatched?: number;
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
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [addedEntries, setAddedEntries] = useState<Set<string>>(new Set());
  const [addingProfile, setAddingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState<Set<string>>(new Set());

  // Interactive state
  const [deselectedSymptoms, setDeselectedSymptoms] = useState<Set<string>>(new Set());
  const [committedExclusions, setCommittedExclusions] = useState<Set<string>>(new Set());
  const [activeSources, setActiveSources] = useState<Source[]>([]);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [togglingSource, setTogglingSource] = useState<string | null>(null);
  const [refining, setRefining] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");

  const runSearch = useCallback(async (
    symptomText: string,
    excludedSymptoms: string[],
    profilesAlreadyLoaded: boolean
  ) => {
    setRefining(true);
    setError("");
    setProgressMessage("");

    try {
      // Fetch profiles in parallel while streaming repertorize
      const profilesPromise = profilesAlreadyLoaded
        ? Promise.resolve(null)
        : fetch("/api/profiles");

      const response = await fetch("/api/repertorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: symptomText, excludedSymptoms }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          const event = JSON.parse(part.slice(6));
          if (event.type === "progress") {
            setProgressMessage(event.message);
          } else if (event.type === "result") {
            setMatches(event.matches ?? []);
            setActiveSources(event.activeSources ?? []);
            setAddedEntries(new Set());
            setExpandedEvidence(new Set());
          } else if (event.type === "error") {
            throw new Error(event.error);
          }
        }
      }

      const profilesRes = await profilesPromise;
      if (profilesRes && profilesRes.ok) {
        const profileData = await profilesRes.json();
        setProfiles(profileData.profiles ?? []);
        if (profileData.profiles?.length > 0) {
          setSelectedProfile((prev) => prev || profileData.profiles[0].id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setRefining(false);
      setLoading(false);
      setProgressMessage("");
    }
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!symptoms.trim()) return;
    setLoading(true);
    setDeselectedSymptoms(new Set());
    setCommittedExclusions(new Set());
    setMatches([]);
    await runSearch(symptoms, [], false);
  }

  function toggleSymptom(symptom: string) {
    setDeselectedSymptoms((prev) => {
      const next = new Set(prev);
      if (next.has(symptom)) next.delete(symptom);
      else next.add(symptom);
      return next;
    });
  }

  function toggleEvidence(abbreviation: string) {
    setExpandedEvidence((prev) => {
      const next = new Set(prev);
      if (next.has(abbreviation)) next.delete(abbreviation);
      else next.add(abbreviation);
      return next;
    });
  }

  async function handleRecalculate() {
    setCommittedExclusions(new Set(deselectedSymptoms));
    await runSearch(symptoms, [...deselectedSymptoms], true);
  }

  function resetSymptoms() {
    setDeselectedSymptoms(new Set());
    setCommittedExclusions(new Set());
    runSearch(symptoms, [], true);
  }

  async function handleCreateProfile() {
    if (!newProfileName.trim()) return;
    setCreatingProfile(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProfileName.trim() }),
      });
      if (res.ok) {
        const { profile } = await res.json();
        setProfiles((prev) => [...prev, profile].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedProfile(profile.id);
        setNewProfileName("");
        setAddingProfile(false);
      }
    } finally {
      setCreatingProfile(false);
    }
  }

  async function disableSource(source: Source) {
    setTogglingSource(source.id);
    try {
      await fetch("/api/sources", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: source.id, enabled: false }),
      });
      setActiveSources((prev) => prev.filter((s) => s.id !== source.id));
      await runSearch(symptoms, [...deselectedSymptoms], true);
    } finally {
      setTogglingSource(null);
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

  const allSymptoms = [...new Set(matches.flatMap((m) => m.keySymptoms ?? []))];
  const selectedProfileName = profiles.find((p) => p.id === selectedProfile)?.name;
  const hasResults = matches.length > 0;
  const pillsDirty =
    deselectedSymptoms.size !== committedExclusions.size ||
    [...deselectedSymptoms].some((s) => !committedExclusions.has(s));

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xl font-semibold text-green-800">RemedyHome</Link>
          <span className="text-stone-300">/</span>
          <span className="text-stone-600 font-medium">Find a Remedy</span>
        </div>
        <Link href="/settings" className="text-sm text-stone-400 hover:text-stone-600">Manage sources</Link>
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
            {loading ? "Searching the repertory…" : "Find matching remedies"}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {loading && <ArnicaLoader message={progressMessage} />}

        {hasResults && (
          <div className={`space-y-5 transition-opacity ${refining ? "opacity-50 pointer-events-none" : ""}`}>
            {/* Profile selector */}
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              {addingProfile ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-green-800 font-medium">New profile name:</span>
                  <input
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateProfile()}
                    placeholder="e.g. Emma"
                    autoFocus
                    className="text-sm border border-green-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 w-36"
                  />
                  <button
                    onClick={handleCreateProfile}
                    disabled={!newProfileName.trim() || creatingProfile}
                    className="text-sm bg-green-700 text-white px-3 py-1 rounded-lg hover:bg-green-800 disabled:opacity-50 font-medium"
                  >
                    {creatingProfile ? "Creating…" : "Add"}
                  </button>
                  <button onClick={() => { setAddingProfile(false); setNewProfileName(""); }} className="text-sm text-stone-400 hover:text-stone-600">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-green-800 font-medium">Add remedies to testing list for:</span>
                  {profiles.length > 0 && (
                    <select
                      value={selectedProfile}
                      onChange={(e) => setSelectedProfile(e.target.value)}
                      className="text-sm border border-green-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}
                  <button onClick={() => setAddingProfile(true)} className="text-sm text-green-700 hover:text-green-900 font-medium">
                    + New profile
                  </button>
                </div>
              )}
            </div>

            {/* Sources dropdown */}
            {activeSources.length > 0 && (
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <button
                  onClick={() => setSourcesOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  <span className="font-medium">
                    Active sources <span className="text-stone-400 font-normal">({activeSources.length})</span>
                  </span>
                  <span className="text-stone-400 text-xs">{sourcesOpen ? "▲" : "▼"}</span>
                </button>
                {sourcesOpen && (
                  <div className="px-4 pb-4 border-t border-stone-100">
                    <p className="text-xs text-stone-400 mt-3 mb-2">
                      Tap a source to remove it from recommendations — this will be saved to your profile.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {activeSources.map((source) => (
                        <button
                          key={source.id}
                          onClick={() => disableSource(source)}
                          disabled={togglingSource === source.id}
                          className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full hover:bg-red-50 hover:text-red-600 hover:line-through transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          📖 {source.name}
                          <span className="text-stone-300 hover:text-red-400">×</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-stone-400 mt-3">
                      <Link href="/settings" className="underline hover:text-stone-600">Manage all sources in Settings →</Link>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Symptom filter pills */}
            {allSymptoms.length > 0 && (
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <p className="text-xs font-medium text-stone-500 mb-2">
                  Deselect symptoms to remove them from the match calculation:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {allSymptoms.map((s) => {
                    const active = !deselectedSymptoms.has(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggleSymptom(s)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer select-none ${
                          active
                            ? "bg-green-100 text-green-800 border-green-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                            : "bg-stone-100 text-stone-400 border-stone-200 line-through opacity-60 hover:opacity-80"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
                {(pillsDirty || deselectedSymptoms.size > 0) && (
                  <div className="flex items-center gap-3 mt-3">
                    {pillsDirty && (
                      <button
                        onClick={handleRecalculate}
                        disabled={refining}
                        className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 disabled:opacity-50 font-medium"
                      >
                        {refining ? "Recalculating…" : "Recalculate matches"}
                      </button>
                    )}
                    {deselectedSymptoms.size > 0 && (
                      <button onClick={resetSymptoms} className="text-xs text-stone-400 hover:text-stone-600">
                        Reset all
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {refining && <p className="text-sm text-stone-400 text-center py-2">Recalculating…</p>}

            <h3 className="text-lg font-semibold">Top matches</h3>

            {matches.map((match, i) => {
              const evidenceOpen = expandedEvidence.has(match.abbreviation);
              const hasEvidence = (match.rubricEvidence?.length ?? 0) > 0;
              return (
                <div key={match.abbreviation} className="bg-white rounded-xl border border-stone-200 p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-400">#{i + 1}</span>
                        <h4 className="font-semibold text-lg">{match.name}</h4>
                        <span className="text-stone-400 text-sm">({match.abbreviation})</span>
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Suggested potency: <span className="font-medium text-stone-600">{match.suggestedPotency}</span>
                      </p>
                    </div>
                    <MatchBadge score={match.matchScore} />
                  </div>

                  {/* Explanation */}
                  <p className="text-sm text-stone-700 mb-3">{match.whyItMatches}</p>

                  {/* Key symptom pills */}
                  {match.keySymptoms?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {match.keySymptoms.map((s) => {
                        const active = !deselectedSymptoms.has(s);
                        return (
                          <button
                            key={s}
                            onClick={() => toggleSymptom(s)}
                            className={`text-xs px-2 py-0.5 rounded-full border transition-all cursor-pointer select-none ${
                              active
                                ? "bg-green-100 text-green-800 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                : "bg-stone-100 text-stone-400 border-stone-200 line-through opacity-60"
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Kent rubric evidence */}
                  {hasEvidence && (
                    <div className="mb-3">
                      <button
                        onClick={() => toggleEvidence(match.abbreviation)}
                        className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
                      >
                        <span className="font-mono text-stone-300">📋</span>
                        <span>
                          Kent rubric evidence
                          {match.kentScore !== undefined && (
                            <span className="ml-1 text-stone-300">
                              · score {match.kentScore} across {match.queriesMatched} rubric{match.queriesMatched !== 1 ? "s" : ""}
                            </span>
                          )}
                        </span>
                        <span className="text-stone-300">{evidenceOpen ? "▲" : "▼"}</span>
                      </button>

                      {evidenceOpen && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {match.rubricEvidence!.map((ev, ei) => (
                            <RubricPill key={ei} path={ev.path} grade={ev.grade} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Source tags */}
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

                  {/* Actions */}
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
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ArnicaLoader({ message }: { message: string }) {
  const PETALS = 13;
  return (
    <div className="text-center py-12">
      <style>{`
        @keyframes arnica-bloom {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes arnica-petal {
          0%, 100% { opacity: 0.65; }
          50% { opacity: 1; }
        }
        .arnica-group {
          animation: arnica-bloom 2.8s ease-in-out infinite;
          transform-origin: 40px 40px;
        }
        .arnica-petal {
          animation: arnica-petal 2s ease-in-out infinite;
        }
      `}</style>
      <svg width="90" height="90" viewBox="0 0 80 80" className="mx-auto mb-5">
        <g className="arnica-group">
          {Array.from({ length: PETALS }).map((_, i) => (
            <g key={i} transform={`rotate(${(i * 360) / PETALS}, 40, 40)`}>
              <ellipse
                className="arnica-petal"
                cx="40"
                cy="19"
                rx="4.5"
                ry="12"
                fill="#FBBF24"
                style={{ animationDelay: `${((i * 2) / PETALS).toFixed(2)}s` }}
              />
            </g>
          ))}
          <circle cx="40" cy="40" r="12" fill="#D97706" />
          <circle cx="40" cy="40" r="8"  fill="#FBBF24" />
          <circle cx="37" cy="38" r="1.5" fill="#D97706" opacity="0.5" />
          <circle cx="42" cy="37" r="1.5" fill="#D97706" opacity="0.5" />
          <circle cx="40" cy="42" r="1.5" fill="#D97706" opacity="0.5" />
        </g>
      </svg>
      <p className="text-stone-600 font-medium text-sm">
        {message || "Searching Kent\u2019s Repertory\u2026"}
      </p>
    </div>
  );
}

function MatchBadge({ score }: { score: number }) {
  const color =
    score >= 85 ? "bg-green-100 text-green-700" :
    score >= 70 ? "bg-yellow-100 text-yellow-700" :
    "bg-stone-100 text-stone-500";
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>
      {score}% match
    </span>
  );
}

function RubricPill({ path, grade }: { path: string; grade: number }) {
  // Strip page references like "FEVER p. 1280 >" to keep pills readable
  const label = path.replace(/\s*[A-Z]+\s+p\.\s*\d+\s*>?\s*/g, "").trim();
  const gradeStyle =
    grade === 3 ? "bg-green-50 text-green-700 border-green-200" :
    grade === 2 ? "bg-amber-50 text-amber-700 border-amber-200" :
    "bg-stone-50 text-stone-500 border-stone-200";
  const gradeDot =
    grade === 3 ? "●●●" :
    grade === 2 ? "●●○" :
    "●○○";
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${gradeStyle}`}
      title={`Kent grade ${grade}: ${path}`}
    >
      <span className="font-mono text-[9px] tracking-tighter opacity-60">{gradeDot}</span>
      {label}
    </span>
  );
}
