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
      className="relative flex items-center gap-0.5 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)]/80 p-1 shadow-[var(--shadow-1)] backdrop-blur-sm"
      aria-label="App sections"
    >
      {TABS.map((tab) => {
        const href = `/app/${appId}/${tab.key}`;
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={tab.key}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative px-3.5 py-1.5 text-[13px] font-medium tracking-tight transition-colors",
              "rounded-full",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-glow)]",
              isActive
                ? "text-[var(--color-text)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-text)]",
            )}
          >
            {isActive ? (
              <motion.span
                aria-hidden
                layoutId="active-tab-pill"
                className="absolute inset-0 rounded-full bg-[var(--color-panel-2)] shadow-[inset_0_0_0_1px_var(--color-border-strong),0_0_18px_rgba(99,102,241,0.18)]"
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
