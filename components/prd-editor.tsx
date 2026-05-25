"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { Download } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/markdown-editor";
import { SaveStatus, SaveStatusPill } from "@/components/save-status-pill";

const AUTOSAVE_DEBOUNCE_MS = 800;

export function PrdEditor({
  appId,
  appName,
  initialContent,
  initialUpdatedAt,
}: {
  appId: Id<"apps">;
  appName: string;
  initialContent: string;
  initialUpdatedAt: number;
}) {
  const savePrd = useMutation(api.prds.savePrd);
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<number | null>(initialUpdatedAt);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(0);
  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const flush = useCallback(
    async (next: string) => {
      const ticket = ++inFlight.current;
      try {
        await savePrd({ appId, content: next });
        if (ticket === inFlight.current) {
          setStatus("saved");
          setLastSaved(Date.now());
        }
      } catch {
        if (ticket === inFlight.current) {
          setStatus("error");
        }
      }
    },
    [appId, savePrd],
  );

  const scheduleSave = useCallback(
    (next: string) => {
      setContent(next);
      setStatus("saving");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void flush(next);
      }, AUTOSAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  // Flush any pending save when the tab is hidden or the component unmounts.
  useEffect(() => {
    function flushIfPending() {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        void flush(contentRef.current);
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushIfPending();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      flushIfPending();
    };
  }, [flush]);

  function handleDownload() {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(appName)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
            {appName}
          </div>
          <h1 className="mt-1 font-display text-3xl tracking-tight">PRD</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <SaveStatusPill status={status} lastSaved={lastSaved} />
          <Button variant="secondary" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download .md
          </Button>
        </div>
      </header>

      <MarkdownEditor
        value={content}
        onChange={scheduleSave}
        placeholder={
          "Start writing your PRD…\n\nTry: ## Overview\nWhat are we building, and for whom?"
        }
      />
    </section>
  );
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "prd"
  );
}
