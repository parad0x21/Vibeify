"use client";

import { ReactElement, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, Monitor, Smartphone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioCard } from "@/components/ui/radio-card";
import { Stepper } from "@/components/ui/stepper";
import { StackPicker } from "@/components/stack-picker";
import {
  APP_TYPES,
  AppType,
  STACK_CATEGORY_LABELS,
  StackSelection,
  emptyStack,
} from "@/lib/stack-options";

const STEP_LABELS = ["Basics", "Stack", "Review"] as const;

const TYPE_ICONS: Record<AppType, ReactElement> = {
  web: <Globe className="h-5 w-5" />,
  mobile: <Smartphone className="h-5 w-5" />,
  desktop: <Monitor className="h-5 w-5" />,
};

const slideVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function SetupFlow() {
  const router = useRouter();
  const createApp = useMutation(api.apps.createApp);
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [type, setType] = useState<AppType>("web");
  const [stack, setStack] = useState<StackSelection>(emptyStack);
  const [stackSkipped, setStackSkipped] = useState(false);

  const canAdvanceFromBasics = name.trim().length > 0;

  function handleStackChange(next: StackSelection) {
    setStackSkipped(false);
    setStack(next);
  }

  function handleSkipStack() {
    setStack(emptyStack);
    setStackSkipped(true);
    setStep(2);
  }

  function handleCreate() {
    startTransition(async () => {
      try {
        const appId = await createApp({
          name: name.trim(),
          type,
          stack: stackSkipped ? undefined : stack,
        });
        router.push(`/app/${appId}/prd`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not create app";
        toast.error(message);
      }
    });
  }

  return (
    <section className="mx-auto max-w-2xl px-6 pb-20 pt-8">
      <div className="mb-10 flex justify-center">
        <Stepper steps={STEP_LABELS} current={step} />
      </div>

      <div className="card p-8 md:p-10">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div
              key="step-basics"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="space-y-8"
            >
              <header className="space-y-1.5">
                <h1 className="font-display text-2xl tracking-tight">Let&apos;s name your app</h1>
                <p className="text-sm text-[var(--color-muted)]">
                  You can rename it anytime.
                </p>
              </header>

              <div className="space-y-2">
                <label htmlFor="app-name" className="text-sm font-medium">
                  App name
                </label>
                <Input
                  id="app-name"
                  placeholder="e.g. Loom for podcasts"
                  value={name}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canAdvanceFromBasics) setStep(1);
                  }}
                  autoFocus
                />
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">App type</div>
                <div className="grid gap-3 sm:grid-cols-3" role="radiogroup">
                  {APP_TYPES.map((opt) => (
                    <RadioCard
                      key={opt.value}
                      icon={TYPE_ICONS[opt.value]}
                      title={opt.label}
                      description={opt.description}
                      selected={type === opt.value}
                      onClick={() => setType(opt.value)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setStep(1)}
                  disabled={!canAdvanceFromBasics}
                  size="lg"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          ) : null}

          {step === 1 ? (
            <motion.div
              key="step-stack"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="space-y-8"
            >
              <header className="space-y-1.5">
                <h1 className="font-display text-2xl tracking-tight">Pick your stack</h1>
                <p className="text-sm text-[var(--color-muted)]">
                  Optional — you can fill this in later or extract it from your PRD.
                </p>
              </header>

              <StackPicker value={stack} onChange={handleStackChange} />

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  Back
                </Button>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={handleSkipStack}>
                    Skip for now
                  </Button>
                  <Button onClick={() => setStep(2)} size="lg">
                    Continue
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : null}

          {step === 2 ? (
            <motion.div
              key="step-review"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="space-y-8"
            >
              <header className="space-y-1.5">
                <h1 className="font-display text-2xl tracking-tight">Looks good?</h1>
                <p className="text-sm text-[var(--color-muted)]">
                  Review and create your app workspace.
                </p>
              </header>

              <div className="space-y-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-6">
                <ReviewRow label="Name" value={name.trim() || "—"} />
                <ReviewRow
                  label="Type"
                  value={APP_TYPES.find((t) => t.value === type)?.label ?? type}
                />
                <ReviewRow
                  label="Stack"
                  value={
                    stackSkipped ? (
                      <span className="text-[var(--color-muted)]">Skipped</span>
                    ) : (
                      <StackSummary stack={stack} />
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button variant="ghost" onClick={() => setStep(1)} disabled={isPending}>
                  Back
                </Button>
                <Button onClick={handleCreate} disabled={isPending} size="lg">
                  <Sparkles className="h-4 w-4" />
                  {isPending ? "Creating…" : "Create app"}
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </div>
      <div className="max-w-[70%] text-right text-sm">{value}</div>
    </div>
  );
}

function StackSummary({ stack }: { stack: StackSelection }) {
  const lines: Array<{ label: string; value: string }> = [];
  if (stack.builder) lines.push({ label: "Builder", value: stack.builder });
  for (const cat of ["frontend", "backend", "database", "authentication", "apis"] as const) {
    if (stack[cat].length > 0) {
      lines.push({ label: STACK_CATEGORY_LABELS[cat], value: stack[cat].join(", ") });
    }
  }
  if (lines.length === 0) {
    return <span className="text-[var(--color-muted)]">Nothing selected</span>;
  }
  return (
    <div className="space-y-1.5">
      {lines.map((line) => (
        <div key={line.label} className="flex items-baseline gap-2">
          <span className="text-[11px] uppercase tracking-wide text-[var(--color-muted)]">
            {line.label}:
          </span>
          <span>{line.value}</span>
        </div>
      ))}
    </div>
  );
}
