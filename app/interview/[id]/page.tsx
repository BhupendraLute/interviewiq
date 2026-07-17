"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import {
  Suggestions,
  Suggestion,
} from "@/components/ai-elements/suggestion";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import {
  BookOpenIcon,
  FlagIcon,
  SparklesIcon,
  SquareIcon,
} from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

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
  const [mode, setMode] = useState<InterviewMode>("coding");
  const [flaggedWeaknesses, setFlaggedWeaknesses] = useState<
    { topic: string; note: string }[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { id } = await params;
      setSessionId(id);
      const stored = sessionStorage.getItem(`iq_session_${id}`);
      if (stored) {
        const data = JSON.parse(stored);
        setMessages(data.messages ?? []);
        setMode(data.mode ?? "coding");
        setFlaggedWeaknesses(data.flagged ?? []);
      }
      setIsLoading(false);
    };
    init();
  }, [params]);

  useEffect(() => {
    if (sessionId && messages.length > 0) {
      sessionStorage.setItem(
        `iq_session_${sessionId}`,
        JSON.stringify({ messages, mode, flagged: flaggedWeaknesses })
      );
    }
  }, [sessionId, messages, mode, flaggedWeaknesses]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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

      try {
        const result = await respond(sessionId, text, mode);

        if (result.flagged?.length > 0) {
          setFlaggedWeaknesses((prev) => [...prev, ...result.flagged]);
        }

        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.reply,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (err: any) {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `**Error:** ${err.message ?? "Something went wrong. Please try again."}`,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsResponding(false);
      }
    },
    [sessionId, mode, isResponding]
  );

  const handleFinish = useCallback(async () => {
    if (!sessionId) return;
    try {
      await finishSession(sessionId);
      sessionStorage.removeItem(`iq_session_${sessionId}`);
      router.push(`/interview/${sessionId}/report`);
    } catch {
      // Continue to report anyway
      router.push(`/interview/${sessionId}/report`);
    }
  }, [sessionId, router]);

  const handleSuggestion = useCallback(
    (suggestion: string) => {
      handleSubmit(suggestion);
    },
    [handleSubmit]
  );

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Shimmer>Loading your interview...</Shimmer>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpenIcon className="size-4" />
          <span className="font-medium capitalize">{mode} Interview</span>
        </div>
        <div className="flex items-center gap-2">
          {flaggedWeaknesses.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <FlagIcon className="size-3" />
              {flaggedWeaknesses.length} flagged
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleFinish}
            disabled={isResponding}
          >
            <SquareIcon className="size-3.5 mr-1" />
            End Interview
          </Button>
        </div>
      </div>

      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
              <SparklesIcon className="size-10 text-muted-foreground" />
              <h2 className="font-semibold text-lg">Interview Ready</h2>
              <p className="text-muted-foreground text-sm max-w-sm">
                The interviewer will start with a question. Type your response below and the AI will follow up based on what you say.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <Message key={msg.id} from={msg.role}>
                <MessageContent>
                  <MessageResponse>{msg.content}</MessageResponse>
                </MessageContent>
              </Message>
            ))
          )}

          {isResponding && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Thinking...</Shimmer>
              </MessageContent>
            </Message>
          )}

          <div ref={messagesEndRef} />
        </ConversationContent>
      </Conversation>

      <div className="border-t bg-background px-4 pb-4 pt-3">
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

        <PromptInput
          onSubmit={(message) => handleSubmit(message.text)}
          className="max-w-full"
        >
          <PromptInputBody>
            <PromptInputTextarea placeholder="Type your answer..." />
          </PromptInputBody>
          <PromptInputFooter>
            <div />
            <PromptInputSubmit
              status={isResponding ? "streaming" : "ready"}
              onStop={() => {}}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </main>
  );
}
