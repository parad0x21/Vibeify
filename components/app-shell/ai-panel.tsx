"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useLocalStorage } from "@/lib/use-local-storage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { IconButton } from "@/components/ui/icon-button";
import { Kbd } from "@/components/ui/kbd";

const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
  loading: () => null,
});

const STARTER_PROMPTS = [
  "Summarize this app",
  "What features should I build first?",
  "Suggest a stack",
] as const;

export function AiPanel({ appId }: { appId: string | null }) {
  const [open, setOpen] = useLocalStorage<boolean>("vibeify.ai-panel.open", true);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-panel)]",
        "transition-[width] duration-200 ease-out",
        open ? "w-96" : "w-14",
      )}
      aria-label="AI assistant"
    >
      <PanelHeader appId={appId} open={open} onToggle={() => setOpen((v) => !v)} />

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            {appId ? <ChatBody appId={appId} /> : <NoAppState />}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </aside>
  );
}

function PanelHeader({
  appId,
  open,
  onToggle,
}: {
  appId: string | null;
  open: boolean;
  onToggle: () => void;
}) {
  const messages = useQuery(
    api.chatMessages.list,
    appId ? { appId: appId as Id<"apps"> } : "skip",
  );
  const clearChat = useMutation(api.chatMessages.clear);
  const [clearOpen, setClearOpen] = useState(false);

  async function handleConfirmClear() {
    if (!appId) return;
    try {
      await clearChat({ appId: appId as Id<"apps"> });
      setClearOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not clear chat");
    }
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center border-b border-[var(--color-border)]",
        open ? "h-14 justify-between px-3.5" : "h-14 justify-center",
      )}
    >
      {open ? (
        <>
          <div className="flex items-center gap-2.5">
            <div
              aria-hidden
              className="relative grid h-7 w-7 place-items-center overflow-hidden rounded-[8px] bg-gradient-to-br from-[var(--color-accent-from)] to-[var(--color-accent-to)] text-white shadow-[var(--shadow-1)]"
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30" />
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-[13px] font-semibold tracking-tight text-[var(--color-text)]">
                Assistant
              </span>
              <span className="text-[10px] font-medium tracking-tight text-[var(--color-muted)]">
                Claude · streaming
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages && messages.length > 0 ? (
              <IconButton
                onClick={() => setClearOpen(true)}
                label="Clear chat history"
                size="sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </IconButton>
            ) : null}
            <ToggleButton open={open} onClick={onToggle} />
          </div>
        </>
      ) : (
        <ToggleButton open={open} onClick={onToggle} />
      )}

      <Modal
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        title="Clear chat history?"
        description="All messages with the assistant for this app will be deleted."
        footer={
          <>
            <Button variant="ghost" onClick={() => setClearOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmClear}>
              <Trash2 className="h-3.5 w-3.5" />
              Clear chat
            </Button>
          </>
        }
      >
        <></>
      </Modal>
    </div>
  );
}

function ToggleButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <IconButton
      onClick={onClick}
      label={open ? "Collapse assistant (⌘B)" : "Expand assistant (⌘B)"}
      size="sm"
    >
      {open ? (
        <PanelLeftClose className="h-3.5 w-3.5" />
      ) : (
        <PanelLeftOpen className="h-3.5 w-3.5" />
      )}
    </IconButton>
  );
}

function NoAppState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div
        aria-hidden
        className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--color-accent-from)] to-[var(--color-accent-to)] text-white shadow-[var(--shadow-2)]"
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30" />
        <Sparkles className="h-5 w-5" />
      </div>
      <div>
        <div className="font-display text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
          Your assistant
        </div>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
          Open an app to start chatting.
        </p>
      </div>
    </div>
  );
}

function ChatBody({ appId }: { appId: string }) {
  const typedAppId = appId as Id<"apps">;
  const messages = useQuery(api.chatMessages.list, { appId: typedAppId });

  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages?.length, streamingText]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, [appId]);

  async function sendText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    setInput("");
    setIsStreaming(true);
    setStreamingText("");

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/claude/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, message: trimmed }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        let detail: string;
        try {
          const data = (await response.json()) as { error?: string };
          detail = data.error ?? "Chat request failed";
        } catch {
          detail = `Chat request failed (${response.status})`;
        }
        throw new Error(detail);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let separator = buffer.indexOf("\n\n");
        while (separator >= 0) {
          const frame = buffer.slice(0, separator);
          buffer = buffer.slice(separator + 2);
          if (frame.startsWith("data: ")) {
            try {
              const event = JSON.parse(frame.slice(6)) as SseEvent;
              if (event.type === "delta") {
                setStreamingText((prev) => prev + event.text);
              } else if (event.type === "error") {
                throw new Error(event.message);
              }
            } catch (parseErr) {
              if (parseErr instanceof Error && parseErr.message.length > 0) {
                throw parseErr;
              }
            }
          }
          separator = buffer.indexOf("\n\n");
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // user closed/switched — silent
      } else {
        toast.error(err instanceof Error ? err.message : "Chat failed");
      }
    } finally {
      setIsStreaming(false);
      setStreamingText("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendText(input);
    }
  }

  const hasMessages = messages !== undefined && messages.length > 0;
  const showEmpty = !hasMessages && !streamingText && !isStreaming;

  return (
    <>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {showEmpty ? (
          <EmptyChat onPick={(p) => void sendText(p)} />
        ) : (
          <div className="space-y-1">
            {messages?.map((m) => (
              <ChatBubble key={m._id} role={m.role} content={m.content} />
            ))}
            {isStreaming ? (
              <ChatBubble role="assistant" content={streamingText} streaming />
            ) : null}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-panel)]/80 p-3 backdrop-blur-sm">
        <div className="group/input relative rounded-[var(--radius-md)] ring-1 ring-inset ring-[var(--color-border)] transition-all focus-within:ring-2 focus-within:ring-[var(--color-accent)]/50 focus-within:shadow-[0_0_0_4px_var(--color-accent-soft)]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your app…"
            rows={1}
            disabled={isStreaming}
            className={cn(
              "w-full resize-none rounded-[var(--radius-md)] bg-[var(--color-panel-2)] py-2.5 pl-3.5 pr-11 text-sm text-[var(--color-text)]",
              "min-h-[44px] max-h-32",
              "placeholder:text-[var(--color-muted)]",
              "focus:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          />
          <button
            type="button"
            onClick={() => void sendText(input)}
            disabled={isStreaming || input.trim().length === 0}
            aria-label="Send"
            className={cn(
              "absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] transition-all duration-150",
              "bg-gradient-to-b from-[var(--color-accent-from)] to-[var(--color-accent-to)] text-white shadow-[var(--shadow-1)]",
              "hover:-translate-y-px hover:shadow-[var(--shadow-2)] hover:brightness-110",
              "active:translate-y-0 active:scale-[0.96]",
              "disabled:bg-[var(--color-panel-2)] disabled:from-[var(--color-panel-2)] disabled:to-[var(--color-panel-2)] disabled:text-[var(--color-muted)] disabled:shadow-none disabled:hover:translate-y-0",
            )}
          >
            {isStreaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[10px] text-[var(--color-muted)]">
          <Kbd>↵</Kbd> to send · <Kbd>⇧↵</Kbd> for newline
        </p>
      </div>
    </>
  );
}

function EmptyChat({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 pb-10 text-center">
      <div
        aria-hidden
        className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--color-accent-from)] to-[var(--color-accent-to)] text-white shadow-[var(--shadow-2)]"
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30" />
        <Sparkles className="h-5 w-5" />
      </div>
      <div>
        <div className="font-display text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
          How can I help?
        </div>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
          I have your PRD, stack, features, and notes in context.
        </p>
      </div>
      <div className="mt-1 flex w-full flex-col gap-1.5">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPick(prompt)}
            className="group/sp w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-left text-[12.5px] text-[var(--color-muted)] transition-all duration-150 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-subtle)] hover:text-[var(--color-text)]"
          >
            <span className="font-medium">{prompt}</span>
            <span className="float-right text-[var(--color-muted)] opacity-0 transition-opacity group-hover/sp:opacity-100">
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatBubble({
  role,
  content,
  streaming = false,
}: {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}) {
  if (role === "user") {
    return (
      <div className="mb-3 flex justify-end">
        <div className="max-w-[88%] whitespace-pre-wrap rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3.5 py-2 text-sm text-[var(--color-text)]">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 flex justify-start gap-2.5">
      <div
        aria-hidden
        className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-[6px] bg-gradient-to-br from-[var(--color-accent-from)] to-[var(--color-accent-to)] text-white shadow-[var(--shadow-1)]"
      >
        <Sparkles className="h-3 w-3" />
      </div>
      <div
        data-color-mode="dark"
        className="vibeify-chat-message min-w-0 flex-1 text-sm text-[var(--color-text)]"
      >
        {content.length > 0 ? (
          <>
            <MarkdownPreview
              source={content}
              style={{ background: "transparent", fontSize: "13.5px" }}
              wrapperElement={{ "data-color-mode": "dark" }}
            />
            {streaming ? (
              <span
                aria-hidden
                className="ml-1 inline-block h-3 w-2 translate-y-0.5 animate-pulse rounded-sm bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent-glow)]"
              />
            ) : null}
          </>
        ) : (
          <span className="inline-flex items-center gap-1 text-[var(--color-muted)]">
            <Dot delay={0} />
            <Dot delay={150} />
            <Dot delay={300} />
          </span>
        )}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-accent)]"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

type SseEvent =
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };
