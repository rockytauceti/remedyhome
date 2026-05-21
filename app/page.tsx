import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto w-full">
        <span className="text-xl font-semibold text-green-800" style={{ fontFamily: "var(--font-lora), Georgia, serif" }}>
          RemedyHome
        </span>
        <div className="flex gap-3">
          <Link
            href="/sign-in"
            className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="px-4 py-2 text-sm font-medium bg-green-700 text-white rounded-full hover:bg-green-800 transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 flex flex-col lg:flex-row items-center gap-12 py-16 lg:py-24">
        {/* Text side */}
        <div className="flex-1 text-left">
          <p className="text-sm font-medium tracking-widest text-green-700 uppercase mb-4">
            Family Remedy Tracker
          </p>
          <h1 className="text-4xl sm:text-5xl leading-tight text-green-800 mb-6">
            Remember what works<br />for your family
          </h1>
          <p className="text-lg text-stone-600 max-w-md leading-relaxed mb-8">
            Research homeopathic remedies, track what you&apos;ve tried, and build
            a personal history for each family member — so you never start from scratch.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/sign-up"
              className="px-6 py-3 bg-green-700 text-white font-medium rounded-full hover:bg-green-800 transition-colors text-base text-center"
            >
              Start for free
            </Link>
            <Link
              href="/sign-in"
              className="px-6 py-3 border border-stone-300 text-stone-700 font-medium rounded-full hover:border-stone-400 transition-colors text-base text-center bg-white"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-sm text-stone-400">Free for 1 profile. No credit card required.</p>
        </div>

        {/* Image side */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden bg-green-50 border border-stone-200 flex items-center justify-center">
            {/* Gemini-generated botanical image goes here */}
            <Image
              src="/botanical-hero.png"
              alt="Botanical herbs illustration"
              fill
              className="object-cover"
              priority
            />
            {/* Fallback shown until image is generated */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-green-700 opacity-30 pointer-events-none select-none">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M40 10C40 10 20 25 20 45C20 55.5 29.5 65 40 65C50.5 65 60 55.5 60 45C60 25 40 10 40 10Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M40 65V75" stroke="currentColor" strokeWidth="2"/>
                <path d="M28 50C22 44 18 35 22 25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M52 50C58 44 62 35 58 25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p className="mt-3 text-sm font-medium">Botanical image</p>
            </div>
          </div>
        </div>
      </main>

      {/* Feature strip */}
      <section className="border-t border-stone-200 bg-white py-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { title: "AI-powered research", desc: "Match symptoms to remedies across trusted materia medica sources" },
            { title: "Family profiles", desc: "Track each person's history — what worked, what didn't, what you're testing" },
            { title: "Your own repertory", desc: "Build a private record your family can rely on for years to come" },
          ].map((f) => (
            <div key={f.title}>
              <h3 className="text-base font-semibold text-green-800 mb-2">{f.title}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Human story section */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 relative rounded-3xl overflow-hidden aspect-[3/2] w-full max-w-lg">
            <Image
              src="/mom-child-remedies.jpg"
              alt="Mother and child exploring homeopathic remedies together"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium tracking-widest text-green-700 uppercase mb-4">Built for families</p>
            <h2 className="text-3xl leading-snug text-green-800 mb-5">
              The knowledge you build<br />stays with your family
            </h2>
            <p className="text-stone-600 leading-relaxed mb-5">
              Every family has its own patterns — the remedy that calmed a fever, the one that didn&apos;t work for teething,
              the combination that finally helped with sleep. RemedyHome keeps all of it in one place,
              so the next time symptoms arise, you&apos;re not starting from scratch.
            </p>
            <Link
              href="/sign-up"
              className="inline-block px-6 py-3 bg-green-700 text-white font-medium rounded-full hover:bg-green-800 transition-colors text-sm"
            >
              Start building your family&apos;s record →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
