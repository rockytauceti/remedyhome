import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RemedyHome",
  description: "Family homeopathy remedy tracker and research tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
