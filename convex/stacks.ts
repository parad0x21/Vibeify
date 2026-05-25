import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAppIfOwned, requireAppAccess } from "./users";

const stackInput = v.object({
  builder: v.optional(v.string()),
  frontend: v.array(v.string()),
  backend: v.array(v.string()),
  database: v.array(v.string()),
  authentication: v.array(v.string()),
  apis: v.array(v.string()),
});

export const getStack = query({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    const app = await getAppIfOwned(ctx, args.appId);
    if (!app) return null;
    return await ctx.db
      .query("stacks")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .unique();
  },
});

export const updateStack = mutation({
  args: { appId: v.id("apps"), stack: stackInput },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId);
    const existing = await ctx.db
      .query("stacks")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        builder: args.stack.builder,
        frontend: args.stack.frontend,
        backend: args.stack.backend,
        database: args.stack.database,
        authentication: args.stack.authentication,
        apis: args.stack.apis,
        updatedAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("stacks", {
      appId: args.appId,
      builder: args.stack.builder,
      frontend: args.stack.frontend,
      backend: args.stack.backend,
      database: args.stack.database,
      authentication: args.stack.authentication,
      apis: args.stack.apis,
      updatedAt: now,
    });
  },
});
