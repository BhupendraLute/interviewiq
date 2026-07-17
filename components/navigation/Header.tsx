"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            InterviewIQ
          </Link>
          <nav className="flex items-center space-x-4">
            <Link href="/interview/create">
              <Button variant="default">New Interview</Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}