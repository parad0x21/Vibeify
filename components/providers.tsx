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
        variables: {
          colorPrimary: "#d6ff3f",
          colorBackground: "#0b0b0b",
          colorInputBackground: "#0d0d0d",
          colorInputText: "#f5f5f3",
          colorText: "#f5f5f3",
          colorTextSecondary: "#8b8b8b",
          colorTextOnPrimaryBackground: "#050505",
          colorDanger: "#ff6868",
          colorSuccess: "#5ae38e",
          colorWarning: "#ffb84d",
          colorNeutral: "#f5f5f3",
          borderRadius: "8px",
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
        },
        elements: {
          rootBox: "w-full",
          card: "bg-[var(--color-panel)] border border-[var(--color-border)] shadow-[var(--shadow-2)] rounded-[var(--radius-xl)]",
          headerTitle: "font-display font-semibold tracking-tight text-[var(--color-text)]",
          headerSubtitle: "text-[var(--color-muted)]",
          socialButtonsBlockButton:
            "bg-[var(--color-panel-2)] border border-[var(--color-border-strong)] text-[var(--color-text)] hover:bg-[var(--color-subtle)] rounded-[var(--radius-md)] transition-colors",
          socialButtonsBlockButtonText: "font-medium",
          dividerLine: "bg-[var(--color-border)]",
          dividerText: "text-[var(--color-muted)]",
          formFieldLabel: "text-[var(--color-text)] font-medium",
          formFieldInput:
            "bg-[#0d0d0d] border border-[var(--color-border)] text-[var(--color-text)] focus:border-[var(--color-accent)] rounded-[var(--radius-md)] transition-colors",
          formFieldInputShowPasswordButton: "text-[var(--color-muted)] hover:text-[var(--color-text)]",
          formButtonPrimary:
            "bg-[var(--color-panel-2)] border border-[var(--color-border-strong)] text-[var(--color-text)] hover:border-[var(--color-accent)] hover:bg-[var(--color-subtle)] font-medium rounded-[var(--radius-md)] normal-case transition-colors",
          footerActionText: "text-[var(--color-muted)]",
          footerActionLink: "text-[var(--color-accent)] hover:brightness-125 font-medium",
          identityPreviewText: "text-[var(--color-text)]",
          identityPreviewEditButton: "text-[var(--color-accent)]",
          formFieldSuccessText: "text-[var(--color-success)]",
          formFieldErrorText: "text-[var(--color-danger)]",
          alertText: "text-[var(--color-text)]",
          userButtonPopoverCard:
            "bg-[var(--color-panel-2)] border border-[var(--color-border-strong)] shadow-[var(--shadow-3)] rounded-[var(--radius-xl)]",
          userButtonPopoverActionButton:
            "text-[var(--color-text)] hover:bg-[var(--color-subtle)]",
          userPreviewMainIdentifier: "text-[var(--color-text)]",
          userPreviewSecondaryIdentifier: "text-[var(--color-muted)]",
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "var(--color-panel-2)",
              border: "1px solid var(--color-border-strong)",
              color: "var(--color-text)",
            },
          }}
        />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
