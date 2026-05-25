import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAppIfOwned } from "./users";

export const list = query({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    const app = await getAppIfOwned(ctx, args.appId);
    if (!app) return [];
    return await ctx.db
      .query("columns")
      .withIndex("by_app_order", (q) => q.eq("appId", args.appId))
      .collect();
  },
});
