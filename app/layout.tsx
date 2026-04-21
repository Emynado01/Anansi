import type { Metadata } from "next";
import "./globals.css";

import Header from "@/components/Header";
import MobileBottomNav from "@/components/MobileBottomNav";
import ThemeProvider from "@/components/ThemeProvider";
import AnimatedBackground from "@/components/AnimatedBackground";
import { cn } from "@/lib/utils";

import { DM_Sans } from "next/font/google";

const fontSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Anansi — Livres audio en streaming",
  description: "Écoutez des livres audio Anansi en streaming depuis une bibliothèque connectée à S3.",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={cn(
          "relative min-h-screen bg-zinc-50 text-zinc-950 antialiased transition-colors dark:bg-black dark:text-zinc-100",
          fontSans.variable,
          "font-sans",
        )}
      >
        <ThemeProvider>
          <AnimatedBackground />
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:pt-10">
              {children}
            </main>
            <MobileBottomNav />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
