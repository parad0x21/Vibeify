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

const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
  loading: () => null,
});

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
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]",
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
            transition={{ duration: 0.15, ease: "easeOut" }}
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
        open ? "h-16 justify-between px-4" : "h-16 justify-center",
      )}
    >
      {open ? (
        <>
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-[8px] bg-[var(--color-subtle)] text-[var(--color-text)]">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="font-display text-sm">Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            {messages && messages.length > 0 ? (
              <button
                type="button"
                onClick={() => setClearOpen(true)}
                aria-label="Clear chat history"
                title="Clear chat"
                className="grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-subtle)] hover:text-[var(--color-text)]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
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
            <Button
              onClick={handleConfirmClear}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              <Trash2 className="h-4 w-4" />
              Clear
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
    <button
      type="button"
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-subtle)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text)]/15"
      aria-label={open ? "Collapse assistant" : "Expand assistant"}
      title={open ? "Collapse (⌘B)" : "Expand (⌘B)"}
    >
      {open ? (
        <PanelLeftClose className="h-4 w-4" />
      ) : (
        <PanelLeftOpen className="h-4 w-4" />
      )}
    </button>
  );
}

function NoAppState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-subtle)]">
        <Sparkles className="h-5 w-5 text-[var(--color-muted)]" />
      </div>
      <div>
        <div className="font-display text-sm">Your assistant</div>
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

  // Auto-scroll to bottom on new content (reads, not writes — safe in effect).
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages?.length, streamingText]);

  // Abort any in-flight request when the app changes or the panel unmounts.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, [appId]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;
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
        body: JSON.stringify({ appId, message: text }),
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
      void handleSend();
    }
  }

  const hasMessages = messages !== undefined && messages.length > 0;
  const showEmpty = !hasMessages && !streamingText && !isStreaming;

  return (
    <>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {showEmpty ? (
          <EmptyChat />
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

      <div className="shrink-0 border-t border-[var(--color-border)] p-3">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your app…"
            rows={1}
            disabled={isStreaming}
            className={cn(
              "w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 pl-3.5 pr-10 text-sm",
              "min-h-[44px] max-h-32",
              "placeholder:text-[var(--color-muted)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text)]/15",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={isStreaming || input.trim().length === 0}
            aria-label="Send"
            className={cn(
              "absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] transition-colors",
              "bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:bg-[var(--color-accent)]/90",
              "disabled:bg-[var(--color-subtle)] disabled:text-[var(--color-muted)]",
            )}
          >
            {isStreaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-[var(--color-muted)]">
          The assistant sees your PRD, stack, features, and knowledge.
        </p>
      </div>
    </>
  );
}

function EmptyChat() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 pb-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-subtle)]">
        <Sparkles className="h-5 w-5 text-[var(--color-muted)]" />
      </div>
      <div>
        <div className="font-display text-sm">Your assistant</div>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
          Ask anything about your PRD, stack, features, or research notes.
        </p>
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
        <div className="max-w-[88%] whitespace-pre-wrap rounded-2xl bg-[var(--color-subtle)] px-3.5 py-2 text-sm text-[var(--color-text)]">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 flex justify-start">
      <div
        data-color-mode="light"
        className="vibeify-chat-message max-w-[92%] text-sm text-[var(--color-text)]"
      >
        {content.length > 0 ? (
          <MarkdownPreview
            source={content}
            style={{ background: "transparent", fontSize: "13.5px" }}
            wrapperElement={{ "data-color-mode": "light" }}
          />
        ) : (
          <span className="inline-flex gap-1 text-[var(--color-muted)]">
            <Dot delay={0} />
            <Dot delay={150} />
            <Dot delay={300} />
          </span>
        )}
        {streaming && content.length > 0 ? (
          <span className="ml-0.5 inline-block h-3 w-1 translate-y-0.5 animate-pulse bg-current" />
        ) : null}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-current"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

type SseEvent =
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };
