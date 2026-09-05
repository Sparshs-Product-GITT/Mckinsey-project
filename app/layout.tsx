import type { Metadata } from "next";
import { Playfair_Display, Lato, DM_Mono } from "next/font/google";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const lato = Lato({
  variable: "--font-body",
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-mono",
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CaseCoach AI — McKinsey-Style Case Interview Solver",
  description:
    "Upload a case brief PDF and receive a structured, consultant-grade case solution with driver trees, root cause analysis, and strategic recommendations — powered by AI.",
  keywords: [
    "case interview",
    "McKinsey",
    "consulting",
    "case study",
    "business strategy",
    "AI",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${lato.variable} ${dmMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0f1e] text-white font-body">
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
