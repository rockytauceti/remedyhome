import type { Metadata, Viewport } from "next";
import { Lora, DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RemedyHome",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#325E4D",
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
          <Script id="gtm-init" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-5GLB2RHV');`}</Script>
          <noscript>
            <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5GLB2RHV" height="0" width="0" style={{ display: "none", visibility: "hidden" }} />
          </noscript>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
