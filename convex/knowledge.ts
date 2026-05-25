import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAppIfOwned, requireAppAccess } from "./users";

const knowledgeSource = v.union(
  v.literal("url"),
  v.literal("upload"),
  v.literal("scratch"),
  v.literal("ai_pricing"),
  v.literal("ai_market"),
  v.literal("ai_persona"),
);

const MAX_KNOWLEDGE_BYTES = 500_000;
const MAX_TITLE_LEN = 200;

export const list = query({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    const app = await getAppIfOwned(ctx, args.appId);
    if (!app) return [];
    return await ctx.db
      .query("knowledge")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { docId: v.id("knowledge") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc) return null;
    const app = await getAppIfOwned(ctx, doc.appId);
    if (!app) return null;
    return doc;
  },
});

export const create = mutation({
  args: {
    appId: v.id("apps"),
    title: v.string(),
    content: v.string(),
    source: knowledgeSource,
    sourceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId);
    if (args.content.length > MAX_KNOWLEDGE_BYTES) {
      throw new Error(`Content is too large (max ${MAX_KNOWLEDGE_BYTES} chars)`);
    }
    const title = args.title.trim().slice(0, MAX_TITLE_LEN) || "Untitled";
    const now = Date.now();
    return await ctx.db.insert("knowledge", {
      appId: args.appId,
      title,
      content: args.content,
      source: args.source,
      sourceUrl: args.sourceUrl,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    docId: v.id("knowledge"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc) throw new Error("Knowledge doc not found");
    await requireAppAccess(ctx, doc.appId);

    const patch: { title?: string; content?: string; updatedAt: number } = {
      updatedAt: Date.now(),
    };
    if (args.title !== undefined) {
      patch.title = args.title.trim().slice(0, MAX_TITLE_LEN) || "Untitled";
    }
    if (args.content !== undefined) {
      if (args.content.length > MAX_KNOWLEDGE_BYTES) {
        throw new Error(`Content is too large (max ${MAX_KNOWLEDGE_BYTES} chars)`);
      }
      patch.content = args.content;
    }
    await ctx.db.patch(args.docId, patch);
  },
});

export const remove = mutation({
  args: { docId: v.id("knowledge") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc) return;
    await requireAppAccess(ctx, doc.appId);
    await ctx.db.delete(args.docId);
  },
});
