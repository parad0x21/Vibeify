import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAppIfOwned, requireAppAccess } from "./users";

const MAX_NAME_LEN = 160;
const MAX_DESC_BYTES = 50_000;

const optionalReleaseId = v.optional(v.union(v.id("releases"), v.null()));

export const list = query({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    const app = await getAppIfOwned(ctx, args.appId);
    if (!app) return [];
    return await ctx.db
      .query("features")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .collect();
  },
});

export const get = query({
  args: { featureId: v.id("features") },
  handler: async (ctx, args) => {
    const feature = await ctx.db.get(args.featureId);
    if (!feature) return null;
    const app = await getAppIfOwned(ctx, feature.appId);
    if (!app) return null;
    return feature;
  },
});

export const create = mutation({
  args: {
    appId: v.id("apps"),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    releaseId: v.optional(v.id("releases")),
  },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId);
    const name = args.name.trim().slice(0, MAX_NAME_LEN);
    if (name.length === 0) throw new Error("Feature name is required");

    const description = (args.description ?? "").slice(0, MAX_DESC_BYTES);
    const status = args.status ?? "backlog";

    // Next position in target column
    const lastInColumn = await ctx.db
      .query("features")
      .withIndex("by_app_status", (q) =>
        q.eq("appId", args.appId).eq("status", status),
      )
      .order("desc")
      .first();
    const columnOrder = lastInColumn ? lastInColumn.columnOrder + 1 : 0;

    // Next position in release (if assigned)
    let releaseOrder = 0;
    if (args.releaseId) {
      const lastInRelease = await ctx.db
        .query("features")
        .withIndex("by_app_release", (q) =>
          q.eq("appId", args.appId).eq("releaseId", args.releaseId),
        )
        .order("desc")
        .first();
      releaseOrder = lastInRelease ? lastInRelease.releaseOrder + 1 : 0;
    }

    const now = Date.now();
    return await ctx.db.insert("features", {
      appId: args.appId,
      releaseId: args.releaseId,
      name,
      description,
      status,
      columnOrder,
      releaseOrder,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    featureId: v.id("features"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    releaseId: optionalReleaseId,
  },
  handler: async (ctx, args) => {
    const feature = await ctx.db.get(args.featureId);
    if (!feature) throw new Error("Feature not found");
    await requireAppAccess(ctx, feature.appId);

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) {
      const name = args.name.trim().slice(0, MAX_NAME_LEN);
      if (name.length === 0) throw new Error("Feature name is required");
      patch.name = name;
    }
    if (args.description !== undefined) {
      if (args.description.length > MAX_DESC_BYTES) {
        throw new Error("Description is too large");
      }
      patch.description = args.description;
    }
    if (args.status !== undefined && args.status !== feature.status) {
      patch.status = args.status;
      // Position at end of new column
      const lastInColumn = await ctx.db
        .query("features")
        .withIndex("by_app_status", (q) =>
          q.eq("appId", feature.appId).eq("status", args.status as string),
        )
        .order("desc")
        .first();
      patch.columnOrder = lastInColumn ? lastInColumn.columnOrder + 1 : 0;
    }
    if (args.releaseId !== undefined) {
      // null → unassign
      if (args.releaseId === null) {
        patch.releaseId = undefined;
      } else {
        const targetReleaseId = args.releaseId;
        patch.releaseId = targetReleaseId;
        const lastInRelease = await ctx.db
          .query("features")
          .withIndex("by_app_release", (q) =>
            q.eq("appId", feature.appId).eq("releaseId", targetReleaseId),
          )
          .order("desc")
          .first();
        patch.releaseOrder = lastInRelease ? lastInRelease.releaseOrder + 1 : 0;
      }
    }
    await ctx.db.patch(args.featureId, patch);
  },
});

export const remove = mutation({
  args: { featureId: v.id("features") },
  handler: async (ctx, args) => {
    const feature = await ctx.db.get(args.featureId);
    if (!feature) return;
    await requireAppAccess(ctx, feature.appId);
    await ctx.db.delete(args.featureId);
  },
});

/**
 * Drag-and-drop persistence for the kanban view. Sets `status` + `columnOrder`
 * for every feature in the target column to match the supplied order.
 */
export const setColumnOrder = mutation({
  args: {
    appId: v.id("apps"),
    status: v.string(),
    orderedIds: v.array(v.id("features")),
  },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId);
    const now = Date.now();
    for (let i = 0; i < args.orderedIds.length; i++) {
      const feature = await ctx.db.get(args.orderedIds[i]);
      if (!feature || feature.appId !== args.appId) continue;
      await ctx.db.patch(args.orderedIds[i], {
        status: args.status,
        columnOrder: i,
        updatedAt: now,
      });
    }
  },
});

/**
 * Bulk insert (used by the AI extract action).
 */
export const createMany = mutation({
  args: {
    appId: v.id("apps"),
    items: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await requireAppAccess(ctx, args.appId);
    const now = Date.now();
    const status = "backlog";
    const last = await ctx.db
      .query("features")
      .withIndex("by_app_status", (q) =>
        q.eq("appId", args.appId).eq("status", status),
      )
      .order("desc")
      .first();
    let nextOrder = last ? last.columnOrder + 1 : 0;
    const ids: string[] = [];
    for (const item of args.items) {
      const name = item.name.trim().slice(0, MAX_NAME_LEN);
      if (name.length === 0) continue;
      const id = await ctx.db.insert("features", {
        appId: args.appId,
        name,
        description: item.description.slice(0, MAX_DESC_BYTES),
        status,
        columnOrder: nextOrder++,
        releaseOrder: 0,
        createdAt: now,
        updatedAt: now,
      });
      ids.push(id);
    }
    return ids.length;
  },
});
