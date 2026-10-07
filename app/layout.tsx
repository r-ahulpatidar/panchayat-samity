import type { Metadata, Viewport } from "next";
import { Noto_Sans_Devanagari } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { common } from "@/content/hi/common";
import { home } from "@/content/hi/home";
import { areaLine, site } from "@/content/hi/site";
import "./globals.css";

const deva = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-deva",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.candidateName} — ${home.metaTitle} | ${site.panchayatName}`,
    template: `%s | ${site.candidateName} — ${site.panchayatName}`,
  },
  description: `${home.metaDescription} ${areaLine}`,
  openGraph: {
    type: "website",
    locale: "hi_IN",
    siteName: `${site.candidateName} — ${home.metaTitle}`,
    images: [{ url: site.photo, alt: site.candidateName }],
  },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  themeColor: "#c2410c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hi" className={deva.variable}>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3"
        >
          {common.skipToContent}
        </a>
        <Header />
        <main id="main" className="mx-auto max-w-5xl px-4 pt-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
