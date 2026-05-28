"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Logo } from "@/components/logo";
import { Tooltip } from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";
import { AiPanel } from "./ai-panel";
import { AppSwitcher } from "./app-switcher";
import { TopTabs } from "./top-tabs";

export function AppShell({ appId, children }: { appId: string; children: ReactNode }) {
  const app = useQuery(api.apps.getApp, { appId: appId as Id<"apps"> });
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[var(--color-bg-base)]">
      <AiPanel appId={appId} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-panel)]/70 px-6 backdrop-blur-xl">
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/welcome"
              className="rounded-[8px] outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-glow)]"
            >
              <Logo />
            </Link>
            <span className="hidden h-5 w-px bg-[var(--color-border)] md:block" />
            <Tooltip
              content={
                <span className="inline-flex items-center gap-1.5">
                  Toggle assistant <Kbd>⌘B</Kbd>
                </span>
              }
              side="bottom"
            >
              <span className="hidden text-[11px] font-medium tracking-tight text-[var(--color-muted)] md:inline">
                Assistant
              </span>
            </Tooltip>
          </div>

          <div className="flex flex-1 justify-center">
            <TopTabs appId={appId} />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <AppSwitcher currentAppId={appId} />
            <Tooltip content="Create new app" side="bottom">
              <Link
                href="/new"
                aria-label="Create new app"
                className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-gradient-to-b from-[var(--color-accent-from)] to-[var(--color-accent-to)] text-white shadow-[var(--shadow-1)] transition-all duration-150 hover:-translate-y-px hover:shadow-[var(--shadow-2)] hover:brightness-110 active:translate-y-0 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-glow)]"
              >
                <Plus className="h-4 w-4" />
              </Link>
            </Tooltip>
            <UserButton />
          </div>
        </header>

        <main className="relative min-w-0 flex-1">
          {app === null ? (
            <div className="grid min-h-[60vh] place-items-center px-6 text-center">
              <div className="max-w-sm">
                <h1 className="font-display text-2xl font-semibold tracking-tight">
                  App not found
                </h1>
                <p className="mt-1.5 text-sm text-[var(--color-muted)]">
                  This app may have been deleted, or you don&apos;t have access.
                </p>
                <Link
                  href="/welcome"
                  className="mt-5 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-panel-2)] px-3.5 py-2 text-sm font-medium text-[var(--color-text)] ring-1 ring-inset ring-[var(--color-border-strong)] transition-colors hover:bg-[var(--color-subtle)]"
                >
                  Back to your apps
                </Link>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}
