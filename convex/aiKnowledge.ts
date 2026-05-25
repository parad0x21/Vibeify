"use node";

import Anthropic from "@anthropic-ai/sdk";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const KIND_PROMPTS = {
  ai_pricing: {
    title: "Pricing strategy",
    system: `You are a pricing strategist. Based on the PRD provided, write a concrete, opinionated pricing strategy in markdown. Cover:

- **Pricing model** (subscription / usage-based / freemium / one-time) and why it fits this product
- **Suggested tiers** with feature differentiation
- **Price points** — specific dollar amounts with reasoning
- **Comparable products** and how this one is priced relative to them
- **Open questions** worth validating

Use ## and ### markdown headings. Be specific — avoid generic platitudes.`,
  },
  ai_market: {
    title: "Market validation",
    system: `You are a startup advisor. Based on the PRD provided, write a market validation plan in markdown. Cover:

- **Target segments** — who is this for, in order of priority?
- **Market size** — rough TAM / SAM / SOM if reasonable to estimate
- **Existing solutions** — direct competitors and what they miss
- **Validation experiments** — concrete things to test in the next 30 / 60 / 90 days
- **Key risks** that would invalidate the idea

Use ## and ### markdown headings. Be specific.`,
  },
  ai_persona: {
    title: "Customer persona",
    system: `You are a UX researcher. Based on the PRD provided, write 1–2 customer personas in markdown. For each persona include:

- **Name, role, demographic**
- **Goals and motivations**
- **Pain points** the product addresses
- **Daily workflow** context — what software/tools they already use
- **Discovery & decision path** — how they'd hear about this and what makes them try it
- **Quotes** — 1–2 verbatim things they might say about the problem

Use ## for each persona name; use ### for sub-sections. Be specific — invent plausible names and details.`,
  },
} as const;

type AiKnowledgeKind = keyof typeof KIND_PROMPTS;

export const generateFromPrd = action({
  args: {
    appId: v.id("apps"),
    kind: v.union(
      v.literal("ai_pricing"),
      v.literal("ai_market"),
      v.literal("ai_persona"),
    ),
  },
  handler: async (ctx, args): Promise<Id<"knowledge">> => {
    const app = await ctx.runQuery(api.apps.getApp, { appId: args.appId });
    if (!app) throw new Error("App not found or no access");

    const prd = await ctx.runQuery(api.prds.getPrd, { appId: args.appId });
    if (!prd || prd.content.trim().length < 20) {
      throw new Error(
        "Write a PRD first — at least a couple of paragraphs before generating knowledge.",
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not configured. Run: npx convex env set ANTHROPIC_API_KEY sk-ant-...",
      );
    }

    const kind: AiKnowledgeKind = args.kind;
    const config = KIND_PROMPTS[kind];
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 4096,
      system: config.system,
      messages: [
        {
          role: "user",
          content: `App name: ${app.name}\n\nPRD:\n\n${prd.content}`,
        },
      ],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (!text) throw new Error("Claude returned no content.");

    const docId: Id<"knowledge"> = await ctx.runMutation(api.knowledge.create, {
      appId: args.appId,
      title: config.title,
      content: text,
      source: kind,
    });

    return docId;
  },
});
