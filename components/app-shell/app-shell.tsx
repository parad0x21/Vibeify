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
import { AiPanel } from "./ai-panel";
import { AppSwitcher } from "./app-switcher";
import { TopTabs } from "./top-tabs";

export function AppShell({ appId, children }: { appId: string; children: ReactNode }) {
  const app = useQuery(api.apps.getApp, { appId: appId as Id<"apps"> });
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <AiPanel appId={appId} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 px-6 backdrop-blur-md">
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/welcome" className="transition-opacity hover:opacity-70">
              <Logo />
            </Link>
          </div>

          <div className="flex flex-1 justify-center">
            <TopTabs appId={appId} />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <AppSwitcher currentAppId={appId} />
            <Link
              href="/new"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition-colors hover:bg-[var(--color-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text)]/15 focus-visible:ring-offset-2"
              aria-label="Create new app"
              title="Create new app"
            >
              <Plus className="h-4 w-4" />
            </Link>
            <UserButton />
          </div>
        </header>

        <main className="min-w-0 flex-1">
          {app === null ? (
            <div className="grid min-h-[60vh] place-items-center px-6 text-center">
              <div>
                <h1 className="font-display text-2xl">App not found</h1>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  This app may have been deleted, or you don&apos;t have access.
                </p>
                <Link
                  href="/welcome"
                  className="mt-4 inline-block text-sm font-medium text-[var(--color-text)] underline-offset-4 hover:underline"
                >
                  Back to your apps
                </Link>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
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
