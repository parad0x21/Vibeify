"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownEditor } from "@/components/markdown-editor";
import { Modal } from "@/components/ui/modal";
import { SaveStatus, SaveStatusPill } from "@/components/save-status-pill";

const AUTOSAVE_DEBOUNCE_MS = 800;

export function KnowledgeEditorClient({
  appId,
  docId,
}: {
  appId: string;
  docId: string;
}) {
  const typedDocId = docId as Id<"knowledge">;
  const doc = useQuery(api.knowledge.get, { docId: typedDocId });

  if (doc === undefined) return <EditorSkeleton />;
  if (doc === null) return <NotFound appId={appId} />;

  return <DocEditor key={doc._id} appId={appId} doc={doc} />;
}

function DocEditor({ appId, doc }: { appId: string; doc: Doc<"knowledge"> }) {
  const router = useRouter();
  const update = useMutation(api.knowledge.update);
  const remove = useMutation(api.knowledge.remove);

  const [title, setTitle] = useState(doc.title);
  const [content, setContent] = useState(doc.content);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<number | null>(doc.updatedAt);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(0);
  const stateRef = useRef({ title, content });

  useEffect(() => {
    stateRef.current = { title, content };
  }, [title, content]);

  const flush = useCallback(
    async (nextTitle: string, nextContent: string) => {
      const ticket = ++inFlight.current;
      try {
        await update({
          docId: doc._id,
          title: nextTitle,
          content: nextContent,
        });
        if (ticket === inFlight.current) {
          setStatus("saved");
          setLastSaved(Date.now());
        }
      } catch {
        if (ticket === inFlight.current) setStatus("error");
      }
    },
    [doc._id, update],
  );

  const schedule = useCallback(
    (nextTitle: string, nextContent: string) => {
      setStatus("saving");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void flush(nextTitle, nextContent);
      }, AUTOSAVE_DEBOUNCE_MS);
    },
    [flush],
  );

  useEffect(() => {
    function flushIfPending() {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        const { title: t, content: c } = stateRef.current;
        void flush(t, c);
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

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setTitle(next);
    schedule(next, content);
  }

  function handleContentChange(next: string) {
    setContent(next);
    schedule(title, next);
  }

  function handleDownload() {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(title)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleConfirmDelete() {
    try {
      await remove({ docId: doc._id });
      router.push(`/app/${appId}/knowledge`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-8">
      <Link
        href={`/app/${appId}/knowledge`}
        className="mb-6 inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to knowledge
      </Link>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          {doc.sourceUrl ? (
            <a
              href={doc.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 inline-block max-w-full truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)] hover:text-[var(--color-accent)]"
            >
              Source · {doc.sourceUrl}
            </a>
          ) : null}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled"
            className="w-full bg-transparent font-display text-[28px] font-semibold tracking-tight text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]/60"
            maxLength={200}
          />
        </div>
        <div className="flex items-center gap-2">
          <SaveStatusPill status={status} lastSaved={lastSaved} />
          <Button variant="secondary" size="sm" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
          <IconButton
            onClick={() => setDeleteOpen(true)}
            label="Delete"
            size="md"
            className="text-[var(--color-muted)] hover:bg-[rgba(244,63,94,0.10)] hover:text-[var(--color-danger)]"
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </header>

      <MarkdownEditor
        value={content}
        onChange={handleContentChange}
        placeholder="Start writing…"
      />

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this knowledge doc?"
        description={`"${title || "Untitled"}" will be removed. This can't be undone.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </>
        }
      >
        <></>
      </Modal>
    </section>
  );
}

function NotFound({ appId }: { appId: string }) {
  return (
    <section className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center px-6 text-center">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text)]">
          Knowledge doc not found
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          It may have been deleted, or you don&apos;t have access.
        </p>
        <Link
          href={`/app/${appId}/knowledge`}
          className="mt-5 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-panel-2)] px-3.5 py-2 text-sm font-medium text-[var(--color-text)] ring-1 ring-inset ring-[var(--color-border-strong)] transition-colors hover:bg-[var(--color-subtle)]"
        >
          Back to knowledge
        </Link>
      </div>
    </section>
  );
}

function EditorSkeleton() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-8">
      <Skeleton className="mb-6 h-4 w-32 rounded" />
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-9 w-72 rounded" />
        </div>
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      <Skeleton className="h-[560px] rounded-[var(--radius-lg)]" />
    </section>
  );
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "knowledge"
  );
}
