import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAppIfOwned, requireAppAccess } from "./users";

const MAX_MESSAGE_BYTES = 50_000;

export const list = query({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    const app = await getAppIfOwned(ctx, args.appId);
    if (!app) return [];
    return await ctx.db
      .query("chatMessages")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .order("asc")
      .collect();
  },
});

export const send = mutation({
  args: {
    appId: v.id("apps"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId);
    if (args.content.length > MAX_MESSAGE_BYTES) {
      throw new Error(`Message is too long (max ${MAX_MESSAGE_BYTES} chars)`);
    }
    return await ctx.db.insert("chatMessages", {
      appId: args.appId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

export const clear = mutation({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId);
    const all = await ctx.db
      .query("chatMessages")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .collect();
    for (const m of all) {
      await ctx.db.delete(m._id);
    }
  },
});
