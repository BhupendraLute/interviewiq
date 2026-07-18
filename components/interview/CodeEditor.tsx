"use client";

import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { sql } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SendIcon } from "lucide-react";

export type EditorLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "cpp"
  | "sql"
  | "plaintext";

export const LANGUAGE_LABELS: Record<EditorLanguage, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  cpp: "C++",
  sql: "SQL",
  plaintext: "Plain text",
};

function buildExtensions(language: EditorLanguage) {
  switch (language) {
    case "javascript":
      return [javascript({ jsx: false })];
    case "typescript":
      return [javascript({ jsx: false, typescript: true })];
    case "python":
      return [python()];
    case "java":
      return [java()];
    case "cpp":
      return [cpp()];
    case "sql":
      return [sql()];
    default:
      return [];
  }
}

export type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  language: EditorLanguage;
  onLanguageChange: (language: EditorLanguage) => void;
  onShare: () => void;
  className?: string;
};

export function CodeEditor({
  value,
  onChange,
  language,
  onLanguageChange,
  onShare,
  className,
}: CodeEditorProps) {
  const extensions = useMemo(() => buildExtensions(language), [language]);

  return (
    <div
      className={cn(
        "flex size-full min-h-0 flex-col overflow-hidden bg-[#282c34]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <Select
          value={language}
          onValueChange={(v) => v && onLanguageChange(v as EditorLanguage)}
        >
          <SelectTrigger className="h-7 w-auto gap-1.5 border-white/10 bg-white/5 px-2.5 text-xs text-zinc-200 hover:bg-white/10 focus-visible:ring-0 focus-visible:ring-offset-0 [&>span]:text-zinc-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(LANGUAGE_LABELS) as EditorLanguage[]).map((lang) => (
              <SelectItem key={lang} value={lang}>
                {LANGUAGE_LABELS[lang]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="sm"
                onClick={onShare}
                disabled={!value.trim()}
                className="h-7 gap-1.5 bg-indigo-500 text-white hover:bg-indigo-400"
              />
            }
          >
            <SendIcon className="size-3.5" />
            Share with interviewer
          </TooltipTrigger>
          <TooltipContent>
            Send your code to the interviewer as context
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <CodeMirror
          value={value}
          height="100%"
          theme={oneDark}
          extensions={extensions}
          onChange={onChange}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: true,
            autocompletion: true,
            indentOnInput: true,
          }}
          style={{ height: "100%", fontSize: 13 }}
          placeholder={`// Write your solution here…\n// Use "Share with interviewer" to send it to the AI.`}
        />
      </div>
    </div>
  );
}
