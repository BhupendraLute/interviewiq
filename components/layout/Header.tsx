"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
          InterviewIQ
        </Link>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/interview/create">
            <Button variant="default" size="sm">New Interview</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
