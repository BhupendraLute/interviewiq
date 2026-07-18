"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Brain, ChartBar, Clock, Lightbulb, ShieldCheck, Goal, ArrowRightIcon } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Feedback",
    description: "Get instant, detailed feedback on your responses to improve your skills.",
  },
  {
    icon: ChartBar,
    title: "Performance Analytics",
    description: "Track your progress with detailed reports and visual analytics.",
  },
  {
    icon: Clock,
    title: "Realistic Timers",
    description: "Practice under real interview conditions with timed questions.",
  },
  {
    icon: Lightbulb,
    title: "Question Bank",
    description: "Access a vast library of interview questions across multiple domains.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy Focused",
    description: "Your data is secure and never shared with third parties.",
  },
  {
    icon: Goal,
    title: "Goal Tracking",
    description: "Set goals and track your improvement over time.",
  },
];

const testimonials = [
  {
    quote: "InterviewIQ helped me land my dream job at FAANG! The AI feedback was incredibly detailed and helped me improve my responses.",
    author: "Sarah K., Software Engineer",
  },
  {
    quote: "I was able to practice realistic interview scenarios and get instant feedback. My confidence improved significantly in just a week.",
    author: "James T., Data Scientist",
  },
  {
    quote: "The performance analytics helped me identify my weak areas. I focused on improving them and aced my next interview.",
    author: "Priya M., Product Manager",
  },
];

export default function HomePage() {
  const [year] = useState(() => new Date().getFullYear());

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 lg:min-h-[calc(100vh-3.5rem)] lg:py-0 flex items-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50/60 via-transparent to-transparent dark:from-indigo-950/30" />
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
              Ace Your Next Interview with AI
            </h1>
            <p className="mb-8 mx-auto max-w-lg text-lg text-muted-foreground lg:mx-0 lg:text-xl">
              Practice real-world interview questions, get instant feedback, and improve your skills with our AI-powered platform.
            </p>
            <Link href="/interview/create">
              <Button variant="default" size="lg" className="gap-2">
                Start Free Interview
                <ArrowRightIcon className="size-4" />
              </Button>
            </Link>
          </div>
          <div className="flex justify-center">
            <div className="flex size-64 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 shadow-lg dark:from-indigo-950/50 dark:to-violet-950/50 lg:size-80">
              <Brain className="size-24 text-indigo-600/40 dark:text-indigo-400/30 lg:size-32" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">Why Choose InterviewIQ?</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="border-t border-border px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">What Our Users Say</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <div key={i} className="relative rounded-xl border bg-card p-6 shadow-sm">
                <svg className="mb-3 size-8 text-indigo-200 dark:text-indigo-800" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151C7.563 6.068 6 8.789 6 11h4v10H0z" />
                </svg>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="text-sm font-medium text-foreground">— {t.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-b border-border px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-foreground">Ready to Ace Your Next Interview?</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Join thousands of users who have improved their interview skills with InterviewIQ.
          </p>
          <Link href="/interview/create">
            <Button variant="default" size="lg" className="gap-2">
              Start Free Interview
              <ArrowRightIcon className="size-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50 px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 text-xl font-bold text-foreground">InterviewIQ</h3>
              <p className="text-sm text-muted-foreground">
                Your AI-powered interview preparation partner.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/interview/create" className="transition-colors hover:text-foreground">New Interview</Link></li>
                <li><span className="cursor-default">Features</span></li>
                <li><span className="cursor-default">Pricing</span></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="cursor-default">Blog</span></li>
                <li><span className="cursor-default">Guides</span></li>
                <li><span className="cursor-default">FAQ</span></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="cursor-default">Privacy Policy</span></li>
                <li><span className="cursor-default">Terms of Service</span></li>
                <li><span className="cursor-default">Cookie Policy</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {year} InterviewIQ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
