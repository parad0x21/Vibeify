import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAppIfOwned, requireAppAccess } from "./users";

const MAX_PRD_BYTES = 500_000; // ~500 KB — well under Convex's per-doc limit.

export const getPrd = query({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    const app = await getAppIfOwned(ctx, args.appId);
    if (!app) return null;
    return await ctx.db
      .query("prds")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .unique();
  },
});

export const savePrd = mutation({
  args: { appId: v.id("apps"), content: v.string() },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId);
    if (args.content.length > MAX_PRD_BYTES) {
      throw new Error(`PRD is too large (max ${MAX_PRD_BYTES} chars)`);
    }
    const existing = await ctx.db
      .query("prds")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        content: args.content,
        updatedAt: now,
        savingVersion: existing.savingVersion + 1,
      });
      return existing._id;
    }
    return await ctx.db.insert("prds", {
      appId: args.appId,
      content: args.content,
      updatedAt: now,
      savingVersion: 1,
    });
  },
});
