import { ButtonHTMLAttributes, forwardRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { className, selected = false, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-medium",
        "border transition-all duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--color-accent-glow)]",
        selected
          ? cn(
              "border-[var(--color-accent)] text-[var(--color-text)]",
              "bg-[color:var(--color-accent-soft)]",
            )
          : cn(
              "border-[var(--color-border)] bg-[var(--color-panel-2)] text-[var(--color-muted)]",
              "hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)] hover:bg-[var(--color-subtle)]",
            ),
        className,
      )}
      {...rest}
    >
      {selected ? <Check className="h-3 w-3 text-[var(--color-accent)]" /> : null}
      {children}
    </button>
  );
});
