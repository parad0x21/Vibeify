"use client";

import { useState, useTransition } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { Kanban, LayoutGrid, ListTree, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FeatureDrawer } from "./feature-drawer";
import { KanbanView } from "./kanban-view";
import { ReleaseModal } from "./release-modal";
import { ReleaseView } from "./release-view";

type View = "release" | "progress";

export function FeaturesPageClient({ appId }: { appId: string }) {
  const typedAppId = appId as Id<"apps">;
  const releases = useQuery(api.releases.list, { appId: typedAppId });
  const features = useQuery(api.features.list, { appId: typedAppId });
  const columns = useQuery(api.columns.list, { appId: typedAppId });

  const createFeature = useMutation(api.features.create);
  const extractFromPrd = useAction(api.aiFeatures.extractFromPrd);

  const [view, setView] = useState<View>("release");
  const [activeFeatureId, setActiveFeatureId] = useState<Id<"features"> | null>(
    null,
  );
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [extracting, startExtract] = useTransition();

  const isLoading =
    releases === undefined || features === undefined || columns === undefined;

  function handleNewFeature() {
    void (async () => {
      try {
        const id = await createFeature({
          appId: typedAppId,
          name: "New feature",
          description: "",
          status: "backlog",
        });
        setActiveFeatureId(id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create feature");
      }
    })();
  }

  function handleExtract() {
    startExtract(async () => {
      try {
        const result = await extractFromPrd({ appId: typedAppId });
        toast.success(`Added ${result.created} feature${result.created === 1 ? "" : "s"} to backlog`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Extraction failed");
      }
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Features</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Plan what to build, then track it across releases.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <ViewToggle view={view} onChange={setView} />
          <Button variant="secondary" size="sm" onClick={handleExtract} disabled={extracting}>
            <Sparkles className="h-4 w-4" />
            {extracting ? "Extracting…" : "Extract from PRD"}
          </Button>
          <Button size="sm" onClick={handleNewFeature}>
            <Plus className="h-4 w-4" />
            New feature
          </Button>
        </div>
      </header>

      {isLoading ? (
        <ViewSkeleton view={view} />
      ) : releases.length === 0 && features.length === 0 ? (
        <EmptyFeatures
          onExtract={handleExtract}
          onNewFeature={handleNewFeature}
          extracting={extracting}
        />
      ) : view === "release" ? (
        <ReleaseView
          appId={typedAppId}
          releases={releases}
          features={features}
          onOpenFeature={(id) => setActiveFeatureId(id)}
          onCreateRelease={() => setReleaseModalOpen(true)}
        />
      ) : (
        <KanbanView
          appId={typedAppId}
          columns={columns}
          features={features}
          onOpenFeature={(id) => setActiveFeatureId(id)}
        />
      )}

      <FeatureDrawer
        featureId={activeFeatureId}
        releases={releases ?? []}
        columns={columns ?? []}
        onClose={() => setActiveFeatureId(null)}
      />

      <ReleaseModal
        appId={typedAppId}
        open={releaseModalOpen}
        onClose={() => setReleaseModalOpen(false)}
      />
    </section>
  );
}

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Feature view"
      className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-soft)]"
    >
      <ToggleButton
        active={view === "release"}
        onClick={() => onChange("release")}
        icon={<ListTree className="h-3.5 w-3.5" />}
      >
        Releases
      </ToggleButton>
      <ToggleButton
        active={view === "progress"}
        onClick={() => onChange("progress")}
        icon={<Kanban className="h-3.5 w-3.5" />}
      >
        Progress
      </ToggleButton>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-[var(--color-subtle)] text-[var(--color-text)]"
          : "text-[var(--color-muted)] hover:text-[var(--color-text)]",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function EmptyFeatures({
  onExtract,
  onNewFeature,
  extracting,
}: {
  onExtract: () => void;
  onNewFeature: () => void;
  extracting: boolean;
}) {
  return (
    <div className="card flex flex-col items-center gap-4 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-[var(--color-subtle)]">
        <LayoutGrid className="h-6 w-6 text-[var(--color-muted)]" />
      </div>
      <div className="max-w-md">
        <h2 className="font-display text-xl">No features yet</h2>
        <p className="mt-1.5 text-sm text-[var(--color-muted)]">
          Plan what to build. Let Claude extract a starter list from your PRD,
          or add features one at a time.
        </p>
      </div>
      <div className="mt-1 flex gap-2.5">
        <Button variant="secondary" onClick={onExtract} disabled={extracting}>
          <Sparkles className="h-4 w-4" />
          {extracting ? "Extracting…" : "Extract from PRD"}
        </Button>
        <Button onClick={onNewFeature}>
          <Plus className="h-4 w-4" />
          New feature
        </Button>
      </div>
    </div>
  );
}

function ViewSkeleton({ view }: { view: View }) {
  if (view === "progress") {
    return (
      <div className="grid gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-72 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-subtle)]"
          />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-subtle)]"
        />
      ))}
    </div>
  );
}

export type FeatureDoc = Doc<"features">;
export type ReleaseDoc = Doc<"releases">;
export type ColumnDoc = Doc<"columns">;
