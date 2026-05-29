"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface StepperProps {
  steps: ReadonlyArray<string>;
  current: number;
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <div className="flex items-center gap-2.5">
      {steps.map((label, i) => {
        const isActive = i === current;
        const isComplete = i < current;
        return (
          <div key={label} className="flex items-center gap-2.5">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "relative grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold transition-all duration-200 ease-out",
                  isActive
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
                    : isComplete
                      ? "bg-[color:var(--color-accent-soft)] text-[var(--color-accent)] ring-1 ring-inset ring-[color:var(--color-accent-glow)]"
                      : "bg-[var(--color-panel-2)] text-[var(--color-muted)] ring-1 ring-inset ring-[var(--color-border)]",
                )}
              >
                {isComplete ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium tracking-tight",
                  isActive
                    ? "text-[var(--color-text)]"
                    : isComplete
                      ? "text-[var(--color-text)]/80"
                      : "text-[var(--color-muted)]",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 ? (
              <div className="relative h-px w-10 overflow-hidden bg-[var(--color-border)]">
                <motion.div
                  initial={false}
                  animate={{ width: isComplete ? "100%" : "0%" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute inset-y-0 left-0 bg-[var(--color-accent)]"
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
