"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "prd", label: "PRD" },
  { key: "stack", label: "Stack" },
  { key: "knowledge", label: "Knowledge" },
  { key: "features", label: "Features" },
] as const;

export function TopTabs({ appId }: { appId: string }) {
  const pathname = usePathname();
  return (
    <nav
      className="flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-soft)]"
      aria-label="App sections"
    >
      {TABS.map((tab) => {
        const href = `/app/${appId}/${tab.key}`;
        const isActive =
          pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={tab.key}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative px-4 py-1.5 text-sm font-medium transition-colors",
              "rounded-full",
              isActive
                ? "text-[var(--color-text)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-text)]",
            )}
          >
            {isActive ? (
              <motion.div
                layoutId="active-tab-pill"
                className="absolute inset-0 rounded-full bg-[var(--color-subtle)]"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            ) : null}
            <span className="relative">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
