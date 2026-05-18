import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

const cards = [
  {
    href: "/profiles",
    image: "/botanical-profiles.png",
    emoji: "👨‍👩‍👧‍👦",
    title: "Family Profiles",
    desc: "Manage your family members and their remedy history",
  },
  {
    href: "/research",
    image: "/botanical-research.png",
    emoji: "🔍",
    title: "Find a Remedy",
    desc: "Search by symptom across your selected repertories",
  },
  {
    href: "/journal",
    image: "/botanical-journal.png",
    emoji: "📓",
    title: "Remedy Journal",
    desc: "Review what you've tried and what worked",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-semibold text-green-800" style={{ fontFamily: "var(--font-lora), Georgia, serif" }}>
          RemedyHome
        </span>
        <UserButton />
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl mb-1">Welcome back</h2>
        <p className="text-stone-500 mb-10">What would you like to do today?</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-2xl border border-stone-200 bg-white overflow-hidden hover:border-green-400 hover:shadow-sm transition-all group"
            >
              {/* Card image */}
              <div className="relative h-36 bg-green-50 overflow-hidden">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Fallback */}
                <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20 select-none pointer-events-none">
                  {card.emoji}
                </div>
              </div>
              {/* Card text */}
              <div className="p-5">
                <h3 className="font-semibold mb-1 text-green-900">{card.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{card.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <Link href="/settings" className="text-sm text-stone-400 hover:text-stone-600">
            Research source settings →
          </Link>
        </div>
      </main>
    </div>
  );
}
