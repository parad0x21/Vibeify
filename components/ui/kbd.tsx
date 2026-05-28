import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Kbd({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-[20px] items-center justify-center rounded-[5px] border border-[var(--color-border-strong)] bg-[var(--color-panel-2)] px-1.5 font-sans text-[10px] font-medium text-[var(--color-muted)] shadow-[0_1px_0_rgba(0,0,0,0.3)]",
        className,
      )}
      {...rest}
    >
      {children}
    </kbd>
  );
}
