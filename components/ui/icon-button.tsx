import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "ghost" | "soft" | "outline";
type Size = "sm" | "md";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  label?: string;
}

const VARIANTS: Record<Variant, string> = {
  ghost:
    "bg-transparent text-[var(--color-muted)] hover:bg-[var(--color-subtle)] hover:text-[var(--color-text)]",
  soft: "bg-[var(--color-panel-2)] text-[var(--color-text)] hover:bg-[var(--color-subtle)]",
  outline:
    "bg-[var(--color-panel-2)] border border-[var(--color-border-strong)] text-[var(--color-text)] hover:bg-[var(--color-subtle)]",
};

const SIZES: Record<Size, string> = {
  sm: "h-7 w-7",
  md: "h-8 w-8",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, variant = "ghost", size = "md", type = "button", label, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "grid place-items-center rounded-[var(--radius-sm)] transition-all duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-glow)]",
        "active:scale-[0.94]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    />
  );
});
