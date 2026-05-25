"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PrdEditor } from "@/components/prd-editor";

export function PrdPageClient({ appId }: { appId: string }) {
  const typedAppId = appId as Id<"apps">;
  const app = useQuery(api.apps.getApp, { appId: typedAppId });
  const prd = useQuery(api.prds.getPrd, { appId: typedAppId });

  if (app === undefined || prd === undefined) {
    return <PrdSkeleton />;
  }
  // Shell handles app-not-found; bail if PRD row is somehow missing too.
  if (!app || !prd) return null;

  return (
    <PrdEditor
      key={prd._id}
      appId={typedAppId}
      appName={app.name}
      initialContent={prd.content}
      initialUpdatedAt={prd.updatedAt}
    />
  );
}

function PrdSkeleton() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-20 animate-pulse rounded bg-[var(--color-subtle)]" />
          <div className="h-8 w-32 animate-pulse rounded bg-[var(--color-subtle)]" />
        </div>
        <div className="h-8 w-28 animate-pulse rounded-full bg-[var(--color-subtle)]" />
      </div>
      <div className="h-[560px] animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-subtle)]" />
    </section>
  );
}
