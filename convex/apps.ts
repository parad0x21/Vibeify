import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireAppAccess, requireUser } from "./users";

const appType = v.union(v.literal("web"), v.literal("mobile"), v.literal("desktop"));

const stackInput = v.object({
  builder: v.optional(v.string()),
  frontend: v.array(v.string()),
  backend: v.array(v.string()),
  database: v.array(v.string()),
  authentication: v.array(v.string()),
  apis: v.array(v.string()),
});

const DEFAULT_COLUMNS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "backlog", label: "Backlog" },
  { key: "in_progress", label: "In Progress" },
  { key: "testing", label: "Testing" },
  { key: "complete", label: "Complete" },
  { key: "live", label: "Live" },
];

export const listMyApps = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    return await ctx.db
      .query("apps")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .collect();
  },
});

export const getApp = query({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const app = await ctx.db.get(args.appId);
    if (!app || app.ownerId !== user._id) return null;
    return app;
  },
});

export const createApp = mutation({
  args: {
    name: v.string(),
    type: appType,
    stack: v.optional(stackInput),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const trimmed = args.name.trim();
    if (trimmed.length === 0) throw new Error("App name is required");
    if (trimmed.length > 80) throw new Error("App name is too long (max 80 chars)");

    const now = Date.now();

    const appId = await ctx.db.insert("apps", {
      ownerId: user._id,
      name: trimmed,
      type: args.type,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("prds", {
      appId,
      content: "",
      updatedAt: now,
      savingVersion: 0,
    });

    await ctx.db.insert("stacks", {
      appId,
      builder: args.stack?.builder,
      frontend: args.stack?.frontend ?? [],
      backend: args.stack?.backend ?? [],
      database: args.stack?.database ?? [],
      authentication: args.stack?.authentication ?? [],
      apis: args.stack?.apis ?? [],
      updatedAt: now,
    });

    for (let i = 0; i < DEFAULT_COLUMNS.length; i++) {
      const col = DEFAULT_COLUMNS[i];
      await ctx.db.insert("columns", {
        appId,
        key: col.key,
        label: col.label,
        order: i,
      });
    }

    return appId;
  },
});

export const renameApp = mutation({
  args: { appId: v.id("apps"), name: v.string() },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId);
    const trimmed = args.name.trim();
    if (trimmed.length === 0) throw new Error("App name is required");
    if (trimmed.length > 80) throw new Error("App name is too long (max 80 chars)");
    await ctx.db.patch(args.appId, { name: trimmed, updatedAt: Date.now() });
  },
});
