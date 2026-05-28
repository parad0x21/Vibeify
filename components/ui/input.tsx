import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3.5 text-sm text-[var(--color-text)]",
          "placeholder:text-[var(--color-muted)]",
          "transition-[border-color,box-shadow,background-color] duration-150 ease-out",
          "hover:border-[var(--color-border-strong)]",
          "focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-glow)]",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...rest}
      />
    );
  },
);
