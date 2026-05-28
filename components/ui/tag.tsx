import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  dotClassName?: string;
  children?: ReactNode;
}

export function Tag({ className, dotClassName, children, ...rest }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-panel-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted)]",
        className,
      )}
      {...rest}
    >
      {dotClassName ? <span className={cn("h-1.5 w-1.5 rounded-full", dotClassName)} /> : null}
      {children}
    </span>
  );
}
