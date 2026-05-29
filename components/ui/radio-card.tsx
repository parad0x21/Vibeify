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
        "group relative flex w-full flex-col items-start gap-3 overflow-hidden rounded-[var(--radius-lg)] border p-5 text-left",
        "transition-[border-color,background-color] duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--color-accent-glow)]",
        selected
          ? "border-[var(--color-accent)] bg-[var(--color-panel-2)]"
          : "border-[var(--color-border)] bg-[var(--color-panel)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-panel-2)]",
        className,
      )}
      {...rest}
    >
      {icon ? (
        <div
          className={cn(
            "relative grid h-10 w-10 place-items-center rounded-[var(--radius-md)] border transition-colors",
            selected
              ? "border-[color:var(--color-accent-glow)] bg-[color:var(--color-accent-soft)] text-[var(--color-accent)]"
              : "border-[var(--color-border)] bg-[var(--color-subtle)] text-[var(--color-muted)] group-hover:text-[var(--color-text)]",
          )}
        >
          {icon}
        </div>
      ) : null}
      <div className="relative">
        <div className="font-display text-base font-semibold tracking-tight text-[var(--color-text)]">
          {title}
        </div>
        {description ? (
          <div className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
            {description}
          </div>
        ) : null}
      </div>
    </button>
  );
});
