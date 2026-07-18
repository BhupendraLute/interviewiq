"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getReport,
  type FeedbackReport,
} from "@/lib/api";
import {
  CheckCircleIcon,
  LightbulbIcon,
  MessageSquareIcon,
  TargetIcon,
  ArrowRightIcon,
  QuoteIcon,
  TrendingUpIcon,
  RefreshCwIcon,
} from "lucide-react";
import { Shimmer } from "@/components/ai-elements/shimmer";

const RadarChart = dynamic(
  () => import("@/components/charts/RadarChart"),
  { ssr: false, loading: () => <div className="h-64 shimmer" /> }
);

const BarChart = dynamic(
  () => import("@/components/charts/BarChart"),
  { ssr: false, loading: () => <div className="h-64 shimmer" /> }
);

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-500";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function scoreRing(score: number): string {
  if (score >= 80) return "stroke-emerald-500";
  if (score >= 60) return "stroke-amber-500";
  return "stroke-red-500";
}

function ScoreGauge({ score, label, size = "lg" }: { score: number; label: string; size?: "sm" | "lg" }) {
  const r = size === "lg" ? 72 : 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-flex items-center justify-center">
        <svg width={r * 2 + 16} height={r * 2 + 16} className="-rotate-90">
          <circle
            cx={r + 8}
            cy={r + 8}
            r={r}
            fill="none"
            stroke="oklch(0.922 0 0)"
            strokeWidth={size === "lg" ? 8 : 6}
          />
          <circle
            cx={r + 8}
            cy={r + 8}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={size === "lg" ? 8 : 6}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className={`transition-all duration-1000 ease-out ${scoreRing(score)}`}
          />
        </svg>
        <span className={`absolute font-bold ${size === "lg" ? "text-4xl" : "text-lg"} ${scoreColor(score)}`}>
          {score}
        </span>
      </div>
      <span className={`font-medium text-muted-foreground ${size === "lg" ? "text-sm" : "text-xs"}`}>
        {label}
      </span>
    </div>
  );
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className={`font-semibold tabular-nums ${scoreColor(score)}`}>{score}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${scoreBg(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { id } = await params;
        const result = await getReport(id);
        setReport(result.report);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [params]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Shimmer>Generating your feedback report...</Shimmer>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-destructive">{error || "Report not found"}</p>
        <Button onClick={() => router.push("/interview/create")}>
          Start New Interview
        </Button>
      </main>
    );
  }

  const chartData = {
    correctness: report.correctnessScore ?? 0,
    complexity: report.complexityScore ?? 0,
    communication: report.communicationScore ?? 0,
  };

  const worstDimension =
    Object.entries(chartData).sort(([, a], [, b]) => a - b)[0];

  const dimensionLabel: Record<string, string> = {
    correctness: "Problem Solving",
    complexity: "Complexity Awareness",
    communication: "Communication",
  };

  return (
    <main className="flex-1 px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
            <CheckCircleIcon className="size-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Interview Report
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            AI-powered performance analysis across key evaluation dimensions
          </p>
        </div>

        {/* Overall Score Hero */}
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card to-muted/30 p-8 shadow-sm">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 size-48 rounded-full bg-indigo-500/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 size-48 rounded-full from-violet-500/5 blur-3xl" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
            <div className="order-2 mx-auto md:order-1 md:mx-0 md:justify-self-end">
              <ScoreGauge score={report.overallScore ?? 0} label="Overall Score" size="lg" />
            </div>
            <div className="order-1 md:order-2 mx-auto w-full max-w-xs space-y-4 md:mx-0 md:border-x md:border-dashed md:border-border md:px-8">
              <ScoreBar score={report.correctnessScore ?? 0} label="Problem Solving" />
              <ScoreBar score={report.complexityScore ?? 0} label="Complexity Awareness" />
              <ScoreBar score={report.communicationScore ?? 0} label="Communication" />
            </div>
            <div className="order-3 hidden md:block">
              {worstDimension && (
                <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-4 text-center dark:border-amber-900 dark:bg-amber-950/20">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Focus Area</p>
                  <p className="mt-1 text-sm font-semibold text-amber-800 dark:text-amber-300">
                    {dimensionLabel[worstDimension[0] as keyof typeof dimensionLabel]}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Score: {worstDimension[1]}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Radar Chart */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUpIcon className="size-4 text-indigo-600" />
              <h2 className="font-semibold text-sm">Skill Profile</h2>
            </div>
            <div className="aspect-square max-h-72">
              <RadarChart
                data={[chartData]}
                keys={["correctness", "complexity", "communication"]}
              />
            </div>
          </div>

          {/* Bar Chart */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <RefreshCwIcon className="size-4 text-indigo-600" />
              <h2 className="font-semibold text-sm">Dimension Comparison</h2>
            </div>
            <div className="aspect-square max-h-72">
              <BarChart
                data={[chartData]}
                keys={["correctness", "complexity", "communication"]}
              />
            </div>
          </div>
        </div>

        {/* Detailed Notes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TargetIcon className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm text-muted-foreground">Dimension Analysis</h2>
          </div>
          <div className="space-y-4">
            <section className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
              <div className="p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                    <TargetIcon className="size-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-foreground">Problem Solving</h3>
                    <p className="text-xs text-muted-foreground">Accuracy &amp; completeness</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`text-2xl font-bold tabular-nums ${scoreColor(report.correctnessScore ?? 0)}`}>
                      {report.correctnessScore ?? "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${scoreBg(report.correctnessScore ?? 0)}`}
                    style={{ width: `${report.correctnessScore ?? 0}%` }}
                  />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {report.correctnessNotes}
                </p>
              </div>
            </section>

            <section className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
              <div className="p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
                    <LightbulbIcon className="size-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-foreground">Complexity &amp; Depth</h3>
                    <p className="text-xs text-muted-foreground">Time &amp; space analysis</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`text-2xl font-bold tabular-nums ${scoreColor(report.complexityScore ?? 0)}`}>
                      {report.complexityScore ?? "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${scoreBg(report.complexityScore ?? 0)}`}
                    style={{ width: `${report.complexityScore ?? 0}%` }}
                  />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {report.complexityNotes}
                </p>
              </div>
            </section>

            <section className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-400 to-violet-600" />
              <div className="p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950 dark:to-violet-900">
                    <MessageSquareIcon className="size-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-foreground">Communication</h3>
                    <p className="text-xs text-muted-foreground">Clarity &amp; structure</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`text-2xl font-bold tabular-nums ${scoreColor(report.communicationScore ?? 0)}`}>
                      {report.communicationScore ?? "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${scoreBg(report.communicationScore ?? 0)}`}
                    style={{ width: `${report.communicationScore ?? 0}%` }}
                  />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {report.communicationNotes}
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Key Moments */}
        {report.quotedMoments?.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <QuoteIcon className="size-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm text-muted-foreground">Key Moments</h2>
            </div>
            <div className="relative space-y-4 before:absolute before:left-[19px] before:top-2 before:h-[calc(100%-24px)] before:w-px before:bg-border">
              {report.quotedMoments.map((moment, i) => (
                <div key={i} className="relative flex gap-4 pl-2">
                  <div className="relative z-10 mt-1 flex size-10 shrink-0 items-center justify-center rounded-full border bg-background shadow-xs">
                    <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1 rounded-xl border bg-card p-4 shadow-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge
                        variant={moment.speaker === "user" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {moment.speaker === "user" ? "You" : "Interviewer"}
                      </Badge>
                    </div>
                    <blockquote className="border-l-2 border-muted-foreground/30 pl-3 text-sm italic text-muted-foreground">
                      &ldquo;{moment.quote}&rdquo;
                    </blockquote>
                    <p className="mt-2 text-sm text-card-foreground">{moment.why}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Next Steps */}
        <section className="rounded-xl border bg-gradient-to-br from-emerald-50/80 to-card p-6 shadow-sm dark:from-emerald-950/10">
          <div className="mb-3 flex items-center gap-2">
            <ArrowRightIcon className="size-4 text-emerald-600" />
            <h2 className="font-semibold text-sm">Next Steps</h2>
          </div>
          <p className="text-sm text-card-foreground leading-relaxed">
            {report.nextSteps}
          </p>
        </section>

        {/* Actions */}
        <div className="flex justify-center gap-4 pt-4">
          <Button variant="outline" onClick={() => router.push("/interview/create")}>
            New Interview
          </Button>
          <Button onClick={() => router.push("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    </main>
  );
}
