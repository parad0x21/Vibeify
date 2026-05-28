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
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (status === "saving") {
    return (
      <Pill tone="info" dot="bg-[var(--color-info)] shadow-[0_0_8px_rgba(34,211,238,0.6)]">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving…
      </Pill>
    );
  }

  if (status === "error") {
    return (
      <Pill tone="error" dot="bg-[var(--color-danger)] shadow-[0_0_8px_rgba(244,63,94,0.6)]">
        <AlertCircle className="h-3 w-3" />
        Save failed
      </Pill>
    );
  }

  return (
    <Pill tone="success" dot="bg-[var(--color-success)] shadow-[0_0_8px_rgba(16,185,129,0.5)]">
      <Check className="h-3 w-3" />
      {lastSaved ? `Saved ${formatRelative(lastSaved)}` : "Saved"}
    </Pill>
  );
}

function Pill({
  tone,
  dot,
  children,
}: {
  tone: "info" | "error" | "success";
  dot: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-panel-2)] px-2 py-1 text-[10px] font-medium tracking-tight",
        tone === "error"
          ? "text-[var(--color-danger)]"
          : tone === "info"
            ? "text-[var(--color-info)]"
            : "text-[var(--color-muted)]",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} aria-hidden />
      {children}
    </span>
  );
}
