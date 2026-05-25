"use client";

import { ChangeEvent, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  BookOpen,
  DollarSign,
  FileText,
  Globe,
  Link2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn, formatRelative } from "@/lib/utils";

type KnowledgeSource = Doc<"knowledge">["source"];

const SOURCE_LABEL: Record<KnowledgeSource, string> = {
  url: "URL",
  upload: "Upload",
  scratch: "Note",
  ai_pricing: "AI · Pricing",
  ai_market: "AI · Market",
  ai_persona: "AI · Persona",
};

const SOURCE_TONE: Record<KnowledgeSource, string> = {
  url: "bg-blue-50 text-blue-700 border-blue-100",
  upload: "bg-zinc-50 text-zinc-700 border-zinc-200",
  scratch: "bg-zinc-50 text-zinc-700 border-zinc-200",
  ai_pricing: "bg-amber-50 text-amber-800 border-amber-100",
  ai_market: "bg-emerald-50 text-emerald-800 border-emerald-100",
  ai_persona: "bg-violet-50 text-violet-800 border-violet-100",
};

const AI_QUICK_CREATES: Array<{
  kind: "ai_pricing" | "ai_market" | "ai_persona";
  label: string;
  description: string;
  icon: typeof DollarSign;
}> = [
  {
    kind: "ai_pricing",
    label: "Pricing strategy",
    description: "Tiers, price points, and rationale.",
    icon: DollarSign,
  },
  {
    kind: "ai_market",
    label: "Market validation",
    description: "Segments, competitors, experiments.",
    icon: Globe,
  },
  {
    kind: "ai_persona",
    label: "Customer persona",
    description: "Goals, pains, daily workflow.",
    icon: Users,
  },
];

export function KnowledgeListClient({ appId }: { appId: string }) {
  const typedAppId = appId as Id<"apps">;
  const router = useRouter();
  const docs = useQuery(api.knowledge.list, { appId: typedAppId });
  const createDoc = useMutation(api.knowledge.create);
  const removeDoc = useMutation(api.knowledge.remove);
  const scrapeUrl = useAction(api.firecrawl.scrapeUrl);
  const generateFromPrd = useAction(api.aiKnowledge.generateFromPrd);

  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [pendingDeletion, setPendingDeletion] = useState<Doc<"knowledge"> | null>(
    null,
  );
  const [scraping, startScrape] = useTransition();
  const [generatingKind, setGeneratingKind] = useState<
    "ai_pricing" | "ai_market" | "ai_persona" | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleCreateBlank() {
    void (async () => {
      try {
        const id = await createDoc({
          appId: typedAppId,
          title: "Untitled",
          content: "",
          source: "scratch",
        });
        router.push(`/app/${appId}/knowledge/${id}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create doc");
      }
    })();
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChosen(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 500_000) {
      toast.error("File is too large (max 500 KB).");
      return;
    }
    try {
      const text = await file.text();
      const title = file.name.replace(/\.(md|markdown|txt)$/i, "");
      const id = await createDoc({
        appId: typedAppId,
        title: title || "Uploaded doc",
        content: text,
        source: "upload",
      });
      router.push(`/app/${appId}/knowledge/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload file");
    }
  }

  function handleUrlSubmit() {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    startScrape(async () => {
      try {
        const id = await scrapeUrl({ appId: typedAppId, url });
        setUrlModalOpen(false);
        setUrlInput("");
        router.push(`/app/${appId}/knowledge/${id}`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Could not scrape that URL",
        );
      }
    });
  }

  function handleAiGenerate(kind: "ai_pricing" | "ai_market" | "ai_persona") {
    setGeneratingKind(kind);
    void (async () => {
      try {
        const id = await generateFromPrd({ appId: typedAppId, kind });
        router.push(`/app/${appId}/knowledge/${id}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Generation failed");
        setGeneratingKind(null);
      }
    })();
  }

  async function handleConfirmDelete() {
    if (!pendingDeletion) return;
    try {
      await removeDoc({ docId: pendingDeletion._id });
      setPendingDeletion(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete doc");
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Knowledge</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Reference docs your AI assistant draws from.
          </p>
        </div>
        <AddKnowledgeMenu
          onBlank={handleCreateBlank}
          onUrl={() => setUrlModalOpen(true)}
          onUpload={handleUploadClick}
        />
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        onChange={handleFileChosen}
        className="hidden"
      />

      <section className="mb-10">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Quick create with AI
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AI_QUICK_CREATES.map((item) => {
            const Icon = item.icon;
            const isLoading = generatingKind === item.kind;
            return (
              <button
                key={item.kind}
                type="button"
                onClick={() => handleAiGenerate(item.kind)}
                disabled={generatingKind !== null}
                className={cn(
                  "card group flex flex-col items-start gap-3 p-5 text-left transition-all",
                  "hover:shadow-[var(--shadow-pop)] hover:border-[var(--color-text)]/30",
                  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-[var(--shadow-soft)]",
                )}
              >
                <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-[var(--color-subtle)] text-[var(--color-text)] transition-colors group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-accent-fg)]">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="font-display text-base">{item.label}</div>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {item.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-muted)]">
                  <Sparkles className="h-3 w-3" />
                  {isLoading ? "Generating…" : "Generate from PRD"}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Documents
        </h2>
        {docs === undefined ? (
          <DocsSkeleton />
        ) : docs.length === 0 ? (
          <EmptyDocs />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc) => (
              <DocCard
                key={doc._id}
                appId={appId}
                doc={doc}
                onDelete={() => setPendingDeletion(doc)}
              />
            ))}
          </div>
        )}
      </section>

      <Modal
        open={urlModalOpen}
        onClose={() => {
          setUrlModalOpen(false);
          setUrlInput("");
        }}
        title="Add knowledge from URL"
        description="We'll fetch the page and convert it to markdown."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setUrlModalOpen(false);
                setUrlInput("");
              }}
              disabled={scraping}
            >
              Cancel
            </Button>
            <Button onClick={handleUrlSubmit} disabled={scraping || !urlInput.trim()}>
              <Link2 className="h-4 w-4" />
              {scraping ? "Scraping…" : "Add"}
            </Button>
          </>
        }
      >
        <Input
          autoFocus
          type="url"
          placeholder="https://example.com/article"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleUrlSubmit();
          }}
        />
      </Modal>

      <Modal
        open={pendingDeletion !== null}
        onClose={() => setPendingDeletion(null)}
        title="Delete this knowledge doc?"
        description={`"${pendingDeletion?.title}" will be removed. This can't be undone.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDeletion(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="bg-red-600 text-white hover:bg-red-500"
            >
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

function AddKnowledgeMenu({
  onBlank,
  onUrl,
  onUpload,
}: {
  onBlank: () => void;
  onUrl: () => void;
  onUpload: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function handle(action: () => void) {
    setOpen(false);
    action();
  }

  // close on outside click
  function onBackdrop() {
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <Button onClick={() => setOpen((v) => !v)}>
        <Plus className="h-4 w-4" />
        Add knowledge
      </Button>
      {open ? (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={onBackdrop}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute right-0 top-full z-40 mt-2 w-60 origin-top-right overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-[var(--shadow-pop)]"
            role="menu"
          >
            <MenuItem icon={<FileText className="h-4 w-4" />} onClick={() => handle(onBlank)}>
              Blank doc
            </MenuItem>
            <MenuItem icon={<Link2 className="h-4 w-4" />} onClick={() => handle(onUrl)}>
              From URL
            </MenuItem>
            <MenuItem icon={<Upload className="h-4 w-4" />} onClick={() => handle(onUpload)}>
              Upload markdown file
            </MenuItem>
          </motion.div>
        </>
      ) : null}
    </div>
  );
}

function MenuItem({
  icon,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-subtle)]"
    >
      <span className="text-[var(--color-muted)]">{icon}</span>
      {children}
    </button>
  );
}

function DocCard({
  appId,
  doc,
  onDelete,
}: {
  appId: string;
  doc: Doc<"knowledge">;
  onDelete: () => void;
}) {
  return (
    <div className="card group relative flex flex-col gap-3 p-5 transition-all hover:shadow-[var(--shadow-pop)] hover:border-[var(--color-text)]/30">
      <Link
        href={`/app/${appId}/knowledge/${doc._id}`}
        className="absolute inset-0 z-0 rounded-[inherit]"
        aria-label={doc.title}
      />
      <header className="relative z-10 flex items-start justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
            SOURCE_TONE[doc.source],
          )}
        >
          {SOURCE_LABEL[doc.source]}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Delete ${doc.title}`}
          className="relative z-10 grid h-7 w-7 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted)] opacity-0 transition-all hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </header>
      <div className="relative z-10 min-h-[3rem]">
        <h3 className="line-clamp-2 font-display text-base leading-snug">
          {doc.title || "Untitled"}
        </h3>
      </div>
      <footer className="relative z-10 text-[11px] text-[var(--color-muted)]">
        Updated {formatRelative(doc.updatedAt)}
      </footer>
    </div>
  );
}

function EmptyDocs() {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-subtle)] text-[var(--color-muted)]">
        <BookOpen className="h-5 w-5" />
      </div>
      <div>
        <div className="font-display text-base">No knowledge yet</div>
        <p className="mt-1 max-w-sm text-sm text-[var(--color-muted)]">
          Add reference material so your assistant can ground its answers in
          your real research.
        </p>
      </div>
    </div>
  );
}

function DocsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-subtle)]"
        />
      ))}
    </div>
  );
}
