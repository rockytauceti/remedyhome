import type { Metadata } from "next";
import { Lora, DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
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
      <html lang="en" className={`${lora.variable} ${dmSans.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
