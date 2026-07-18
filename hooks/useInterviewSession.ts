"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { respond, finishSession, type InterviewMode } from "@/lib/api";
import { useSpeech } from "@/hooks/useSpeech";
import { LANGUAGE_LABELS } from "@/components/interview/CodeEditor";
import type { EditorLanguage } from "@/components/interview/CodeEditor";
import type { PromptInputControllerProps } from "@/components/chat/prompt-input";
import { extractCodeBlock, mapLang, VOICE_LANGS } from "@/lib/interview/types";
import type { ChatMessage, PanelTab, MobileView } from "@/lib/interview/types";

export function useInterviewSession(sessionId: string) {
  const router = useRouter();
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
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [voiceLang, setVoiceLang] = useState("en-US");
  const [hintDismissed, setHintDismissed] = useState(true);

  const controllerRef = useRef<PromptInputControllerProps | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const submitTranscriptRef = useRef<(text: string) => void>(() => {});

  const { sttSupported, ttsSupported, listening, speaking, startListening, stopListening, speak, cancelSpeaking } =
    useSpeech({
      lang: voiceLang,
      onInterimTranscript: (transcript) => {
        controllerRef.current?.textInput.setInput(transcript);
      },
      onFinalTranscript: (transcript) => {
        submitTranscriptRef.current(transcript);
      },
    });

  useEffect(() => {
    const stored = sessionStorage.getItem(`iq_session_${sessionId}`);
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
    setPanelTab(resolvedMode === "system-design" ? "whiteboard" : "code");
    setPanelOpen(resolvedMode !== "behavioral");
    setHintDismissed(sessionStorage.getItem("iq_hint_seen") === "1");
    setIsLoading(false);
  }, [sessionId]);

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

  useEffect(() => {
    submitTranscriptRef.current = handleSubmit;
  }, [handleSubmit]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const handleFinish = useCallback(async () => {
    if (!sessionId || isFinishing) return;
    setIsFinishing(true);
    try {
      await finishSession(sessionId, mode);
      sessionStorage.removeItem(`iq_session_${sessionId}`);
      router.push(`/interview/${sessionId}/report`);
    } catch {
      router.push(`/interview/${sessionId}/report`);
    }
  }, [sessionId, router, isFinishing, mode]);

  const handleSuggestion = useCallback(
    (suggestion: string) => handleSubmit(suggestion),
    [handleSubmit]
  );

  const handleMic = useCallback(() => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  }, [listening, stopListening, startListening]);

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

  return {
    messages,
    mode,
    flaggedWeaknesses,
    isLoading,
    isResponding,
    isFinishing,
    panelOpen,
    setPanelOpen,
    panelTab,
    setPanelTab,
    mobileView,
    setMobileView,
    editorCode,
    setEditorCode,
    editorLanguage,
    setEditorLanguage,
    autoSpeak,
    setAutoSpeak,
    voiceLang,
    setVoiceLang,
    hintDismissed,
    controllerRef,
    sttSupported,
    ttsSupported,
    listening,
    speaking,
    speak,
    cancelSpeaking,
    handleSubmit,
    handleStop,
    handleFinish,
    handleSuggestion,
    handleMic,
    dismissHint,
    openInEditor,
    shareCode,
    VOICE_LANGS,
  };
}
