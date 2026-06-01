"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home" },
  { href: "/profiles", label: "Family Profiles", plans: ["FREE", "FAMILY"] },
  { href: "/clients", label: "Clients", plans: ["PRACTITIONER"] },
  { href: "/research", label: "Find a Remedy" },
  { href: "/journal", label: "Remedy Journal" },
  { href: "/settings", label: "Settings" },
];

export default function NavMenu({
  section,
  plan,
}: {
  section?: string;
  plan: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.plans || item.plans.includes(plan)
  );

  return (
    <header className="border-b border-stone-200 bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors"
            aria-label="Navigation menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect x="2" y="4" width="16" height="2" rx="1" />
              <rect x="2" y="9" width="16" height="2" rx="1" />
              <rect x="2" y="14" width="16" height="2" rx="1" />
            </svg>
          </button>

          {open && (
            <div className="absolute left-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-stone-200 py-1 z-50">
              {visibleItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-2.5 text-sm transition-colors ${
                    pathname === item.href || pathname.startsWith(item.href + "/")
                      ? "bg-green-50 text-green-800 font-medium"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Logo */}
        <Link
          href="/dashboard"
          className="text-lg font-semibold text-green-800 shrink-0"
          style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
        >
          RemedyHome
        </Link>

        {/* Breadcrumb */}
        {section && (
          <>
            <span className="text-stone-300 hidden sm:inline">/</span>
            <span className="text-stone-600 font-medium text-sm truncate hidden sm:inline">
              {section}
            </span>
          </>
        )}
      </div>

      <UserButton />
    </header>
  );
}
