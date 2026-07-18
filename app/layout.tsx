import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/navigation/Header";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "InterviewIQ — Free AI mock interviews",
  description: "Free AI-powered mock technical interviews. No login required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full antialiased", "font-sans", geist.variable)} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
