import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto w-full">
        <span className="text-xl font-semibold text-green-800">RemedyHome</span>
        <div className="flex gap-3">
          <Link
            href="/sign-in"
            className="px-4 py-2 text-sm font-medium text-stone-700 hover:text-stone-900"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="px-4 py-2 text-sm font-medium bg-green-700 text-white rounded-lg hover:bg-green-800"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-stone-900 max-w-2xl leading-tight">
          Remember what works for your family
        </h1>
        <p className="mt-4 text-lg text-stone-500 max-w-xl">
          Research homeopathic remedies, track what you&apos;ve tried, and build a personal history for each family member — so you never start from scratch.
        </p>
        <Link
          href="/sign-up"
          className="mt-8 px-6 py-3 bg-green-700 text-white font-medium rounded-lg hover:bg-green-800 text-base"
        >
          Start for free
        </Link>
        <p className="mt-3 text-sm text-stone-400">Free for 1 profile. No credit card required.</p>
      </main>
    </div>
  );
}
