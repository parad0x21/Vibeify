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
        "transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-glow)]",
        selected
          ? cn(
              "border-[var(--color-accent)] bg-[var(--color-panel-2)]",
              "shadow-[var(--shadow-glow)]",
            )
          : cn(
              "border-[var(--color-border)] bg-[var(--color-panel)]",
              "hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:bg-[var(--color-panel-2)] hover:shadow-[var(--shadow-2)]",
            ),
        className,
      )}
      {...rest}
    >
      {selected ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.10),transparent_60%)]"
        />
      ) : null}
      {icon ? (
        <div
          className={cn(
            "relative grid h-10 w-10 place-items-center rounded-[var(--radius-md)] transition-all",
            selected
              ? "bg-gradient-to-b from-[var(--color-accent-from)] to-[var(--color-accent-to)] text-white shadow-[var(--shadow-1)]"
              : "bg-[var(--color-subtle)] text-[var(--color-muted)] group-hover:bg-[var(--color-panel-2)] group-hover:text-[var(--color-text)]",
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
