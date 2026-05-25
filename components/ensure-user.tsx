"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Mirrors the signed-in Clerk user into Convex once per session.
 * Mounted once at the app root so any route can rely on a `users` row.
 */
export function EnsureUser() {
  const { isAuthenticated } = useConvexAuth();
  const { user } = useUser();
  const ensureUser = useMutation(api.users.ensureUser);
  const ran = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user || ran.current) return;
    ran.current = true;
    ensureUser({
      email: user.primaryEmailAddress?.emailAddress ?? "",
      name: user.fullName ?? undefined,
      imageUrl: user.imageUrl ?? undefined,
    }).catch(() => {
      ran.current = false;
    });
  }, [isAuthenticated, user, ensureUser]);

  return null;
}
