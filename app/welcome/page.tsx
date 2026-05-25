import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { GithubIcon } from "@/components/icons";
import { ExistingApps } from "./existing-apps";

export default function WelcomePage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <header className="flex items-center justify-between px-8 py-6">
        <Logo />
        <UserButton />
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pb-20 pt-12 text-center">
        <span className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs text-[var(--color-muted)]">
          Welcome to Vibeify
        </span>
        <h1 className="mt-6 font-display text-4xl tracking-tight md:text-5xl">
          What are we building today?
        </h1>
        <p className="mt-3 max-w-md text-[var(--color-muted)]">
          Start a brand new project or bring in an existing codebase.
        </p>

        <div className="mt-12 grid w-full gap-5 sm:grid-cols-2">
          <Link
            href="/new"
            className="group card flex flex-col items-start gap-3 p-6 text-left transition hover:shadow-[var(--shadow-pop)]"
          >
            <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-[var(--color-subtle)] text-[var(--color-text)] transition group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-accent-fg)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg">Create a new app</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Set up a PRD, stack, and feature plan from scratch.
              </p>
            </div>
          </Link>

          <div
            aria-disabled="true"
            className="card relative flex cursor-not-allowed flex-col items-start gap-3 p-6 text-left opacity-70"
          >
            <span className="absolute right-4 top-4 rounded-full bg-[var(--color-subtle)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
              Coming soon
            </span>
            <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-[var(--color-subtle)] text-[var(--color-text)]">
              <GithubIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg">Import from GitHub</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Pull an existing repo and infer your stack automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ExistingApps />
    </main>
  );
}
