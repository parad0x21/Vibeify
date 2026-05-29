"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
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
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ColumnDoc, FeatureDoc } from "./features-page-client";

interface KanbanViewProps {
  appId: Id<"apps">;
  columns: ColumnDoc[];
  features: FeatureDoc[];
  onOpenFeature: (id: Id<"features">) => void;
}

type FeaturesByStatus = Record<string, FeatureDoc[]>;

const STATUS_DOT: Record<string, string> = {
  backlog: "bg-[var(--color-muted)]",
  in_progress: "bg-[var(--color-info)]",
  testing: "bg-[var(--color-warning)]",
  complete: "bg-[var(--color-success)]",
  live: "bg-[var(--color-accent)]",
};

export function KanbanView({
  appId,
  columns,
  features,
  onOpenFeature,
}: KanbanViewProps) {
  const setColumnOrder = useMutation(api.features.setColumnOrder);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.order - b.order),
    [columns],
  );
  const columnKeys = useMemo(() => sortedColumns.map((c) => c.key), [sortedColumns]);

  const serverSig =
    columnKeys.join("|") +
    "#" +
    features
      .map((f) => `${f._id}:${f.status}:${f.columnOrder}`)
      .sort()
      .join(",");
  const [prevSig, setPrevSig] = useState(serverSig);
  const [local, setLocal] = useState<FeaturesByStatus>(() =>
    bucketFeatures(features, columnKeys),
  );
  if (serverSig !== prevSig) {
    setPrevSig(serverSig);
    setLocal(bucketFeatures(features, columnKeys));
  }

  const [activeFeature, setActiveFeature] = useState<FeatureDoc | null>(null);

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as Id<"features">;
    const found = features.find((f) => f._id === id) ?? null;
    setActiveFeature(found);
  }

  function findColumnOfFeature(featureId: string): string | null {
    for (const [status, items] of Object.entries(local)) {
      if (items.some((f) => f._id === featureId)) return status;
    }
    return null;
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    const fromStatus = findColumnOfFeature(activeId);
    if (!fromStatus) return;

    const toStatus = overId.startsWith("col:")
      ? overId.slice(4)
      : findColumnOfFeature(overId);
    if (!toStatus || toStatus === fromStatus) return;

    setLocal((prev) => {
      const next = { ...prev };
      const fromItems = (next[fromStatus] ?? []).filter((f) => f._id !== activeId);
      const toItems = [...(next[toStatus] ?? [])];
      const moved = (prev[fromStatus] ?? []).find((f) => f._id === activeId);
      if (!moved) return prev;
      const overIndex = toItems.findIndex((f) => f._id === overId);
      const insertAt = overIndex >= 0 ? overIndex : toItems.length;
      toItems.splice(insertAt, 0, { ...moved, status: toStatus });
      next[fromStatus] = fromItems;
      next[toStatus] = toItems;
      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveFeature(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const status = findColumnOfFeature(activeId);
    if (!status) return;

    let nextItems = local[status] ?? [];

    if (overId !== activeId && !overId.startsWith("col:")) {
      const overStatus = findColumnOfFeature(overId);
      if (overStatus === status) {
        const oldIndex = nextItems.findIndex((f) => f._id === activeId);
        const newIndex = nextItems.findIndex((f) => f._id === overId);
        if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
          nextItems = arrayMove(nextItems, oldIndex, newIndex);
          setLocal((prev) => ({ ...prev, [status]: nextItems }));
        }
      }
    }

    const originalByStatus = bucketFeatures(features, columnKeys);
    const columnsToPersist = new Set<string>();
    for (const col of columnKeys) {
      const before = (originalByStatus[col] ?? []).map((f) => f._id).join(",");
      const after = (col === status ? nextItems : (local[col] ?? []))
        .map((f) => f._id)
        .join(",");
      if (before !== after) columnsToPersist.add(col);
    }

    for (const col of columnsToPersist) {
      const ids = (col === status ? nextItems : local[col] ?? []).map((f) => f._id);
      setColumnOrder({ appId, status: col, orderedIds: ids }).catch((err) => {
        toast.error(err instanceof Error ? err.message : "Could not save column");
      });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:overflow-x-visible lg:pb-0">
        {sortedColumns.map((col) => (
          <div key={col.key} className="w-72 shrink-0 lg:w-auto lg:shrink">
            <Column
              column={col}
              features={local[col.key] ?? []}
              onOpenFeature={onOpenFeature}
            />
          </div>
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeFeature ? (
          <FeatureCard feature={activeFeature} dragging onOpen={() => {}} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  column,
  features,
  onOpenFeature,
}: {
  column: ColumnDoc;
  features: FeatureDoc[];
  onOpenFeature: (id: Id<"features">) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${column.key}` });
  const itemIds = useMemo(() => features.map((f) => f._id), [features]);
  const dotClass = STATUS_DOT[column.key] ?? STATUS_DOT.backlog;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[24rem] flex-col rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-panel)]/40 transition-colors duration-200",
        isOver && "border-[var(--color-accent)] bg-[color:var(--color-accent-soft)]",
      )}
    >
      <header className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2">
          <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} aria-hidden />
          <span className="text-[12px] font-semibold tracking-tight text-[var(--color-text)]">
            {column.label}
          </span>
          <Badge tone="neutral" size="sm">
            {features.length}
          </Badge>
        </div>
      </header>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 px-2 pb-3">
          {features.map((f) => (
            <SortableFeatureCard
              key={f._id}
              feature={f}
              onOpen={() => onOpenFeature(f._id)}
            />
          ))}
          {features.length === 0 ? (
            <div className="grid h-20 place-items-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] text-[11px] text-[var(--color-muted)]">
              Drop here
            </div>
          ) : null}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableFeatureCard({
  feature,
  onOpen,
}: {
  feature: FeatureDoc;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: feature._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-30" : undefined}
      {...attributes}
      {...listeners}
    >
      <FeatureCard feature={feature} onOpen={onOpen} />
    </div>
  );
}

function FeatureCard({
  feature,
  onOpen,
  dragging = false,
}: {
  feature: FeatureDoc;
  onOpen: () => void;
  dragging?: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "group relative cursor-pointer rounded-[var(--radius-md)] border bg-[var(--color-panel)] p-3 transition-all duration-150",
        dragging
          ? "cursor-grabbing scale-[1.02] border-[var(--color-accent)] shadow-[var(--shadow-3)]"
          : "border-[var(--color-border)] shadow-[var(--shadow-1)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-panel-2)]",
      )}
    >
      <h3 className="line-clamp-3 text-[13px] font-medium leading-snug text-[var(--color-text)]">
        {feature.name}
      </h3>
      {feature.description.trim().length > 0 ? (
        <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-[var(--color-muted)]">
          {feature.description.replace(/[#*`>_-]/g, "").trim()}
        </p>
      ) : null}
    </div>
  );
}

function bucketFeatures(
  features: FeatureDoc[],
  columnKeys: string[],
): FeaturesByStatus {
  const buckets: FeaturesByStatus = {};
  for (const key of columnKeys) buckets[key] = [];
  for (const f of features) {
    const key = columnKeys.includes(f.status) ? f.status : columnKeys[0] ?? "backlog";
    (buckets[key] ?? (buckets[key] = [])).push(f);
  }
  for (const key of columnKeys) {
    buckets[key].sort((a, b) => a.columnOrder - b.columnOrder);
  }
  return buckets;
}
