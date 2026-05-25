import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { SetupFlow } from "./setup-flow";

export default function NewAppPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <header className="flex items-center justify-between px-8 py-6">
        <Logo />
        <div className="flex items-center gap-3">
          <Link
            href="/welcome"
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-muted)] transition-colors hover:bg-[var(--color-subtle)] hover:text-[var(--color-text)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <UserButton />
        </div>
      </header>

      <SetupFlow />
    </main>
  );
}
