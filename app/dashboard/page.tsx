import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function DashboardPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-green-800">RemedyHome</h1>
        <UserButton />
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold mb-2">Welcome back</h2>
        <p className="text-stone-500 mb-10">What would you like to do today?</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/profiles"
            className="rounded-xl border border-stone-200 bg-white p-6 hover:border-green-400 hover:shadow-sm transition-all"
          >
            <div className="text-2xl mb-2">👨‍👩‍👧‍👦</div>
            <h3 className="font-semibold mb-1">Family Profiles</h3>
            <p className="text-sm text-stone-500">Manage your family members and their remedy history</p>
          </Link>

          <Link
            href="/research"
            className="rounded-xl border border-stone-200 bg-white p-6 hover:border-green-400 hover:shadow-sm transition-all"
          >
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="font-semibold mb-1">Find a Remedy</h3>
            <p className="text-sm text-stone-500">Search by symptom across your selected repertories</p>
          </Link>

          <Link
            href="/journal"
            className="rounded-xl border border-stone-200 bg-white p-6 hover:border-green-400 hover:shadow-sm transition-all"
          >
            <div className="text-2xl mb-2">📓</div>
            <h3 className="font-semibold mb-1">Remedy Journal</h3>
            <p className="text-sm text-stone-500">Review what you&apos;ve tried and what worked</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
