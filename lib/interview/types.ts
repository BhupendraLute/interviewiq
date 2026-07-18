import type { EditorLanguage } from "@/components/interview/CodeEditor";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type PanelTab = "code" | "whiteboard";
export type MobileView = "chat" | "code" | "whiteboard";

export function extractCodeBlock(text: string): { code: string; lang: string } | null {
  const match = text.match(/```(\w+)?\n([\s\S]*?)```/);
  if (!match) return null;
  return { code: match[2].replace(/\n$/, ""), lang: (match[1] ?? "").toLowerCase() };
}

export function mapLang(lang: string): EditorLanguage {
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

export const VOICE_LANGS = [
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
