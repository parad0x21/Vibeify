"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function SaveStatusPill({
  status,
  lastSaved,
}: {
  status: SaveStatus;
  lastSaved: number | null;
}) {
  // Re-render once a minute so "1m ago" stays fresh.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (status === "saving") {
    return (
      <Pill tone="muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Saving…
      </Pill>
    );
  }

  if (status === "error") {
    return (
      <Pill tone="error">
        <AlertCircle className="h-3.5 w-3.5" />
        Save failed
      </Pill>
    );
  }

  return (
    <Pill tone="muted">
      <Check className="h-3.5 w-3.5" />
      {lastSaved ? `Saved ${formatRelative(lastSaved)}` : "Saved"}
    </Pill>
  );
}

function Pill({
  tone,
  children,
}: {
  tone: "muted" | "error";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]",
      )}
    >
      {children}
    </span>
  );
}
