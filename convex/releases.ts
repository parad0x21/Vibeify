import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAppIfOwned, requireAppAccess } from "./users";

const MAX_NAME_LEN = 80;
const MAX_EMOJI_LEN = 12; // grapheme clusters can be multi-codepoint

export const list = query({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    const app = await getAppIfOwned(ctx, args.appId);
    if (!app) return [];
    return await ctx.db
      .query("releases")
      .withIndex("by_app_order", (q) => q.eq("appId", args.appId))
      .collect();
  },
});

export const create = mutation({
  args: {
    appId: v.id("apps"),
    name: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId);
    const name = args.name.trim().slice(0, MAX_NAME_LEN);
    if (name.length === 0) throw new Error("Release name is required");
    const emoji = args.emoji.trim().slice(0, MAX_EMOJI_LEN) || "📦";

    const last = await ctx.db
      .query("releases")
      .withIndex("by_app_order", (q) => q.eq("appId", args.appId))
      .order("desc")
      .first();
    const nextOrder = last ? last.order + 1 : 0;

    return await ctx.db.insert("releases", {
      appId: args.appId,
      name,
      emoji,
      order: nextOrder,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    releaseId: v.id("releases"),
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const release = await ctx.db.get(args.releaseId);
    if (!release) throw new Error("Release not found");
    await requireAppAccess(ctx, release.appId);

    const patch: { name?: string; emoji?: string } = {};
    if (args.name !== undefined) {
      const name = args.name.trim().slice(0, MAX_NAME_LEN);
      if (name.length === 0) throw new Error("Release name is required");
      patch.name = name;
    }
    if (args.emoji !== undefined) {
      patch.emoji = args.emoji.trim().slice(0, MAX_EMOJI_LEN) || "📦";
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.releaseId, patch);
    }
  },
});

export const remove = mutation({
  args: { releaseId: v.id("releases") },
  handler: async (ctx, args) => {
    const release = await ctx.db.get(args.releaseId);
    if (!release) return;
    await requireAppAccess(ctx, release.appId);

    // Unassign features from this release
    const features = await ctx.db
      .query("features")
      .withIndex("by_app_release", (q) =>
        q.eq("appId", release.appId).eq("releaseId", args.releaseId),
      )
      .collect();
    for (const f of features) {
      await ctx.db.patch(f._id, { releaseId: undefined, updatedAt: Date.now() });
    }
    await ctx.db.delete(args.releaseId);
  },
});

export const setOrder = mutation({
  args: { appId: v.id("apps"), orderedIds: v.array(v.id("releases")) },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId);
    // Verify all ids belong to this app
    for (let i = 0; i < args.orderedIds.length; i++) {
      const release = await ctx.db.get(args.orderedIds[i]);
      if (!release || release.appId !== args.appId) {
        throw new Error("Release does not belong to this app");
      }
      if (release.order !== i) {
        await ctx.db.patch(args.orderedIds[i], { order: i });
      }
    }
  },
});
