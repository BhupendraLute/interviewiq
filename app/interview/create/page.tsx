"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createSession, type InterviewMode } from "@/lib/api";
import { BotIcon, SparklesIcon } from "lucide-react";

export default function CreateInterviewPage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [mode, setMode] = useState<InterviewMode>("coding");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim()) {
      setError("Job role is required");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const { sessionId, question } = await createSession({
        role: role.trim(),
        difficulty: difficulty as "easy" | "medium" | "hard",
        mode,
      });
      sessionStorage.setItem(
        `iq_session_${sessionId}`,
        JSON.stringify({
          messages: [{ id: crypto.randomUUID(), role: "assistant", content: question.prompt }],
          mode,
          flagged: [],
          editorCode: "",
          editorLanguage: "javascript",
        })
      );
      router.push(`/interview/${sessionId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start interview");
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <BotIcon className="size-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Mock Interview</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Start a conversational AI-powered interview. The agent will ask questions, probe your answers, and give you a detailed report.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium">Job Role</label>
            <Input
              id="role"
              placeholder="e.g. SDE-2 Backend, Frontend Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="difficulty" className="text-sm font-medium">Difficulty</label>
            <Select value={difficulty} onValueChange={(v) => v && setDifficulty(v)}>
              <SelectTrigger id="difficulty" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="mode" className="text-sm font-medium">Interview Mode</label>
            <Select value={mode} onValueChange={(v) => v && setMode(v as InterviewMode)}>
              <SelectTrigger id="mode" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coding">Coding / Technical</SelectItem>
                <SelectItem value="system-design">System Design</SelectItem>
                <SelectItem value="behavioral">Behavioral</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Starting interview…
              </>
            ) : (
              <>
                <SparklesIcon className="size-4" />
                Start Interview
              </>
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}
