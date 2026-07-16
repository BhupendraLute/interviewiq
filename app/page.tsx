"use client";

import { useState } from "react";

type View = "setup" | "interview" | "feedback";

type TranscriptItem = { role: "ai" | "user"; content: string };

type FeedbackReport = {
  correctnessNotes: string;
  complexityNotes: string;
  communicationNotes: string;
  quotedMoments: { speaker: "user" | "ai"; quote: string; why: string }[];
  nextSteps: string;
};

const ROLES = ["SDE-1 Frontend", "SDE-2 Backend", "SDE-2 Full Stack"];
const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export default function Home() {
  const [view, setView] = useState<View>("setup");
  const [role, setRole] = useState(ROLES[1]);
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("medium");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<FeedbackReport | null>(null);

  async function startInterview() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, difficulty }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to start interview");

      setSessionId(data.sessionId);
      setTranscript([{ role: "ai", content: data.question.prompt }]);
      setView("interview");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer(text: string) {
    if (!sessionId || !text.trim()) return;
    setLoading(true);
    setError(null);
    setTranscript((t) => [...t, { role: "user", content: text }]);
    setAnswer("");
    try {
      const res = await fetch(`/api/session/${sessionId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to get a response");
      setTranscript((t) => [...t, { role: "ai", content: data.reply }]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function finishInterview() {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/session/${sessionId}/finish`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to generate feedback");
      setReport(data.report);
      setView("feedback");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function startOver() {
    setSessionId(null);
    setTranscript([]);
    setAnswer("");
    setReport(null);
    setError(null);
    setView("setup");
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">InterviewIQ</h1>
          <p className="text-slate-500 mt-1">Free AI mock interviews. No signup.</p>
        </header>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {view === "setup" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={startInterview}
                disabled={loading}
                className="w-full rounded-lg bg-slate-900 text-white py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? "Starting..." : "Start interview"}
              </button>
            </div>
          </div>
        )}

        {view === "interview" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
              {transcript.map((item, i) => (
                <div
                  key={i}
                  className={`rounded-lg px-4 py-3 text-sm ${
                    item.role === "ai"
                      ? "bg-slate-100 text-slate-800"
                      : "bg-slate-900 text-white ml-8"
                  }`}
                >
                  {item.content}
                </div>
              ))}
              {loading && <div className="text-sm text-slate-400">Thinking...</div>}
            </div>

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your approach or code here..."
              rows={5}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
            />

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => submitAnswer(answer)}
                disabled={loading || !answer.trim()}
                className="flex-1 rounded-lg bg-slate-900 text-white py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                Submit
              </button>
              <button
                onClick={() => submitAnswer("I'm stuck, can you give me a hint?")}
                disabled={loading}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                I&apos;m stuck
              </button>
            </div>

            {transcript.length >= 3 && (
              <button
                onClick={finishInterview}
                disabled={loading}
                className="w-full mt-3 rounded-lg border border-slate-900 text-slate-900 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                Finish interview
              </button>
            )}
          </div>
        )}

        {view === "feedback" && report && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <section>
              <h2 className="text-sm font-semibold text-slate-900 mb-1">Correctness</h2>
              <p className="text-sm text-slate-600">{report.correctnessNotes}</p>
            </section>
            <section>
              <h2 className="text-sm font-semibold text-slate-900 mb-1">Complexity awareness</h2>
              <p className="text-sm text-slate-600">{report.complexityNotes}</p>
            </section>
            <section>
              <h2 className="text-sm font-semibold text-slate-900 mb-1">Communication</h2>
              <p className="text-sm text-slate-600">{report.communicationNotes}</p>
            </section>

            {report.quotedMoments?.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-900 mb-2">Key moments</h2>
                <div className="space-y-2">
                  {report.quotedMoments.map((m, i) => (
                    <blockquote
                      key={i}
                      className="border-l-2 border-slate-300 pl-3 text-sm text-slate-700 italic"
                    >
                      &ldquo;{m.quote}&rdquo;
                      <div className="not-italic text-xs text-slate-400 mt-1">{m.why}</div>
                    </blockquote>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-sm font-semibold text-slate-900 mb-1">Next steps</h2>
              <p className="text-sm text-slate-600">{report.nextSteps}</p>
            </section>

            <button
              onClick={startOver}
              className="w-full rounded-lg bg-slate-900 text-white py-2.5 text-sm font-medium hover:bg-slate-800"
            >
              Start a new interview
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
