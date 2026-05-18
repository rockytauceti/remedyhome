"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OUTCOMES = [
  { value: "WORKED", label: "Worked", color: "bg-green-100 text-green-700 hover:bg-green-200" },
  { value: "PARTIAL", label: "Partial", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" },
  { value: "NO_EFFECT", label: "No effect", color: "bg-stone-100 text-stone-600 hover:bg-stone-200" },
  { value: "WRONG_REMEDY", label: "Wrong remedy", color: "bg-red-100 text-red-600 hover:bg-red-200" },
];

export function OutcomeButtons({ entryId }: { entryId: string }) {
  const [saving, setSaving] = useState<string | null>(null);
  const router = useRouter();

  async function handleOutcome(outcome: string) {
    setSaving(outcome);
    await fetch("/api/outcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId, outcome }),
    });
    router.refresh();
    setSaving(null);
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <span className="text-xs text-stone-400 self-center">Mark outcome:</span>
      {OUTCOMES.map((o) => (
        <button
          key={o.value}
          onClick={() => handleOutcome(o.value)}
          disabled={saving !== null}
          className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${o.color} disabled:opacity-50`}
        >
          {saving === o.value ? "Saving…" : o.label}
        </button>
      ))}
    </div>
  );
}
