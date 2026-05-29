"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Globe, Monitor, Smartphone, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatRelative } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

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

type AppToDelete = { id: Id<"apps">; name: string };

export function ExistingApps() {
  const apps = useQuery(api.apps.listMyApps);
  const deleteApp = useMutation(api.apps.deleteApp);
  const [pendingDelete, setPendingDelete] = useState<AppToDelete | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteApp({ appId: pendingDelete.id });
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  }

  if (apps === undefined || apps.length === 0) return null;

  return (
    <section className="relative mx-auto mt-12 max-w-3xl px-6 pb-20">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
          Or pick up where you left off
        </h2>
        <div className="h-px flex-1 bg-[var(--color-border)]" />
      </div>
      <motion.div
        initial="initial"
        animate="animate"
        variants={{
          animate: { transition: { staggerChildren: 0.04 } },
        }}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {apps.map((app) => {
          const Icon = TYPE_ICONS[app.type];
          const initials = app.name
            .split(/\s+/)
            .map((w) => w[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase();
          return (
            <motion.div
              key={app._id}
              variants={{
                initial: { opacity: 0, y: 6 },
                animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
              }}
              className="group relative"
            >
              <Link
                href={`/app/${app._id}/prd`}
                className="relative flex flex-col items-start gap-3.5 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-panel)] p-5 shadow-[var(--shadow-1)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-panel-2)] hover:shadow-[var(--shadow-2)]"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent transition-transform duration-300 group-hover:scale-x-100"
                />
                <div className="flex w-full items-center justify-between">
                  <div className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-panel-2)] text-[var(--color-text)]">
                    <span className="font-display text-[12px] font-semibold">
                      {initials || <Icon className="h-4 w-4" />}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-subtle)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)]">
                    <Icon className="h-2.5 w-2.5" />
                    {TYPE_LABEL[app.type]}
                  </span>
                </div>
                <div className="min-w-0 w-full">
                  <div className="truncate font-display text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
                    {app.name}
                  </div>
                  <div className="mt-1 text-[11px] text-[var(--color-muted)]">
                    Updated {formatRelative(app.updatedAt)}
                  </div>
                </div>
              </Link>
              <button
                type="button"
                aria-label={`Delete ${app.name}`}
                title="Delete draft"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPendingDelete({ id: app._id, name: app.name });
                }}
                className="absolute right-2 bottom-2 grid h-7 w-7 place-items-center rounded-[var(--radius-sm)] text-[var(--color-muted)] opacity-0 transition-all duration-150 ease-out hover:bg-[var(--color-subtle)] hover:text-[var(--color-danger)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-danger)] group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </motion.div>

      <Modal
        open={pendingDelete !== null}
        onClose={() => {
          if (!isDeleting) setPendingDelete(null);
        }}
        title="Delete this draft?"
        description={
          pendingDelete
            ? `“${pendingDelete.name}” and all of its PRD, stack, features, releases, knowledge and chat history will be permanently removed. This cannot be undone.`
            : undefined
        }
        footer={
          <>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setPendingDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="md"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete draft"}
            </Button>
          </>
        }
      >
        <div className="text-sm text-[var(--color-muted)]">
          You&rsquo;ll need to start a new draft from scratch if you change your mind.
        </div>
      </Modal>
    </section>
  );
}
