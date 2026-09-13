import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HeaderBanner from "@/components/HeaderBanner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Selected Jobs — A True Job Portal | selectedjobs.in",
  description:
    "SelectedJobs.in provides online applications, notifications, exam alerts, and verified job vacancies across State, Central Govt, Banking, Defence, and Tech.",
  keywords: [
    "SelectedJobs",
    "selectedjobs.in",
    "sarkari jobs",
    "state jobs",
    "govt jobs",
    "tech jobs india",
    "bank jobs",
    "railway recruitment",
    "admit card pdf",
  ],
  authors: [{ name: "SelectedJobs.in Team" }],
  metadataBase: new URL("https://selectedjobs.in"),
  openGraph: {
    title: "Selected Jobs — A True Job Portal",
    description: "Verified openings, exam notifications, and application alerts on selectedjobs.in",
    url: "https://selectedjobs.in",
    siteName: "SelectedJobs.in",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-zinc-900">
        <HeaderBanner />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
