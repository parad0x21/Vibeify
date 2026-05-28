import {
  internalMutation,
  mutation,
  query,
  QueryCtx,
  MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
    .unique();
}

export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error("Not authenticated");
  return user;
}

/**
 * Throw unless the caller owns the given app. Returns the loaded app + user.
 */
export async function requireAppAccess(
  ctx: QueryCtx | MutationCtx,
  appId: Doc<"apps">["_id"],
): Promise<{ user: Doc<"users">; app: Doc<"apps"> }> {
  const user = await requireUser(ctx);
  const app = await ctx.db.get(appId);
  if (!app) throw new Error("App not found");
  if (app.ownerId !== user._id) throw new Error("Forbidden");
  return { user, app };
}

/**
 * Soft variant for queries — returns null instead of throwing if the caller
 * is signed out, the app is missing, or they don't own it.
 */
export async function getAppIfOwned(
  ctx: QueryCtx | MutationCtx,
  appId: Doc<"apps">["_id"],
): Promise<Doc<"apps"> | null> {
  const user = await getCurrentUser(ctx);
  if (!user) return null;
  const app = await ctx.db.get(appId);
  if (!app || app.ownerId !== user._id) return null;
  return app;
}

export const me = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const ensureUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (existing) {
      const patch: Partial<Doc<"users">> = {};
      if (args.email !== existing.email) patch.email = args.email;
      if (args.name !== existing.name) patch.name = args.name;
      if (args.imageUrl !== existing.imageUrl) patch.imageUrl = args.imageUrl;
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch);
      }
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkUserId: identity.subject,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
    });
  },
});

/**
 * Called from the Clerk webhook (`convex/http.ts`).
 * Idempotent: creates or patches the matching `users` row.
 */
export const upsertFromClerk = internalMutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
    });
  },
});

/**
 * Cascade-delete a user and everything they own.
 * Fired by the `user.deleted` Clerk webhook.
 */
export const deleteByClerkId = internalMutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();
    if (!user) return null;

    const apps = await ctx.db
      .query("apps")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    for (const app of apps) {
      await cascadeDeleteApp(ctx, app._id);
    }

    await ctx.db.delete(user._id);
    return user._id;
  },
});

export async function cascadeDeleteApp(ctx: MutationCtx, appId: Doc<"apps">["_id"]) {
  // Per-table queries because each table's index types are distinct;
  // `releases` and `columns` use the compound `by_app_order` index, queried by `appId` prefix.
  const prds = await ctx.db
    .query("prds")
    .withIndex("by_app", (q) => q.eq("appId", appId))
    .collect();
  const stacks = await ctx.db
    .query("stacks")
    .withIndex("by_app", (q) => q.eq("appId", appId))
    .collect();
  const knowledge = await ctx.db
    .query("knowledge")
    .withIndex("by_app", (q) => q.eq("appId", appId))
    .collect();
  const releases = await ctx.db
    .query("releases")
    .withIndex("by_app_order", (q) => q.eq("appId", appId))
    .collect();
  const features = await ctx.db
    .query("features")
    .withIndex("by_app", (q) => q.eq("appId", appId))
    .collect();
  const columns = await ctx.db
    .query("columns")
    .withIndex("by_app_order", (q) => q.eq("appId", appId))
    .collect();
  const chats = await ctx.db
    .query("chatMessages")
    .withIndex("by_app", (q) => q.eq("appId", appId))
    .collect();

  for (const row of [
    ...prds,
    ...stacks,
    ...knowledge,
    ...releases,
    ...features,
    ...columns,
    ...chats,
  ]) {
    await ctx.db.delete(row._id);
  }

  await ctx.db.delete(appId);
}
