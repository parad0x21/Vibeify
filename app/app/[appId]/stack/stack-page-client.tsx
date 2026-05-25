"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { SaveStatus, SaveStatusPill } from "@/components/save-status-pill";
import { StackPicker } from "@/components/stack-picker";
import { StackSelection } from "@/lib/stack-options";

const AUTOSAVE_DEBOUNCE_MS = 600;

type StackDiff = {
  builder: string | null;
  frontend: string[];
  backend: string[];
  database: string[];
  authentication: string[];
  apis: string[];
};

export function StackPageClient({ appId }: { appId: string }) {
  const typedAppId = appId as Id<"apps">;
  const app = useQuery(api.apps.getApp, { appId: typedAppId });
  const stack = useQuery(api.stacks.getStack, { appId: typedAppId });

  if (app === undefined || stack === undefined) return <StackSkeleton />;
  if (!app || !stack) return null;

  const initial: StackSelection = {
    builder: stack.builder,
    frontend: stack.frontend,
    backend: stack.backend,
    database: stack.database,
    authentication: stack.authentication,
    apis: stack.apis,
  };

  return (
    <StackEditor
      key={stack._id}
      appId={typedAppId}
      appName={app.name}
      initialStack={initial}
      initialUpdatedAt={stack.updatedAt}
    />
  );
}

function StackEditor({
  appId,
  appName,
  initialStack,
  initialUpdatedAt,
}: {
  appId: Id<"apps">;
  appName: string;
  initialStack: StackSelection;
  initialUpdatedAt: number;
}) {
  const updateStack = useMutation(api.stacks.updateStack);
  const extractStack = useAction(api.aiStack.extractFromPrd);

  const [draft, setDraft] = useState<StackSelection>(initialStack);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<number | null>(initialUpdatedAt);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(0);
  const draftRef = useRef(draft);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const [suggestion, setSuggestion] = useState<StackSelection | null>(null);
  const [isExtracting, startExtract] = useTransition();

  function scheduleSave(next: StackSelection) {
    setDraft(next);
    setStatus("saving");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const ticket = ++inFlight.current;
      try {
        await updateStack({ appId, stack: toServerInput(next) });
        if (ticket === inFlight.current) {
          setStatus("saved");
          setLastSaved(Date.now());
        }
      } catch {
        if (ticket === inFlight.current) setStatus("error");
      }
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  function handleExtract() {
    startExtract(async () => {
      try {
        const suggested = await extractStack({ appId });
        setSuggestion(suggested);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not extract stack from PRD";
        toast.error(message);
      }
    });
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
            {appName}
          </div>
          <h1 className="mt-1 font-display text-3xl tracking-tight">Stack</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <SaveStatusPill status={status} lastSaved={lastSaved} />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExtract}
            disabled={isExtracting}
          >
            <Sparkles className="h-4 w-4" />
            {isExtracting ? "Extracting…" : "Extract from PRD"}
          </Button>
        </div>
      </header>

      <div className="card p-7">
        <StackPicker value={draft} onChange={scheduleSave} />
      </div>

      <ExtractModal
        suggestion={suggestion}
        current={draft}
        onCancel={() => setSuggestion(null)}
        onApply={(merged) => {
          setSuggestion(null);
          scheduleSave(merged);
        }}
      />
    </section>
  );
}

function ExtractModal({
  suggestion,
  current,
  onCancel,
  onApply,
}: {
  suggestion: StackSelection | null;
  current: StackSelection;
  onCancel: () => void;
  onApply: (merged: StackSelection) => void;
}) {
  const diff = useMemo<StackDiff | null>(
    () => (suggestion ? computeDiff(current, suggestion) : null),
    [suggestion, current],
  );

  const isEmpty =
    !diff ||
    (!diff.builder &&
      diff.frontend.length === 0 &&
      diff.backend.length === 0 &&
      diff.database.length === 0 &&
      diff.authentication.length === 0 &&
      diff.apis.length === 0);

  return (
    <Modal
      open={suggestion !== null}
      onClose={onCancel}
      title="Suggested from your PRD"
      description={
        isEmpty
          ? "Claude couldn't find anything new to add — your stack already matches the PRD."
          : "Review the suggestions below. Existing selections are kept; nothing is removed."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() => suggestion && onApply(mergeStacks(current, suggestion))}
            disabled={isEmpty}
          >
            <Sparkles className="h-4 w-4" />
            Apply
          </Button>
        </>
      }
    >
      {diff && !isEmpty ? <DiffBody diff={diff} /> : null}
    </Modal>
  );
}

function DiffBody({ diff }: { diff: StackDiff }) {
  return (
    <div className="space-y-4">
      {diff.builder ? <DiffRow label="Builder" items={[diff.builder]} /> : null}
      {diff.frontend.length > 0 ? <DiffRow label="Frontend" items={diff.frontend} /> : null}
      {diff.backend.length > 0 ? <DiffRow label="Backend" items={diff.backend} /> : null}
      {diff.database.length > 0 ? <DiffRow label="Database" items={diff.database} /> : null}
      {diff.authentication.length > 0 ? (
        <DiffRow label="Authentication" items={diff.authentication} />
      ) : null}
      {diff.apis.length > 0 ? <DiffRow label="APIs" items={diff.apis} /> : null}
    </div>
  );
}

function DiffRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900"
          >
            + {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function StackSkeleton() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-20 animate-pulse rounded bg-[var(--color-subtle)]" />
          <div className="h-8 w-32 animate-pulse rounded bg-[var(--color-subtle)]" />
        </div>
        <div className="h-8 w-32 animate-pulse rounded-full bg-[var(--color-subtle)]" />
      </div>
      <div className="card space-y-8 p-7">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2.5">
            <div className="h-4 w-24 animate-pulse rounded bg-[var(--color-subtle)]" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div
                  key={j}
                  className="h-8 w-20 animate-pulse rounded-full bg-[var(--color-subtle)]"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function toServerInput(stack: StackSelection) {
  return {
    builder: stack.builder,
    frontend: stack.frontend,
    backend: stack.backend,
    database: stack.database,
    authentication: stack.authentication,
    apis: stack.apis,
  };
}

/**
 * Additions-only diff: never proposes removing anything the user already has.
 * Builder is single-select, so we only propose a builder when the user hasn't
 * set one — never overwrite a manual choice.
 */
function computeDiff(current: StackSelection, suggested: StackSelection): StackDiff {
  return {
    builder: !current.builder && suggested.builder ? suggested.builder : null,
    frontend: suggested.frontend.filter((v) => !current.frontend.includes(v)),
    backend: suggested.backend.filter((v) => !current.backend.includes(v)),
    database: suggested.database.filter((v) => !current.database.includes(v)),
    authentication: suggested.authentication.filter(
      (v) => !current.authentication.includes(v),
    ),
    apis: suggested.apis.filter((v) => !current.apis.includes(v)),
  };
}

function mergeStacks(
  current: StackSelection,
  suggested: StackSelection,
): StackSelection {
  return {
    builder: current.builder ?? suggested.builder,
    frontend: union(current.frontend, suggested.frontend),
    backend: union(current.backend, suggested.backend),
    database: union(current.database, suggested.database),
    authentication: union(current.authentication, suggested.authentication),
    apis: union(current.apis, suggested.apis),
  };
}

function union(a: string[], b: string[]): string[] {
  return Array.from(new Set([...a, ...b]));
}
