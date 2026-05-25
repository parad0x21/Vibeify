import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface RadioCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: ReactNode;
  title: string;
  description?: string;
}

export const RadioCard = forwardRef<HTMLButtonElement, RadioCardProps>(function RadioCard(
  { className, selected = false, icon, title, description, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={selected}
      className={cn(
        "group flex w-full flex-col items-start gap-3 rounded-[var(--radius-lg)] border bg-[var(--color-surface)] p-5 text-left",
        "transition-all duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text)]/15 focus-visible:ring-offset-2",
        selected
          ? "border-[var(--color-text)] shadow-[var(--shadow-soft)]"
          : "border-[var(--color-border)] hover:border-[var(--color-text)]/30 hover:shadow-[var(--shadow-soft)]",
        className,
      )}
      {...rest}
    >
      {icon ? (
        <div
          className={cn(
            "grid h-10 w-10 place-items-center rounded-[10px] transition-colors",
            selected
              ? "bg-[var(--color-text)] text-[var(--color-accent-fg)]"
              : "bg-[var(--color-subtle)] text-[var(--color-text)] group-hover:bg-[var(--color-text)] group-hover:text-[var(--color-accent-fg)]",
          )}
        >
          {icon}
        </div>
      ) : null}
      <div>
        <div className="font-display text-base">{title}</div>
        {description ? (
          <div className="mt-0.5 text-xs text-[var(--color-muted)]">{description}</div>
        ) : null}
      </div>
    </button>
  );
});
