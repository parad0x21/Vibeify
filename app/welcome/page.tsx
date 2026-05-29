"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { ArrowRight, CornerDownLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { GithubIcon } from "@/components/icons";
import { ExistingApps } from "./existing-apps";

export default function WelcomePage() {
  return (
    <main className="relative min-h-screen bg-[var(--color-bg-base)]">
      <header className="relative z-10 mx-auto flex max-w-[1280px] items-center justify-between px-6 py-5 sm:px-8">
        <Logo />
        <UserButton />
      </header>

      <Hero />

      <div className="mx-auto max-w-[1280px] px-6 sm:px-8">
        <div className="h-px w-full bg-[var(--color-border-soft)]" />
      </div>

      <ExistingApps />
    </main>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

function Hero() {
  return (
    <section className="relative mx-auto max-w-[1280px] px-6 pb-16 pt-10 sm:px-8 lg:pb-24 lg:pt-14">
      <motion.div
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.07 } } }}
        className="max-w-2xl"
      >
        <motion.div
          variants={fadeUp}
          className="text-[13px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-subtle)]"
        >
          A creative OS for builders
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="mt-5 font-display text-[clamp(2.5rem,5vw,3.75rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-balance text-[var(--color-text)]"
        >
          Build software at the speed of thought.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-5 max-w-md text-[15px] leading-[1.7] text-[var(--color-muted)]"
        >
          From rough ideas to PRD, stack, and feature roadmap — ready to build.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-8">
          <CommandBar />
        </motion.div>

        <motion.div variants={fadeUp}>
          <ImportRow />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        className="mt-20 lg:mt-28"
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
              Example preview
            </div>
            <h2 className="mt-1.5 font-display text-[20px] font-semibold tracking-tight text-[var(--color-text)]">
              A glimpse inside your workspace
            </h2>
          </div>
          <p className="max-w-sm text-[13px] leading-relaxed text-[var(--color-muted)]">
            Sample project for illustration — your real project will look like this, populated with what you describe above.
          </p>
        </div>
        <WorkspacePreview />
      </motion.div>
    </section>
  );
}

function CommandBar() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit() {
    router.push("/new");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="group relative flex items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[#0d0d0d] pl-4 pr-2 transition-colors focus-within:border-[var(--color-accent)]"
    >
      <span className="mr-3 select-none font-mono text-[15px] leading-none text-[var(--color-accent)]">
        &gt;
      </span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Describe the app you want to build…"
        aria-label="Describe the app you want to build"
        className="h-12 w-full bg-transparent text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Start building"
        className="ml-2 inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-panel-2)] px-3 text-[13px] font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-subtle)]"
      >
        Start
        <CornerDownLeft className="h-3.5 w-3.5 text-[var(--color-muted)]" />
      </button>
    </form>
  );
}

function ImportRow() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
      <Link
        href="/new"
        className="inline-flex items-center gap-1.5 font-medium text-[var(--color-text)] transition-colors hover:text-[var(--color-accent)]"
      >
        Start from scratch
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
      <span className="h-3 w-px bg-[var(--color-border-strong)]" />
      <span className="inline-flex items-center gap-1.5 text-[var(--color-text-subtle)]">
        <GithubIcon className="h-3.5 w-3.5" />
        Import from GitHub
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-subtle)]">
          · soon
        </span>
      </span>
    </div>
  );
}

const PREVIEW_TABS = ["PRD", "Stack", "Knowledge", "Features"] as const;
const PREVIEW_NAV = ["Overview", "Documents", "Roadmap", "Releases", "Settings"] as const;

function WorkspacePreview() {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-panel)] shadow-[var(--shadow-2)]">
      {/* window chrome */}
      <div className="flex h-9 items-center gap-2 border-b border-[var(--color-border-soft)] bg-[var(--color-bg-base)] px-3.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-subtle)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-subtle)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-subtle)]" />
        <span className="ml-3 text-[11px] font-medium tracking-tight text-[var(--color-text-subtle)]">
          vibeify · loom-for-podcasts
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-[5px] border border-[var(--color-border-strong)] bg-[var(--color-panel-2)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
          <span className="h-1 w-1 rounded-full bg-[var(--color-accent)]" />
          Sample
        </span>
      </div>

      <div className="flex h-[330px]">
        {/* nav rail */}
        <aside className="hidden w-44 shrink-0 flex-col border-r border-[var(--color-border-soft)] bg-[var(--color-bg-base)] p-3 sm:flex">
          <div className="flex items-center gap-2 px-1.5 pb-3">
            <span className="grid h-5 w-5 place-items-center rounded-[5px] border border-[var(--color-border-strong)] bg-[var(--color-panel-2)] text-[9px] font-semibold text-[var(--color-accent)]">
              V
            </span>
            <span className="text-[11px] font-semibold tracking-tight text-[var(--color-text)]">
              Workspace
            </span>
          </div>
          <nav className="flex flex-col gap-0.5">
            {PREVIEW_NAV.map((item, i) => (
              <span
                key={item}
                className={
                  i === 1
                    ? "rounded-[6px] bg-[var(--color-subtle)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--color-text)] ring-1 ring-inset ring-[var(--color-border-strong)]"
                    : "px-2.5 py-1.5 text-[12px] font-medium text-[var(--color-muted)]"
                }
              >
                {item}
              </span>
            ))}
          </nav>
          <div className="mt-auto flex items-center gap-2 rounded-[6px] border border-[var(--color-border-soft)] px-2.5 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            <span className="text-[11px] text-[var(--color-muted)]">Saved just now</span>
          </div>
        </aside>

        {/* content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-11 items-center gap-1 border-b border-[var(--color-border-soft)] px-3">
            <div className="flex items-center gap-0.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-panel)] p-1">
              {PREVIEW_TABS.map((tab, i) => (
                <span
                  key={tab}
                  className={
                    i === 0
                      ? "rounded-[5px] bg-[var(--color-subtle)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text)] ring-1 ring-inset ring-[var(--color-border-strong)]"
                      : "px-2.5 py-1 text-[11px] font-medium text-[var(--color-muted)]"
                  }
                >
                  {tab}
                </span>
              ))}
            </div>
          </div>

          <div className="min-w-0 flex-1 px-5 py-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
              Product requirements
            </div>
            <div className="mt-1.5 font-display text-[17px] font-semibold tracking-tight text-[var(--color-text)]">
              Loom for podcasts
            </div>
            <div className="mt-4 space-y-2.5">
              <PreviewLine w="92%" />
              <PreviewLine w="78%" />
              <PreviewLine w="85%" />
              <div className="h-2" />
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-[3px] border border-[var(--color-accent)] bg-[color:var(--color-accent-soft)]" />
                <PreviewLine w="60%" />
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-[3px] border border-[var(--color-border-strong)]" />
                <PreviewLine w="68%" />
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-[3px] border border-[var(--color-border-strong)]" />
                <PreviewLine w="52%" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewLine({ w }: { w: string }) {
  return (
    <div
      className="h-2 rounded-full bg-[var(--color-subtle)]"
      style={{ width: w }}
      aria-hidden
    />
  );
}
