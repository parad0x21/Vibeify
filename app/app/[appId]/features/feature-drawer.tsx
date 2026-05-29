"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { MarkdownEditor } from "@/components/markdown-editor";
import { Modal } from "@/components/ui/modal";
import { SaveStatus, SaveStatusPill } from "@/components/save-status-pill";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const AUTOSAVE_DEBOUNCE_MS = 800;

export function FeatureDrawer({
  featureId,
  releases,
  columns,
  onClose,
}: {
  featureId: Id<"features"> | null;
  releases: Doc<"releases">[];
  columns: Doc<"columns">[];
  onClose: () => void;
}) {
  useEffect(() => {
    if (!featureId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [featureId, onClose]);

  return (
    <AnimatePresence>
      {featureId ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-black/80"
          onClick={onClose}
        >
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-[var(--color-border-strong)] bg-[var(--color-panel)] shadow-[var(--shadow-3)]"
            role="dialog"
            aria-modal="true"
          >
            <DrawerContent
              featureId={featureId}
              releases={releases}
              columns={columns}
              onClose={onClose}
            />
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function DrawerContent({
  featureId,
  releases,
  columns,
  onClose,
}: {
  featureId: Id<"features">;
  releases: Doc<"releases">[];
  columns: Doc<"columns">[];
  onClose: () => void;
}) {
  const feature = useQuery(api.features.get, { featureId });

  if (feature === undefined) {
    return (
      <>
        <DrawerHeader onClose={onClose} />
        <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted)]">
          Loading…
        </div>
      </>
    );
  }
  if (feature === null) {
    return (
      <>
        <DrawerHeader onClose={onClose} />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <h2 className="font-display text-lg font-semibold">Feature not found</h2>
          <p className="text-sm text-[var(--color-muted)]">It may have been deleted.</p>
        </div>
      </>
    );
  }

  return (
    <FeatureEditor
      key={feature._id}
      feature={feature}
      releases={releases}
      columns={columns}
      onClose={onClose}
    />
  );
}

function DrawerHeader({
  onClose,
  right,
}: {
  onClose: () => void;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-panel)] px-3">
      <IconButton onClick={onClose} label="Close" size="md">
        <X className="h-4 w-4" />
      </IconButton>
      <div className="flex items-center gap-2">{right}</div>
    </header>
  );
}

function FeatureEditor({
  feature,
  releases,
  columns,
  onClose,
}: {
  feature: Doc<"features">;
  releases: Doc<"releases">[];
  columns: Doc<"columns">[];
  onClose: () => void;
}) {
  const update = useMutation(api.features.update);
  const remove = useMutation(api.features.remove);

  const [name, setName] = useState(feature.name);
  const [description, setDescription] = useState(feature.description);
  const [status, setStatus] = useState(feature.status);
  const [releaseId, setReleaseId] = useState<Id<"releases"> | "">(
    feature.releaseId ?? "",
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<number | null>(feature.updatedAt);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(0);
  const stateRef = useRef({ name, description });

  useEffect(() => {
    stateRef.current = { name, description };
  }, [name, description]);

  const flush = useCallback(
    async (
      payload: Partial<{
        name: string;
        description: string;
        status: string;
        releaseId: Id<"releases"> | null;
      }>,
    ) => {
      const ticket = ++inFlight.current;
      try {
        await update({ featureId: feature._id, ...payload });
        if (ticket === inFlight.current) {
          setSaveStatus("saved");
          setLastSaved(Date.now());
        }
      } catch (err) {
        if (ticket === inFlight.current) {
          setSaveStatus("error");
          toast.error(err instanceof Error ? err.message : "Could not save");
        }
      }
    },
    [feature._id, update],
  );

  function scheduleText(nextName: string, nextDescription: string) {
    setSaveStatus("saving");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void flush({ name: nextName, description: nextDescription });
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        const { name: n, description: d } = stateRef.current;
        void flush({ name: n, description: d });
      }
    };
  }, [flush]);

  function handleStatusChange(next: string) {
    if (next === status) return;
    setStatus(next);
    setSaveStatus("saving");
    void flush({ status: next });
  }

  function handleReleaseChange(next: Id<"releases"> | "") {
    setReleaseId(next);
    setSaveStatus("saving");
    void flush({ releaseId: next === "" ? null : next });
  }

  async function handleDelete() {
    try {
      await remove({ featureId: feature._id });
      setDeleteOpen(false);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
    }
  }

  return (
    <>
      <DrawerHeader
        onClose={onClose}
        right={
          <>
            <SaveStatusPill status={saveStatus} lastSaved={lastSaved} />
            <IconButton
              onClick={() => setDeleteOpen(true)}
              label="Delete feature"
              size="md"
              className="text-[var(--color-muted)] hover:bg-[rgba(244,63,94,0.10)] hover:text-[var(--color-danger)]"
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </>
        }
      />

      <div className="flex flex-1 flex-col overflow-y-auto px-7 py-7">
        <input
          type="text"
          value={name}
          onChange={(e) => {
            const next = e.target.value;
            setName(next);
            scheduleText(next, description);
          }}
          placeholder="Feature name"
          className="w-full bg-transparent font-display text-[28px] font-semibold tracking-tight text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]/60"
          maxLength={160}
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Status"
            value={status}
            onChange={handleStatusChange}
            options={columns
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((c) => ({ value: c.key, label: c.label }))}
          />
          <SelectField
            label="Release"
            value={releaseId}
            onChange={(v) => handleReleaseChange(v as Id<"releases"> | "")}
            options={[
              { value: "", label: "Unassigned" },
              ...releases
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((r) => ({ value: r._id, label: `${r.emoji}  ${r.name}` })),
            ]}
          />
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            Description
          </label>
          <MarkdownEditor
            value={description}
            onChange={(next) => {
              setDescription(next);
              scheduleText(name, next);
            }}
            placeholder="What does this feature do? Who is it for?"
            height={420}
          />
        </div>
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this feature?"
        description={`"${name || "Untitled"}" will be removed. This can't be undone.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </>
        }
      >
        <></>
      </Modal>
    </>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[#0d0d0d] px-3 text-sm text-[var(--color-text)]",
          "transition-[border-color] hover:border-[var(--color-border-strong)]",
          "focus-visible:outline-none focus-visible:border-[var(--color-accent)]",
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b8b8b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.75rem center",
          backgroundSize: "12px",
          paddingRight: "2rem",
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[var(--color-panel-2)] text-[var(--color-text)]">
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
