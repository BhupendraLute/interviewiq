"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { respond, finishSession, type InterviewMode } from "@/lib/api";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputProvider,
  usePromptInputController,
  type PromptInputControllerProps,
} from "@/components/ai-elements/prompt-input";
import {
  Suggestions,
  Suggestion,
} from "@/components/ai-elements/suggestion";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSpeech } from "@/lib/useSpeech";
import type { EditorLanguage } from "@/components/interview/CodeEditor";
import { LANGUAGE_LABELS } from "@/components/interview/CodeEditor";
import {
  BookOpenIcon,
  Code2Icon,
  FlagIcon,
  GlobeIcon,
  MessageSquareIcon,
  MicIcon,
  MicOffIcon,
  PanelRightIcon,
  PanelRightCloseIcon,
  PenToolIcon,
  SquareIcon,
  SparklesIcon,
  Volume2Icon,
  VolumeXIcon,
  XIcon,
} from "lucide-react";

const CodeEditor = dynamic(
  () => import("@/components/interview/CodeEditor").then((m) => m.CodeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex size-full items-center justify-center bg-[#282c34] text-sm text-zinc-400">
        <Shimmer>Loading editor…</Shimmer>
      </div>
    ),
  }
);

const Whiteboard = dynamic(
  () => import("@/components/interview/Whiteboard").then((m) => m.Whiteboard),
  { ssr: false }
);

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type PanelTab = "code" | "whiteboard";
type MobileView = "chat" | "code" | "whiteboard";

function ControllerBridge({
  onReady,
}: {
  onReady: (controller: PromptInputControllerProps | null) => void;
}) {
  const controller = usePromptInputController();
  useEffect(() => {
    onReady(controller);
  }, [controller, onReady]);
  return null;
}

function extractCodeBlock(text: string): { code: string; lang: string } | null {
  const match = text.match(/```(\w+)?\n([\s\S]*?)```/);
  if (!match) return null;
  return { code: match[2].replace(/\n$/, ""), lang: (match[1] ?? "").toLowerCase() };
}

function mapLang(lang: string): EditorLanguage {
  switch (lang) {
    case "ts":
    case "typescript":
      return "typescript";
    case "py":
    case "python":
      return "python";
    case "java":
      return "java";
    case "cpp":
    case "c++":
    case "c":
      return "cpp";
    case "sql":
      return "sql";
    case "js":
    case "javascript":
    default:
      return "javascript";
  }
}

const VOICE_LANGS = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "es-ES", label: "Español" },
  { code: "fr-FR", label: "Français" },
  { code: "de-DE", label: "Deutsch" },
  { code: "hi-IN", label: "हिन्दी" },
  { code: "zh-CN", label: "中文" },
  { code: "ja-JP", label: "日本語" },
  { code: "pt-BR", label: "Português" },
  { code: "ar-SA", label: "العربية" },
];

export default function InterviewSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResponding, setIsResponding] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [mode, setMode] = useState<InterviewMode>("coding");
  const [flaggedWeaknesses, setFlaggedWeaknesses] = useState<
    { topic: string; note: string }[]
  >([]);

  const [panelOpen, setPanelOpen] = useState(true);
  const [panelTab, setPanelTab] = useState<PanelTab>("code");
  const [mobileView, setMobileView] = useState<MobileView>("chat");

  const [editorCode, setEditorCode] = useState("");
  const [editorLanguage, setEditorLanguage] = useState<EditorLanguage>("javascript");
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [voiceLang, setVoiceLang] = useState("en-US");
  const [hintDismissed, setHintDismissed] = useState(true);

  const controllerRef = useRef<PromptInputControllerProps | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { sttSupported, ttsSupported, listening, speaking, startListening, stopListening, speak, cancelSpeaking } =
    useSpeech({
      lang: voiceLang,
      onInterimTranscript: (transcript) => {
        controllerRef.current?.textInput.setInput(transcript);
      },
    });

  useEffect(() => {
    const init = async () => {
      const { id } = await params;
      setSessionId(id);
      const stored = sessionStorage.getItem(`iq_session_${id}`);
      let resolvedMode: InterviewMode = "coding";
      if (stored) {
        const data = JSON.parse(stored);
        setMessages(data.messages ?? []);
        resolvedMode = data.mode ?? "coding";
        setMode(resolvedMode);
        setFlaggedWeaknesses(data.flagged ?? []);
        setEditorCode(data.editorCode ?? "");
        setEditorLanguage(data.editorLanguage ?? "javascript");
      }
      // Mode-aware default workspace: whiteboard leads for system design,
      // behavioral interviews keep the chat full-width by default.
      setPanelTab(resolvedMode === "system-design" ? "whiteboard" : "code");
      setPanelOpen(resolvedMode !== "behavioral");
      setHintDismissed(sessionStorage.getItem("iq_hint_seen") === "1");
      setIsLoading(false);
    };
    init();
  }, [params]);

  useEffect(() => {
    if (sessionId && messages.length > 0) {
      sessionStorage.setItem(
        `iq_session_${sessionId}`,
        JSON.stringify({ messages, mode, flagged: flaggedWeaknesses, editorCode, editorLanguage })
      );
    }
  }, [sessionId, messages, mode, flaggedWeaknesses, editorCode, editorLanguage]);

  const openInEditor = useCallback(
    (content: string) => {
      const block = extractCodeBlock(content);
      if (!block) return;
      setEditorCode(block.code);
      setEditorLanguage(mapLang(block.lang));
      setPanelTab("code");
      setPanelOpen(true);
      setMobileView("code");
    },
    []
  );

  const handleSubmit = useCallback(
    async (text: string) => {
      if (!sessionId || !text.trim() || isResponding) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsResponding(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const result = await respond(sessionId, text, mode, controller.signal);

        if (result.flagged?.length > 0) {
          setFlaggedWeaknesses((prev) => [...prev, ...result.flagged]);
        }

        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.reply,
        };
        setMessages((prev) => [...prev, aiMsg]);

        if (autoSpeak) {
          speak(result.reply);
        }
      } catch (err) {
        // Aborted by the user (Stop) — leave the conversation as-is, no error.
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const message =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `**Error:** ${message}`,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        abortRef.current = null;
        setIsResponding(false);
      }
    },
    [sessionId, mode, isResponding, autoSpeak, speak]
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const handleFinish = useCallback(async () => {
    if (!sessionId || isFinishing) return;
    setIsFinishing(true);
    try {
      await finishSession(sessionId);
      sessionStorage.removeItem(`iq_session_${sessionId}`);
      router.push(`/interview/${sessionId}/report`);
    } catch {
      router.push(`/interview/${sessionId}/report`);
    }
  }, [sessionId, router, isFinishing]);

  const handleSuggestion = useCallback(
    (suggestion: string) => handleSubmit(suggestion),
    [handleSubmit]
  );

  const handleMic = useCallback(() => {
    if (listening) {
      stopListening();
      const text = controllerRef.current?.textInput.value?.trim();
      if (text) handleSubmit(text);
    } else {
      startListening();
    }
  }, [listening, stopListening, startListening, handleSubmit]);

  const dismissHint = useCallback(() => {
    setHintDismissed(true);
    sessionStorage.setItem("iq_hint_seen", "1");
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "TEXTAREA" ||
          target.tagName === "INPUT" ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "m") {
        e.preventDefault();
        handleMic();
        return;
      }
      if (e.key === "Escape" && panelOpen && !typing) {
        setPanelOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleMic, panelOpen]);

  const shareCode = useCallback(() => {
    if (!editorCode.trim()) return;
    handleSubmit(
      `Here is my ${LANGUAGE_LABELS[editorLanguage]} solution:\n\n\`\`\`${editorLanguage}\n${editorCode}\n\`\`\``
    );
  }, [editorCode, editorLanguage, handleSubmit]);

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Shimmer>Loading your interview…</Shimmer>
      </main>
    );
  }

  return (
    <main className="relative flex flex-col h-[calc(100vh-4rem)] w-full shrink-0 overflow-hidden">
      {/* Finishing overlay */}
      {isFinishing && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm">
          <span className="size-10 animate-spin rounded-full border-[3px] border-indigo-600 border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">
            Generating your feedback report…
          </p>
          <p className="max-w-xs text-center text-xs text-muted-foreground/60">
            Analyzing your transcript, scoring each dimension, and preparing actionable insights.
          </p>
        </div>
      )}
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <BookOpenIcon className="size-4 shrink-0" />
          <span className="truncate font-medium capitalize text-foreground">{mode} Interview</span>
          {flaggedWeaknesses.length > 0 && (
            <span className="ml-1 flex shrink-0 items-center gap-1 text-xs text-amber-600">
              <FlagIcon className="size-3" />
              {flaggedWeaknesses.length} flagged
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {ttsSupported && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant={autoSpeak ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAutoSpeak((v) => !v)}
                    aria-pressed={autoSpeak}
                    className={cn(autoSpeak && "gap-1.5")}
                  />
                }
              >
                {autoSpeak ? <Volume2Icon className="size-4" /> : <VolumeXIcon className="size-4" />}
                <span className="hidden sm:inline">{autoSpeak ? "Reading" : "Read aloud"}</span>
              </TooltipTrigger>
              <TooltipContent>
                {autoSpeak ? "Interviewer replies are read aloud — tap to turn off" : "Read interviewer replies aloud"}
              </TooltipContent>
            </Tooltip>
          )}

          {speaking && (
            <Button
              variant="outline"
              size="sm"
              onClick={cancelSpeaking}
              className="gap-1.5 text-indigo-600"
            >
              <SquareIcon className="size-3.5" />
              <span className="hidden sm:inline">Stop</span>
            </Button>
          )}

          <Button
            variant={panelOpen ? "default" : "outline"}
            size="sm"
            onClick={() => setPanelOpen((v) => !v)}
            className="gap-1.5"
            aria-pressed={panelOpen}
          >
            {panelOpen ? <PanelRightCloseIcon className="size-4" /> : <PanelRightIcon className="size-4" />}
            <span className="hidden sm:inline">Tools</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleFinish}
            disabled={isResponding || isFinishing}
            className="gap-1.5"
          >
            {isFinishing ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <SquareIcon className="size-3.5" />
            )}
            <span className="hidden sm:inline">{isFinishing ? "Finishing…" : "End"}</span>
          </Button>
        </div>
      </div>

      {/* Mobile view switch */}
      <div className="flex items-center gap-1 border-b border-border bg-muted/40 px-3 py-2 lg:hidden">
        {(
          [
            { id: "chat", label: "Chat", icon: MessageSquareIcon },
            { id: "code", label: "Code", icon: Code2Icon },
            { id: "whiteboard", label: "Whiteboard", icon: PenToolIcon },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = mobileView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMobileView(tab.id as MobileView);
                if (tab.id !== "chat") setPanelTab(tab.id as PanelTab);
              }}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Workspace */}
      <div className="flex min-h-0 flex-1">
        {/* Chat */}
        <section
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
            mobileView !== "chat" && "max-lg:hidden"
          )}
        >
          <Conversation className="min-h-0 flex-1">
            <ConversationContent scrollClassName="flex-1 min-h-0">
              {messages.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                  <SparklesIcon className="size-10 text-muted-foreground" />
                  <h2 className="font-semibold text-lg">Interview Ready</h2>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    The interviewer will start with a question. Speak or type your answer — and use the Code and Whiteboard tools to show your work.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <Message key={msg.id} from={msg.role}>
                    <MessageContent>
                      <MessageResponse>{msg.content}</MessageResponse>
                    </MessageContent>
                    {msg.role === "assistant" && (
                      <MessageActions>
                        {ttsSupported && (
                          <MessageAction
                            label="Read aloud"
                            tooltip="Read this message aloud"
                            onClick={() => speak(msg.content)}
                          >
                            <Volume2Icon className="size-4" />
                          </MessageAction>
                        )}
                        {extractCodeBlock(msg.content) && (
                          <MessageAction
                            label="Open in editor"
                            tooltip="Open this code in the editor"
                            onClick={() => openInEditor(msg.content)}
                          >
                            <Code2Icon className="size-4" />
                          </MessageAction>
                        )}
                      </MessageActions>
                    )}
                  </Message>
                ))
              )}

              {isResponding && (
                <Message from="assistant">
                  <MessageContent>
                    <Shimmer>Thinking…</Shimmer>
                  </MessageContent>
                </Message>
              )}

            </ConversationContent>
          </Conversation>

          <div className="border-t bg-background px-4 pb-4 pt-3">
            {!hintDismissed && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <SparklesIcon className="mt-0.5 size-4 shrink-0" />
                <p className="flex-1">
                  Tip: tap the{" "}
                  <span className="font-medium text-foreground">mic</span> to
                  speak (⌘/Ctrl+M), hit{" "}
                  <span className="font-medium text-foreground">
                    Read aloud
                  </span>{" "}
                  to hear the interviewer, and open the{" "}
                  <span className="font-medium text-foreground">Code</span> /{" "}
                  <span className="font-medium text-foreground">
                    Whiteboard
                  </span>{" "}
                  panel to show your work.
                </p>
                <button
                  type="button"
                  onClick={dismissHint}
                  aria-label="Dismiss tip"
                  className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <XIcon className="size-4" />
                </button>
              </div>
            )}
            {messages.length === 0 && (
              <Suggestions className="mb-2">
                <Suggestion
                  suggestion="Tell me about yourself and your experience."
                  onClick={handleSuggestion}
                />
                <Suggestion
                  suggestion="I'm ready for the first question."
                  onClick={handleSuggestion}
                />
              </Suggestions>
            )}

            <PromptInputProvider>
              <ControllerBridge onReady={(c) => (controllerRef.current = c)} />
              <PromptInput
                onSubmit={(message) => handleSubmit(message.text)}
                className="max-w-full"
              >
                <PromptInputBody>
                  <PromptInputTextarea placeholder="Type or tap the mic to speak your answer…" />
                </PromptInputBody>
                <PromptInputFooter>
                  {listening ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <span className="size-2 animate-pulse rounded-full bg-red-500" />
                      Listening…
                    </span>
                  ) : (
                    <div />
                  )}
                  <div className="flex items-center gap-1">
                    {!sttSupported && !ttsSupported ? (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button variant="outline" size="icon-sm" disabled />
                          }
                        >
                          <MicOffIcon className="size-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Voice isn&apos;t supported in this browser.
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <>
                        {sttSupported && (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant={listening ? "default" : "outline"}
                                  size="icon-sm"
                                  onClick={handleMic}
                                  aria-pressed={listening}
                                  className={cn(
                                    listening &&
                                      "bg-red-500 text-white hover:bg-red-500"
                                  )}
                                />
                              }
                            >
                              {listening ? (
                                <MicOffIcon className="size-4" />
                              ) : (
                                <MicIcon className="size-4" />
                              )}
                            </TooltipTrigger>
                            <TooltipContent>
                              {listening
                                ? "Tap to stop and send"
                                : "Speak your answer (⌘/Ctrl+M)"}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {ttsSupported && (
                          <Popover>
                            <PopoverTrigger
                              render={
                                <Button
                                  variant="outline"
                                  size="icon-sm"
                                  aria-label="Voice options"
                                  aria-pressed={speaking}
                                  className={cn(speaking && "text-primary")}
                                />
                              }
                            >
                              <GlobeIcon className="size-4" />
                            </PopoverTrigger>
                            <PopoverContent className="w-60 p-2" align="end">
                              <p className="px-1 pb-1.5 text-xs font-medium text-muted-foreground">
                                Voice language
                              </p>
                              <div className="grid grid-cols-2 gap-1">
                                {VOICE_LANGS.map((l) => (
                                  <button
                                    key={l.code}
                                    type="button"
                                    onClick={() => setVoiceLang(l.code)}
                                    className={cn(
                                      "rounded-md px-2 py-1 text-left text-xs transition-colors",
                                      voiceLang === l.code
                                        ? "bg-primary/10 font-medium text-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                  >
                                    {l.label}
                                  </button>
                                ))}
                              </div>
                              <div className="my-2 h-px bg-border" />
                              <label className="flex items-center justify-between px-1 py-1 text-xs">
                                <span className="text-muted-foreground">
                                  Auto-read interviewer
                                </span>
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={autoSpeak}
                                  onClick={() => setAutoSpeak((v) => !v)}
                                  className={cn(
                                    "relative h-5 w-9 rounded-full transition-colors",
                                    autoSpeak
                                      ? "bg-primary"
                                      : "bg-muted-foreground/30"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "absolute top-0.5 size-4 rounded-full bg-background transition-transform",
                                      autoSpeak
                                        ? "translate-x-4"
                                        : "translate-x-0.5"
                                    )}
                                  />
                                </button>
                              </label>
                              {speaking && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-1 w-full gap-1.5"
                                  onClick={cancelSpeaking}
                                >
                                  <VolumeXIcon className="size-4" />
                                  Stop reading
                                </Button>
                              )}
                            </PopoverContent>
                          </Popover>
                        )}
                      </>
                    )}
                    <PromptInputSubmit
                      status={isResponding ? "streaming" : "ready"}
                      onStop={handleStop}
                    />
                  </div>
                </PromptInputFooter>
              </PromptInput>
            </PromptInputProvider>
          </div>
        </section>

        {/* Tools panel */}
        <aside
          className={cn(
            "flex min-h-0 min-w-0 flex-col border-border bg-background lg:w-[44%] lg:max-w-[680px] lg:min-w-[380px] lg:shrink-0",
            panelOpen ? "lg:flex lg:border-l" : "lg:hidden",
            mobileView === "chat" ? "max-lg:hidden" : "max-lg:flex max-lg:flex-1"
          )}
        >
          <div className="flex items-center gap-1 border-b border-border px-3 py-2">
            <button
              type="button"
              onClick={() => {
                setPanelTab("code");
                setMobileView("code");
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                panelTab === "code"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Code2Icon className="size-4" />
              Code
            </button>
            <button
              type="button"
              onClick={() => {
                setPanelTab("whiteboard");
                setMobileView("whiteboard");
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                panelTab === "whiteboard"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <PenToolIcon className="size-4" />
              Whiteboard
            </button>
          </div>

          <div className="min-h-0 flex-1">
            {panelTab === "code" ? (
              <CodeEditor
                value={editorCode}
                onChange={setEditorCode}
                language={editorLanguage}
                onLanguageChange={setEditorLanguage}
                onShare={shareCode}
              />
            ) : (
              <Whiteboard />
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
