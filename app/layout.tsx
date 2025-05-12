import { Navbar } from "@/components/layout/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SupabaseProvider } from "@/lib/supabase/supabase-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type React from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PictionAi Game",
  description: "A real-time multiplayer drawing and guessing game",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SupabaseProvider>
            <Navbar />
            <div className="bg-linear-to-br from-background dark:from-background to-background/80 dark:to-background/50 min-h-screen">
              {children}
              <Toaster richColors />
            </div>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
