"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PrdEditor } from "@/components/prd-editor";
import { Skeleton } from "@/components/ui/skeleton";

export function PrdPageClient({ appId }: { appId: string }) {
  const typedAppId = appId as Id<"apps">;
  const app = useQuery(api.apps.getApp, { appId: typedAppId });
  const prd = useQuery(api.prds.getPrd, { appId: typedAppId });

  if (app === undefined || prd === undefined) {
    return <PrdSkeleton />;
  }
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
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-8 w-32 rounded" />
        </div>
        <Skeleton className="h-8 w-28 rounded-[var(--radius-md)]" />
      </div>
      <Skeleton className="h-[560px] rounded-[var(--radius-lg)]" />
    </section>
  );
}
