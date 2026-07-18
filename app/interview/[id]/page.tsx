"use client";

import { useEffect, use } from "react";
import dynamic from "next/dynamic";
import { Conversation, ConversationContent } from "@/components/chat/conversation";
import {
  Message, MessageContent, MessageResponse, MessageActions, MessageAction,
} from "@/components/chat/message";
import {
  PromptInput, PromptInputBody, PromptInputTextarea, PromptInputFooter,
  PromptInputSubmit, PromptInputProvider, usePromptInputController,
  type PromptInputControllerProps,
} from "@/components/chat/prompt-input";
import { Suggestions, Suggestion } from "@/components/chat/suggestion";
import { Shimmer } from "@/components/chat/shimmer";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { extractCodeBlock, type MobileView, type PanelTab } from "@/lib/interview/types";
import { useInterviewSession } from "@/hooks/useInterviewSession";
import {
  BookOpenIcon, Code2Icon, FlagIcon, GlobeIcon, MessageSquareIcon,
  MicIcon, MicOffIcon, PanelRightIcon, PanelRightCloseIcon, PenToolIcon,
  SquareIcon, SparklesIcon, Volume2Icon, VolumeXIcon, XIcon,
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

export default function InterviewSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = use(params);
  const {
    messages, mode, flaggedWeaknesses, isLoading, isResponding, isFinishing,
    panelOpen, setPanelOpen, panelTab, setPanelTab, mobileView, setMobileView,
    editorCode, setEditorCode, editorLanguage, setEditorLanguage,
    autoSpeak, setAutoSpeak, voiceLang, setVoiceLang, hintDismissed,
    controllerRef,
    sttSupported, ttsSupported, listening, speaking, speak, cancelSpeaking,
    handleSubmit, handleStop, handleFinish, handleSuggestion, handleMic, dismissHint, openInEditor, shareCode,
    VOICE_LANGS,
  } = useInterviewSession(sessionId);

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Shimmer>Loading your interview…</Shimmer>
      </main>
    );
  }

  return (
    <main className="relative flex flex-col h-[calc(100vh-4rem)] w-full shrink-0 overflow-hidden">
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
            <Button variant="outline" size="sm" onClick={cancelSpeaking} className="gap-1.5 text-indigo-600">
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

      <div className="flex min-h-0 flex-1">
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
                  <span className="font-medium text-foreground">Read aloud</span>{" "}
                  to hear the interviewer, and open the{" "}
                  <span className="font-medium text-foreground">Code</span> /{" "}
                  <span className="font-medium text-foreground">Whiteboard</span>{" "}
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
                                    listening && "bg-red-500 text-white hover:bg-red-500"
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
                                    autoSpeak ? "bg-primary" : "bg-muted-foreground/30"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "absolute top-0.5 size-4 rounded-full bg-background transition-transform",
                                      autoSpeak ? "translate-x-4" : "translate-x-0.5"
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

        <aside
          className={cn(
            "flex min-h-0 min-w-0 flex-col border-border bg-background lg:w-[44%] lg:max-w-170 lg:min-w-95 lg:shrink-0",
            panelOpen ? "lg:flex lg:border-l" : "lg:hidden",
            mobileView === "chat" ? "max-lg:hidden" : "max-lg:flex max-lg:flex-1"
          )}
        >
          <div className="flex items-center gap-1 border-b border-border px-3 py-2">
            <button
              type="button"
              onClick={() => { setPanelTab("code"); setMobileView("code"); }}
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
              onClick={() => { setPanelTab("whiteboard"); setMobileView("whiteboard"); }}
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
