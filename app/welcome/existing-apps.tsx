"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { Globe, Monitor, Smartphone } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { formatRelative } from "@/lib/utils";

const TYPE_ICONS = {
  web: Globe,
  mobile: Smartphone,
  desktop: Monitor,
} as const;

const TYPE_LABEL = {
  web: "Web app",
  mobile: "Mobile",
  desktop: "Desktop",
} as const;

export function ExistingApps() {
  const apps = useQuery(api.apps.listMyApps);

  // Hide entirely while loading or if user has none — keeps the empty
  // welcome screen clean for first-time users.
  if (apps === undefined || apps.length === 0) return null;

  return (
    <section className="mx-auto mt-16 max-w-3xl px-6">
      <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
        Or pick up where you left off
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => {
          const Icon = TYPE_ICONS[app.type];
          return (
            <Link
              key={app._id}
              href={`/app/${app._id}/prd`}
              className="card group flex flex-col items-start gap-3 p-5 transition hover:border-[var(--color-text)]/30 hover:shadow-[var(--shadow-pop)]"
            >
              <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-[var(--color-subtle)] text-[var(--color-text)] transition-colors group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-accent-fg)]">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 w-full">
                <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
                  {TYPE_LABEL[app.type]}
                </div>
                <div className="mt-0.5 truncate font-display text-base">{app.name}</div>
              </div>
              <div className="text-[11px] text-[var(--color-muted)]">
                Updated {formatRelative(app.updatedAt)}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
