import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkUserId"]),

  apps: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    type: v.union(v.literal("web"), v.literal("mobile"), v.literal("desktop")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  prds: defineTable({
    appId: v.id("apps"),
    content: v.string(),
    updatedAt: v.number(),
    savingVersion: v.number(),
  }).index("by_app", ["appId"]),

  stacks: defineTable({
    appId: v.id("apps"),
    builder: v.optional(v.string()),
    frontend: v.array(v.string()),
    backend: v.array(v.string()),
    database: v.array(v.string()),
    authentication: v.array(v.string()),
    apis: v.array(v.string()),
    updatedAt: v.number(),
  }).index("by_app", ["appId"]),

  knowledge: defineTable({
    appId: v.id("apps"),
    title: v.string(),
    content: v.string(),
    source: v.union(
      v.literal("url"),
      v.literal("upload"),
      v.literal("scratch"),
      v.literal("ai_pricing"),
      v.literal("ai_market"),
      v.literal("ai_persona"),
    ),
    sourceUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_app", ["appId"]),

  releases: defineTable({
    appId: v.id("apps"),
    name: v.string(),
    emoji: v.string(),
    order: v.number(),
    createdAt: v.number(),
  }).index("by_app_order", ["appId", "order"]),

  features: defineTable({
    appId: v.id("apps"),
    releaseId: v.optional(v.id("releases")),
    name: v.string(),
    description: v.string(),
    status: v.string(),
    columnOrder: v.number(),
    releaseOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_app", ["appId"])
    .index("by_app_release", ["appId", "releaseId"])
    .index("by_app_status", ["appId", "status"]),

  columns: defineTable({
    appId: v.id("apps"),
    key: v.string(),
    label: v.string(),
    order: v.number(),
  }).index("by_app_order", ["appId", "order"]),

  chatMessages: defineTable({
    appId: v.id("apps"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_app", ["appId"]),
});
