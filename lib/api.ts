export type InterviewMode = "coding" | "system-design" | "behavioral";

export type InterviewConfig = {
  role: string;
  difficulty: "easy" | "medium" | "hard";
  mode: InterviewMode;
};

export type StartSessionResult = {
  sessionId: string;
  question: {
    title: string;
    prompt: string;
    difficulty: string;
  };
};

export type RespondResult = {
  reply: string;
  provider: "openai" | "openrouter" | "opencodezen";
  flagged: { topic: string; note: string }[];
};

export type FeedbackReport = {
  correctnessNotes: string;
  complexityNotes: string;
  communicationNotes: string;
  quotedMoments: { speaker: string; quote: string; why: string }[];
  nextSteps: string;
};

export type FinishSessionResult = {
  report: FeedbackReport;
  provider: "openai" | "openrouter" | "opencodezen";
};

export async function createSession(
  config: InterviewConfig
): Promise<StartSessionResult> {
  const res = await fetch("/api/session/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to create session (${res.status})`);
  }
  return res.json();
}

export async function respond(
  sessionId: string,
  message: string,
  mode?: InterviewMode,
  signal?: AbortSignal
): Promise<RespondResult> {
  const res = await fetch(`/api/session/${sessionId}/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, mode }),
    signal,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to respond (${res.status})`);
  }
  return res.json();
}

export async function getReport(
  sessionId: string
): Promise<FinishSessionResult> {
  const res = await fetch(`/api/session/${sessionId}/finish`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to get report (${res.status})`);
  }
  return res.json();
}

export async function finishSession(
  sessionId: string
): Promise<FinishSessionResult> {
  const res = await fetch(`/api/session/${sessionId}/finish`, {
    method: "POST",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to finish session (${res.status})`);
  }
  return res.json();
}


