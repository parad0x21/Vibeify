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
import { Badge } from "@/components/ui/badge";
import type { FeatureDoc, ReleaseDoc } from "./features-page-client";

type Tone = "neutral" | "info" | "warning" | "success" | "accent" | "danger";

const STATUS_TONE: Record<string, Tone> = {
  backlog: "neutral",
  in_progress: "info",
  testing: "warning",
  complete: "success",
  live: "accent",
};

const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  in_progress: "In progress",
  testing: "Testing",
  complete: "Complete",
  live: "Live",
};

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

  const serverSig = releases.map((r) => `${r._id}:${r.order}`).join(",");
  const [prevSig, setPrevSig] = useState(serverSig);
  const [orderedIds, setOrderedIds] = useState<Id<"releases">[]>(() =>
    [...releases].sort((a, b) => a.order - b.order).map((r) => r._id),
  );
  if (serverSig !== prevSig) {
    setPrevSig(serverSig);
    setOrderedIds([...releases].sort((a, b) => a.order - b.order).map((r) => r._id));
  }

  const releasesById = useMemo(
    () => new Map(releases.map((r) => [r._id, r])),
    [releases],
  );

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
    <div className="space-y-4">
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
        className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-transparent py-5 text-sm font-medium text-[var(--color-muted)] transition-all duration-200 hover:border-[var(--color-accent)]/40 hover:bg-[color:var(--color-accent-soft)]/30 hover:text-[var(--color-text)]"
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: release._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-panel)] shadow-[var(--shadow-1)]",
        isDragging && "z-10 border-[var(--color-accent)] shadow-[var(--shadow-3)]",
      )}
    >
      <header className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3.5">
        <button
          type="button"
          aria-label="Drag to reorder"
          className="grid h-7 w-7 cursor-grab place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-subtle)] hover:text-[var(--color-text)] active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="grid h-8 w-8 place-items-center rounded-[var(--radius-md)] bg-[var(--color-panel-2)] text-base ring-1 ring-inset ring-[var(--color-border)]">
          {release.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-[15px] font-semibold leading-tight tracking-tight text-[var(--color-text)]">
            {release.name}
          </h2>
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
    <article className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-panel)] shadow-[var(--shadow-1)]">
      <header className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3.5">
        <div className="grid h-8 w-8 place-items-center rounded-[var(--radius-md)] bg-[var(--color-panel-2)] text-[var(--color-muted)] ring-1 ring-inset ring-[var(--color-border)]">
          <Inbox className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-display text-[15px] font-semibold leading-tight tracking-tight text-[var(--color-text)]">
            Unassigned
          </h2>
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
    <div className="grid gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-3">
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
      className="group flex flex-col items-start gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-panel-2)] p-3.5 text-left transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:bg-[var(--color-subtle)] hover:shadow-[var(--shadow-2)]"
    >
      <Badge
        tone={STATUS_TONE[feature.status] ?? "neutral"}
        size="sm"
        dot
      >
        {STATUS_LABELS[feature.status] ?? feature.status}
      </Badge>
      <div className="min-h-[2.5rem] w-full">
        <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-[var(--color-text)]">
          {feature.name}
        </h3>
      </div>
    </button>
  );
}
