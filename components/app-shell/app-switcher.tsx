"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Plus } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

export function AppSwitcher({ currentAppId }: { currentAppId: string }) {
  const apps = useQuery(api.apps.listMyApps);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const currentApp = apps?.find((a) => a._id === currentAppId);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-3 pr-2 text-sm font-medium",
          "transition-colors duration-150 hover:bg-[var(--color-subtle)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text)]/15 focus-visible:ring-offset-2",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="max-w-[160px] truncate">
          {currentApp?.name ?? (apps === undefined ? "…" : "Select app")}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[var(--color-muted)] transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute right-0 top-full z-40 mt-2 w-72 origin-top-right overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-pop)]"
            role="listbox"
          >
            <div className="max-h-72 overflow-y-auto p-1.5">
              {apps === undefined ? (
                <div className="px-3 py-2 text-sm text-[var(--color-muted)]">
                  Loading…
                </div>
              ) : apps.length === 0 ? (
                <div className="px-3 py-2 text-sm text-[var(--color-muted)]">
                  No apps yet
                </div>
              ) : (
                apps.map((app) => {
                  const isCurrent = app._id === currentAppId;
                  return (
                    <button
                      key={app._id}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        if (!isCurrent) router.push(`/app/${app._id}/prd`);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm transition-colors",
                        isCurrent
                          ? "bg-[var(--color-subtle)] text-[var(--color-text)]"
                          : "text-[var(--color-text)] hover:bg-[var(--color-subtle)]",
                      )}
                      role="option"
                      aria-selected={isCurrent}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{app.name}</div>
                        <div className="text-[11px] uppercase tracking-wide text-[var(--color-muted)]">
                          {app.type}
                        </div>
                      </div>
                      {isCurrent ? (
                        <Check className="h-4 w-4 shrink-0 text-[var(--color-text)]" />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
            <div className="border-t border-[var(--color-border)] p-1.5">
              <Link
                href="/new"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-subtle)]"
              >
                <Plus className="h-4 w-4" />
                Create new app
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
