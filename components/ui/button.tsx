import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary: cn(
    "text-white font-medium",
    "bg-gradient-to-b from-[var(--color-accent-from)] to-[var(--color-accent-to)]",
    "shadow-[var(--shadow-1)]",
    "hover:-translate-y-px hover:shadow-[var(--shadow-2)] hover:brightness-110",
    "active:translate-y-0 active:scale-[0.98] active:brightness-100",
    "focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-[color:var(--color-accent-glow)]",
    "disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[var(--shadow-1)] disabled:hover:brightness-100",
  ),
  secondary: cn(
    "text-[var(--color-text)]",
    "bg-[var(--color-panel-2)] border border-[var(--color-border-strong)]",
    "hover:bg-[var(--color-subtle)] hover:border-[var(--color-border-strong)]",
    "active:scale-[0.98]",
    "focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-glow)]",
  ),
  ghost: cn(
    "bg-transparent text-[var(--color-muted)]",
    "hover:bg-[var(--color-subtle)] hover:text-[var(--color-text)]",
    "active:scale-[0.98]",
    "focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-glow)]",
  ),
  destructive: cn(
    "text-white font-medium",
    "bg-[var(--color-danger)]",
    "shadow-[var(--shadow-1)]",
    "hover:-translate-y-px hover:shadow-[var(--shadow-2)] hover:brightness-110",
    "active:translate-y-0 active:scale-[0.98]",
    "focus-visible:ring-2 focus-visible:ring-[color:var(--color-danger)]",
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
