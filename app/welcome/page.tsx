"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Lightbulb,
  ListChecks,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/logo";
import { GithubIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { ExistingApps } from "./existing-apps";

export default function WelcomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--color-bg-base)]">
      {/* Ambient hero glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px]"
        style={{
          background:
            "radial-gradient(700px 400px at 50% 0%, rgba(99,102,241,0.18), transparent 60%), radial-gradient(500px 350px at 75% 10%, rgba(139,92,246,0.12), transparent 60%)",
        }}
      />

      <header className="relative flex items-center justify-between px-8 py-5">
        <Logo />
        <UserButton />
      </header>

      <motion.section
        initial="initial"
        animate="animate"
        variants={{
          animate: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
        }}
        className="relative mx-auto flex max-w-3xl flex-col items-center px-6 pb-10 pt-16 text-center"
      >
        <motion.div variants={fadeUp}>
          <Badge tone="accent" size="md" dot>
            <span className="font-medium">Welcome to Vibeify</span>
          </Badge>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="mt-6 font-display text-4xl font-semibold tracking-tight text-balance text-[var(--color-text)] md:text-5xl"
        >
          What are we building <span className="gradient-text">today?</span>
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--color-muted)]"
        >
          Start a brand new project or bring in an existing codebase.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mt-12 grid w-full gap-4 sm:grid-cols-2"
        >
          <CreateAppCard />
          <ImportFromGithubCard />
        </motion.div>
      </motion.section>

      <IntroSummary />

      <ExistingApps />
    </main>
  );
}

function IntroSummary() {
  return (
    <section className="relative mx-auto mt-2 max-w-3xl px-6">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
          Getting started
        </h2>
        <div className="h-px flex-1 bg-[var(--color-border)]" />
      </div>
      <div className="grid gap-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 shadow-[var(--shadow-1)] sm:grid-cols-2">
        <IntroItem
          icon={Users}
          title="Who it's for"
          body="Founders, indie hackers, and PMs sketching a new app — no setup or prior tooling required."
        />
        <IntroItem
          icon={Lightbulb}
          title="Why it helps"
          body="Turns a rough idea into a clear PRD, tech stack, and feature roadmap you can actually build from."
        />
        <IntroItem
          icon={Wand2}
          title="How it works"
          body="Answer a few quick prompts and Vibeify drafts the planning docs and feature plan for you."
        />
        <IntroItem
          icon={ListChecks}
          title="Quick steps"
          body="Create an app → write the PRD → pick a stack → plan features → track releases."
        />
      </div>
    </section>
  );
}

function IntroItem({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-subtle)] text-[var(--color-muted)]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="font-display text-[13px] font-semibold tracking-tight text-[var(--color-text)]">
          {title}
        </div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-muted)]">
          {body}
        </p>
      </div>
    </div>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

function CreateAppCard() {
  return (
    <Link
      href="/new"
      className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 text-left shadow-[var(--shadow-1)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-2)]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(400px 200px at 50% 0%, rgba(99,102,241,0.10), transparent 70%)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent transition-transform duration-300 group-hover:scale-x-100"
      />
      <div className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-accent-from)] to-[var(--color-accent-to)] text-white shadow-[var(--shadow-1)]">
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30" />
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="relative">
        <h2 className="font-display text-base font-semibold tracking-tight text-[var(--color-text)]">
          Create a new app
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-muted)]">
          Set up a PRD, stack, and feature plan from scratch.
        </p>
      </div>
      <div className="relative mt-auto flex items-center gap-1 text-[12px] font-medium text-[var(--color-accent)] opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100">
        Get started <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}

function ImportFromGithubCard() {
  return (
    <Tooltip content="Coming soon" side="top">
      <div
        aria-disabled="true"
        className="relative flex cursor-not-allowed flex-col items-start gap-4 overflow-hidden rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] bg-[var(--color-panel)]/60 p-6 text-left opacity-80"
      >
        <span className="absolute right-4 top-4">
          <Badge tone="neutral" size="sm">
            Coming soon
          </Badge>
        </span>
        <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--color-subtle)] text-[var(--color-muted)]">
          <GithubIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-base font-semibold tracking-tight text-[var(--color-text)]">
            Import from GitHub
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-muted)]">
            Pull an existing repo and infer your stack automatically.
          </p>
        </div>
      </div>
    </Tooltip>
  );
}
