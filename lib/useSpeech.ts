"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RecognitionCtor = new () => SpeechRecognitionLike;

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    0: { transcript: string };
    isFinal: boolean;
  }>;
};

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Strip the most common markdown so spoken text reads naturally. */
export function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " code block ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/[*_#>`~]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// A livelier, conversational pace reads far more naturally than the default 1.0.
const SPEECH_RATE = 1.2;
const SPEECH_PITCH = 1;

/** Prefer a high-quality, language-matching voice when one is available. */
function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: string
): SpeechSynthesisVoice | undefined {
  if (!voices.length) return undefined;
  const base = lang.split("-")[0].toLowerCase();
  const langMatch = voices.filter(
    (v) =>
      v.lang.toLowerCase() === lang.toLowerCase() ||
      v.lang.toLowerCase().startsWith(base)
  );
  const pool = langMatch.length ? langMatch : voices;
  const enhanced = pool.find((v) =>
    /google|natural|premium|neural|enhanced|samantha|zira|aria|microsoft/i.test(
      v.name
    )
  );
  return enhanced ?? pool[0];
}

export type UseSpeechOptions = {
  /** Language BCP-47 tag for both recognition and synthesis. */
  lang?: string;
  /** Called when the user finishes a final utterance (full transcript). */
  onFinalTranscript?: (transcript: string) => void;
  /** Called on every recognition update (incl. interim text). */
  onInterimTranscript?: (transcript: string) => void;
};

export type UseSpeech = {
  sttSupported: boolean;
  ttsSupported: boolean;
  listening: boolean;
  speaking: boolean;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  cancelSpeaking: () => void;
};

export function useSpeech(options: UseSpeechOptions = {}): UseSpeech {
  const { lang = "en-US", onFinalTranscript, onInterimTranscript } = options;

  const [sttSupported, setSttSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");
  const interimRef = useRef("");
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const onFinalRef = useRef(onFinalTranscript);
  const onInterimRef = useRef(onInterimTranscript);

  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
    onInterimRef.current = onInterimTranscript;
  }, [onFinalTranscript, onInterimTranscript]);

  useEffect(() => {
    const ctor = getRecognitionCtor();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSttSupported(!!ctor);
    setTtsSupported(
      typeof window !== "undefined" && "speechSynthesis" in window
    );

    if (!ctor) return;

    const recognition = new ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      setListening(false);
      const final = finalRef.current.trim();
      const interim = interimRef.current.trim();
      const combined = final + (final && interim ? " " : "") + interim;
      if (combined) {
        onFinalRef.current?.(combined);
      }
      finalRef.current = "";
      interimRef.current = "";
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setListening(false);
      }
    };
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalRef.current += transcript;
        } else {
          interim += transcript;
        }
      }
      interimRef.current = interim;
      if (interim) onInterimRef.current?.(interim);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.onstart = null;
        recognition.abort();
      } catch {
        /* noop */
      }
    };
  }, [lang]);

  // Cache available synthesis voices (they load asynchronously in some browsers).
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || listening) return;
    finalRef.current = "";
    try {
      recognition.start();
    } catch {
      /* start() throws if already started; ignore */
    }
  }, [listening]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const clean = stripMarkdownForSpeech(text);
      if (!clean) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = lang;
      const voice = pickVoice(voicesRef.current, lang);
      if (voice) utterance.voice = voice;
      utterance.rate = SPEECH_RATE;
      utterance.pitch = SPEECH_PITCH;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [lang]
  );

  const cancelSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  // Cancel any in-flight speech when the component unmounts.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    sttSupported,
    ttsSupported,
    listening,
    speaking,
    startListening,
    stopListening,
    speak,
    cancelSpeaking,
  };
}
