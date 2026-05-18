import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — botanical image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-green-800 flex-col justify-end">
        <Image
          src="/botanical-auth.png"
          alt="Sunlit herbs on a windowsill"
          fill
          className="object-cover opacity-90"
          priority
        />
        {/* Overlay gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-green-900/70 via-transparent to-transparent" />
        <div className="relative z-10 p-10 text-white">
          <Link href="/" className="block mb-3" style={{ fontFamily: "var(--font-lora), Georgia, serif" }}>
            <span className="text-2xl font-semibold">RemedyHome</span>
          </Link>
          <p className="text-green-100 text-sm leading-relaxed max-w-xs">
            Your family&apos;s personal homeopathy record — remedies that work, tracked and remembered.
          </p>
        </div>
      </div>

      {/* Right panel — sign in form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-stone-50 px-6 py-12">
        {/* Mobile logo */}
        <Link href="/" className="mb-8 lg:hidden" style={{ fontFamily: "var(--font-lora), Georgia, serif" }}>
          <span className="text-2xl font-semibold text-green-800">RemedyHome</span>
        </Link>
        <SignIn />
      </div>
    </div>
  );
}
