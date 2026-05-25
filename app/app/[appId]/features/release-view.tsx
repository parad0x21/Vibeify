"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation } from "convex/react";
import { GripVertical, Inbox, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import type { FeatureDoc, ReleaseDoc } from "./features-page-client";

interface ReleaseViewProps {
  appId: Id<"apps">;
  releases: ReleaseDoc[];
  features: FeatureDoc[];
  onOpenFeature: (id: Id<"features">) => void;
  onCreateRelease: () => void;
}

export function ReleaseView({
  appId,
  releases,
  features,
  onOpenFeature,
  onCreateRelease,
}: ReleaseViewProps) {
  const setReleaseOrder = useMutation(api.releases.setOrder);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Local optimistic ordering for releases. Reconcile during render when the
  // server signature changes — avoids the `set-state-in-effect` rule and matches
  // React's recommended "adjust state on prop change" pattern.
  const serverSig = releases.map((r) => `${r._id}:${r.order}`).join(",");
  const [prevSig, setPrevSig] = useState(serverSig);
  const [orderedIds, setOrderedIds] = useState<Id<"releases">[]>(() =>
    [...releases].sort((a, b) => a.order - b.order).map((r) => r._id),
  );
  if (serverSig !== prevSig) {
    setPrevSig(serverSig);
    setOrderedIds(
      [...releases].sort((a, b) => a.order - b.order).map((r) => r._id),
    );
  }

  const releasesById = useMemo(
    () => new Map(releases.map((r) => [r._id, r])),
    [releases],
  );

  // Group features by releaseId (unassigned bucket too)
  const featuresByRelease = useMemo(() => {
    const map = new Map<Id<"releases"> | "unassigned", FeatureDoc[]>();
    map.set("unassigned", []);
    for (const r of releases) map.set(r._id, []);
    for (const f of features) {
      const key = f.releaseId ?? "unassigned";
      const bucket = map.get(key) ?? [];
      bucket.push(f);
      map.set(key, bucket);
    }
    for (const [, bucket] of map) {
      bucket.sort((a, b) => a.releaseOrder - b.releaseOrder);
    }
    return map;
  }, [releases, features]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedIds.indexOf(active.id as Id<"releases">);
    const newIndex = orderedIds.indexOf(over.id as Id<"releases">);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(orderedIds, oldIndex, newIndex);
    setOrderedIds(next);
    setReleaseOrder({ appId, orderedIds: next }).catch((err) => {
      toast.error(err instanceof Error ? err.message : "Could not reorder releases");
    });
  }

  const unassigned = featuresByRelease.get("unassigned") ?? [];

  return (
    <div className="space-y-5">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
          {orderedIds.map((id) => {
            const release = releasesById.get(id);
            if (!release) return null;
            return (
              <SortableReleaseGroup
                key={id}
                release={release}
                features={featuresByRelease.get(id) ?? []}
                onOpenFeature={onOpenFeature}
              />
            );
          })}
        </SortableContext>
      </DndContext>

      <UnassignedGroup features={unassigned} onOpenFeature={onOpenFeature} />

      <button
        type="button"
        onClick={onCreateRelease}
        className="card flex w-full items-center justify-center gap-2 border-dashed py-5 text-sm font-medium text-[var(--color-muted)] transition-colors hover:border-[var(--color-text)]/30 hover:text-[var(--color-text)]"
      >
        <Plus className="h-4 w-4" />
        New release
      </button>
    </div>
  );
}

function SortableReleaseGroup({
  release,
  features,
  onOpenFeature,
}: {
  release: ReleaseDoc;
  features: FeatureDoc[];
  onOpenFeature: (id: Id<"features">) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: release._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "card relative overflow-hidden",
        isDragging && "z-10 opacity-90 shadow-[var(--shadow-pop)]",
      )}
    >
      <header className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-4">
        <button
          type="button"
          aria-label="Drag to reorder"
          className="grid h-7 w-7 cursor-grab place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted)] hover:bg-[var(--color-subtle)] active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="grid h-8 w-8 place-items-center rounded-[10px] bg-[var(--color-subtle)] text-base">
          {release.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-lg leading-tight">{release.name}</h2>
          <div className="mt-0.5 text-[11px] text-[var(--color-muted)]">
            {features.length} feature{features.length === 1 ? "" : "s"}
          </div>
        </div>
      </header>

      <FeatureGrid features={features} onOpenFeature={onOpenFeature} />
    </article>
  );
}

function UnassignedGroup({
  features,
  onOpenFeature,
}: {
  features: FeatureDoc[];
  onOpenFeature: (id: Id<"features">) => void;
}) {
  if (features.length === 0) return null;
  return (
    <article className="card overflow-hidden">
      <header className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]/50 px-5 py-4">
        <div className="grid h-8 w-8 place-items-center rounded-[10px] bg-[var(--color-subtle)] text-[var(--color-muted)]">
          <Inbox className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-display text-lg leading-tight">Unassigned</h2>
          <div className="mt-0.5 text-[11px] text-[var(--color-muted)]">
            Features without a release
          </div>
        </div>
      </header>
      <FeatureGrid features={features} onOpenFeature={onOpenFeature} />
    </article>
  );
}

function FeatureGrid({
  features,
  onOpenFeature,
}: {
  features: FeatureDoc[];
  onOpenFeature: (id: Id<"features">) => void;
}) {
  if (features.length === 0) {
    return (
      <div className="px-5 py-6 text-center text-xs text-[var(--color-muted)]">
        No features in this release yet.
      </div>
    );
  }
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((f) => (
        <FeatureCard key={f._id} feature={f} onClick={() => onOpenFeature(f._id)} />
      ))}
    </div>
  );
}

function FeatureCard({
  feature,
  onClick,
}: {
  feature: FeatureDoc;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition-all hover:border-[var(--color-text)]/30 hover:shadow-[var(--shadow-soft)]"
    >
      <StatusPill status={feature.status} />
      <div className="min-h-[2.5rem] w-full">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
          {feature.name}
        </h3>
      </div>
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONES[status] ?? STATUS_TONES.backlog;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
        tone,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  in_progress: "In progress",
  testing: "Testing",
  complete: "Complete",
  live: "Live",
};

const STATUS_TONES: Record<string, string> = {
  backlog: "bg-zinc-50 text-zinc-700 border-zinc-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-100",
  testing: "bg-amber-50 text-amber-800 border-amber-100",
  complete: "bg-emerald-50 text-emerald-800 border-emerald-100",
  live: "bg-violet-50 text-violet-800 border-violet-100",
};
