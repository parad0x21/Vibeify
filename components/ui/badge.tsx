import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "accent";
type Size = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: Size;
  dot?: boolean;
  children?: ReactNode;
}

const TONES: Record<Tone, { bg: string; text: string; dot: string; ring: string }> = {
  neutral: {
    bg: "bg-[var(--color-panel-2)]",
    text: "text-[var(--color-muted)]",
    dot: "bg-[var(--color-muted)]",
    ring: "ring-[var(--color-border)]",
  },
  info: {
    bg: "bg-[rgba(34,211,238,0.10)]",
    text: "text-[var(--color-info)]",
    dot: "bg-[var(--color-info)]",
    ring: "ring-[rgba(34,211,238,0.25)]",
  },
  success: {
    bg: "bg-[rgba(16,185,129,0.10)]",
    text: "text-[var(--color-success)]",
    dot: "bg-[var(--color-success)]",
    ring: "ring-[rgba(16,185,129,0.25)]",
  },
  warning: {
    bg: "bg-[rgba(245,158,11,0.12)]",
    text: "text-[var(--color-warning)]",
    dot: "bg-[var(--color-warning)]",
    ring: "ring-[rgba(245,158,11,0.25)]",
  },
  danger: {
    bg: "bg-[rgba(244,63,94,0.10)]",
    text: "text-[var(--color-danger)]",
    dot: "bg-[var(--color-danger)]",
    ring: "ring-[rgba(244,63,94,0.25)]",
  },
  accent: {
    bg: "bg-[color:var(--color-accent-soft)]",
    text: "text-[var(--color-accent)]",
    dot: "bg-[var(--color-accent)]",
    ring: "ring-[color:var(--color-accent-glow)]",
  },
};

const SIZES: Record<Size, string> = {
  sm: "h-5 px-1.5 text-[10px] gap-1",
  md: "h-6 px-2 text-[11px] gap-1.5",
};

export function Badge({
  tone = "neutral",
  size = "md",
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  const t = TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-sm)] font-medium tracking-tight",
        "ring-1 ring-inset",
        SIZES[size],
        t.bg,
        t.text,
        t.ring,
        className,
      )}
      {...rest}
    >
      {dot ? <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} /> : null}
      {children}
    </span>
  );
}
