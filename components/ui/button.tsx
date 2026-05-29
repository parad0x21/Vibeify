import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  // Matte surface, subtle border, accent only on hover/focus border.
  primary: cn(
    "text-[var(--color-text)] font-medium",
    "bg-[var(--color-panel-2)] border border-[var(--color-border-strong)]",
    "hover:border-[var(--color-accent)] hover:bg-[var(--color-subtle)]",
    "active:scale-[0.98]",
    "focus-visible:border-[var(--color-accent)] focus-visible:ring-1 focus-visible:ring-[color:var(--color-accent-glow)]",
    "disabled:opacity-50 disabled:hover:border-[var(--color-border-strong)] disabled:hover:bg-[var(--color-panel-2)]",
  ),
  secondary: cn(
    "text-[var(--color-muted)]",
    "bg-transparent border border-[var(--color-border)]",
    "hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)] hover:bg-[var(--color-subtle)]",
    "active:scale-[0.98]",
    "focus-visible:ring-1 focus-visible:ring-[color:var(--color-accent-glow)]",
  ),
  ghost: cn(
    "bg-transparent text-[var(--color-muted)]",
    "hover:bg-[var(--color-subtle)] hover:text-[var(--color-text)]",
    "active:scale-[0.98]",
    "focus-visible:ring-1 focus-visible:ring-[color:var(--color-accent-glow)]",
  ),
  // Danger: thin red border only.
  destructive: cn(
    "text-[var(--color-danger)] font-medium",
    "bg-transparent border border-[color:color-mix(in_srgb,var(--color-danger)_40%,transparent)]",
    "hover:border-[var(--color-danger)] hover:bg-[color:color-mix(in_srgb,var(--color-danger)_10%,transparent)]",
    "active:scale-[0.98]",
    "focus-visible:ring-1 focus-visible:ring-[color:var(--color-danger)]",
  ),
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium",
        "transition-[transform,box-shadow,background-color,color,filter] duration-150 ease-out",
        "focus-visible:outline-none",
        "disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    />
  );
});
