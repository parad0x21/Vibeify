"use client";

import { ChangeEvent, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
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
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatRelative } from "@/lib/utils";

type KnowledgeSource = Doc<"knowledge">["source"];
type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger" | "accent";

const SOURCE_LABEL: Record<KnowledgeSource, string> = {
  url: "URL",
  upload: "Upload",
  scratch: "Note",
  ai_pricing: "AI · Pricing",
  ai_market: "AI · Market",
  ai_persona: "AI · Persona",
};

const SOURCE_TONE: Record<KnowledgeSource, BadgeTone> = {
  url: "info",
  upload: "neutral",
  scratch: "neutral",
  ai_pricing: "warning",
  ai_market: "success",
  ai_persona: "accent",
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
  const [pendingDeletion, setPendingDeletion] = useState<Doc<"knowledge"> | null>(null);
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
        toast.error(err instanceof Error ? err.message : "Could not scrape that URL");
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
      <motion.header
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="mb-8 flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-[28px] font-semibold tracking-tight text-[var(--color-text)]">
            Knowledge
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Reference docs your AI assistant draws from.
          </p>
        </div>
        <AddKnowledgeMenu
          onBlank={handleCreateBlank}
          onUrl={() => setUrlModalOpen(true)}
          onUpload={handleUploadClick}
        />
      </motion.header>

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        onChange={handleFileChosen}
        className="hidden"
      />

      <section className="mb-10">
        <SectionLabel>Quick create with AI</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                  "group relative flex flex-col items-start gap-3 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-panel)] p-5 text-left shadow-[var(--shadow-1)] transition-colors duration-200",
                  "hover:border-[var(--color-border-strong)] hover:bg-[var(--color-panel-2)]",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                <div className="relative grid h-9 w-9 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-panel-2)] text-[var(--color-accent)] transition-colors group-hover:border-[var(--color-accent)]">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="relative flex-1">
                  <div className="font-display text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
                    {item.label}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
                    {item.description}
                  </p>
                </div>
                <div className="relative flex items-center gap-1 text-[10px] font-medium tracking-tight text-[var(--color-accent)]">
                  <Sparkles className="h-3 w-3" />
                  {isLoading ? "Generating…" : "Generate from PRD"}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <SectionLabel>Documents</SectionLabel>
        {docs === undefined ? (
          <DocsSkeleton />
        ) : docs.length === 0 ? (
          <EmptyDocs />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
        {children}
      </h2>
      <div className="h-px flex-1 bg-[var(--color-border)]" />
    </div>
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

  return (
    <div ref={ref} className="relative">
      <Button size="sm" onClick={() => setOpen((v) => !v)}>
        <Plus className="h-3.5 w-3.5" />
        Add knowledge
      </Button>
      <AnimatePresence>
        {open ? (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-full z-40 mt-2 w-60 origin-top-right overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] bg-[var(--color-panel-2)] p-1.5 shadow-[var(--shadow-3)]"
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
      </AnimatePresence>
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
      className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-left text-[13px] text-[var(--color-text)] transition-colors hover:bg-[var(--color-subtle)]"
    >
      <span className="text-[var(--color-accent)]">{icon}</span>
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
    <div className="group relative flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-[var(--shadow-1)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-panel-2)] hover:shadow-[var(--shadow-2)]">
      <Link
        href={`/app/${appId}/knowledge/${doc._id}`}
        className="absolute inset-0 z-0 rounded-[inherit]"
        aria-label={doc.title}
      />
      <header className="pointer-events-none relative z-10 flex items-start justify-between gap-2">
        <Badge tone={SOURCE_TONE[doc.source]} size="sm" dot>
          {SOURCE_LABEL[doc.source]}
        </Badge>
        <div className="pointer-events-auto opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
          <IconButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            label={`Delete ${doc.title}`}
            size="sm"
            className="text-[var(--color-muted)] hover:bg-[rgba(244,63,94,0.10)] hover:text-[var(--color-danger)]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </header>
      <div className="pointer-events-none relative z-10 min-h-[2.75rem]">
        <h3 className="line-clamp-2 font-display text-[15px] font-semibold leading-snug tracking-tight text-[var(--color-text)]">
          {doc.title || "Untitled"}
        </h3>
      </div>
      <footer className="pointer-events-none relative z-10 text-[11px] text-[var(--color-muted)]">
        Updated {formatRelative(doc.updatedAt)}
      </footer>
    </div>
  );
}

function EmptyDocs() {
  return (
    <div className="relative flex flex-col items-center gap-4 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-panel)] px-6 py-14 text-center shadow-[var(--shadow-1)]">
      <div className="relative grid h-12 w-12 place-items-center rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] bg-[var(--color-panel-2)] text-[var(--color-accent)]">
        <BookOpen className="h-5 w-5" />
      </div>
      <div className="relative">
        <div className="font-display text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
          No knowledge yet
        </div>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-[var(--color-muted)]">
          Add reference material so your assistant can ground its answers in
          your real research.
        </p>
      </div>
    </div>
  );
}

function DocsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-[var(--radius-lg)]" />
      ))}
    </div>
  );
}
