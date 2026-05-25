"use node";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { v } from "convex/values";
import { z } from "zod";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

const FeaturesSchema = z.object({
  features: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
      }),
    )
    .min(1)
    .max(20),
});

const SYSTEM_PROMPT = `You analyze a Product Requirements Document (PRD) and propose a focused list of features to build.

Return between 6 and 15 features. For each:
- \`name\`: short, action-oriented title (under 8 words). Use sentence case.
- \`description\`: 1-3 sentences in markdown. Explain what the feature does and the user-visible behavior. No fluff, no marketing language.

Skip non-feature items (compliance, infra, hiring). Prefer the most important features first. Don't include features outside the PRD's scope.`;

type ExtractedFeatures = { created: number };

export const extractFromPrd = action({
  args: { appId: v.id("apps") },
  handler: async (ctx, args): Promise<ExtractedFeatures> => {
    const app = await ctx.runQuery(api.apps.getApp, { appId: args.appId });
    if (!app) throw new Error("App not found or no access");

    const prd = await ctx.runQuery(api.prds.getPrd, { appId: args.appId });
    if (!prd || prd.content.trim().length < 20) {
      throw new Error(
        "Write a PRD first — at least a couple of paragraphs before extracting features.",
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not configured. Run: npx convex env set ANTHROPIC_API_KEY sk-ant-...",
      );
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.parse({
      model: "claude-opus-4-7",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `App name: ${app.name}\n\nPRD:\n\n${prd.content}`,
        },
      ],
      output_config: { format: zodOutputFormat(FeaturesSchema) },
    });

    if (!response.parsed_output) {
      throw new Error("Claude returned no features for this PRD.");
    }

    const created: number = await ctx.runMutation(api.features.createMany, {
      appId: args.appId,
      items: response.parsed_output.features,
    });

    return { created };
  },
});
