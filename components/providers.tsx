"use client";

import { ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Toaster } from "sonner";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          formButtonPrimary:
            "bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-[var(--color-accent-fg)] rounded-[var(--radius-md)] normal-case",
          card: "shadow-[var(--shadow-soft)] border border-[var(--color-border)] rounded-[var(--radius-xl)]",
          headerTitle: "font-display font-medium",
        },
        variables: {
          colorPrimary: "#0f1115",
          borderRadius: "12px",
          fontFamily: "var(--font-sans)",
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
        <Toaster position="bottom-right" />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
