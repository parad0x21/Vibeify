"use node";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { v } from "convex/values";
import { z } from "zod";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

const BUILDER_OPTIONS = ["Lovable", "Bolt", "Replit", "Cursor", "Claude Code"] as const;
const FRONTEND_OPTIONS = ["React", "Next.js", "Vue", "Typescript", "Tailwind"] as const;
const BACKEND_OPTIONS = ["Convex", "Supabase", "Firebase"] as const;
const DATABASE_OPTIONS = ["Convex", "Supabase", "Firebase"] as const;
const AUTH_OPTIONS = ["Supabase", "Convex", "Clerk", "Better Auth", "WorkOS"] as const;
const API_OPTIONS = ["OpenAI", "Claude", "Google Gemini"] as const;

const StackSchema = z.object({
  builder: z.enum(BUILDER_OPTIONS).nullable(),
  frontend: z.array(z.enum(FRONTEND_OPTIONS)),
  backend: z.array(z.enum(BACKEND_OPTIONS)),
  database: z.array(z.enum(DATABASE_OPTIONS)),
  authentication: z.array(z.enum(AUTH_OPTIONS)),
  apis: z.array(z.enum(API_OPTIONS)),
});

const SYSTEM_PROMPT = `You analyze a Product Requirements Document (PRD) and extract the tech stack the author is planning to use.

Each category has a fixed allowed list. Only include a value if the PRD explicitly mentions or strongly implies it. Return an empty array for categories with no mention. \`builder\` is single-select — return null if no builder is mentioned.

Allowed values (case-sensitive):
- builder: ${BUILDER_OPTIONS.join(", ")}
- frontend: ${FRONTEND_OPTIONS.join(", ")}
- backend: ${BACKEND_OPTIONS.join(", ")}
- database: ${DATABASE_OPTIONS.join(", ")}
- authentication: ${AUTH_OPTIONS.join(", ")}
- apis: ${API_OPTIONS.join(", ")}

Be conservative. If you're not sure, leave it out — the user can add things manually.`;

type ExtractedStack = {
  builder?: string;
  frontend: string[];
  backend: string[];
  database: string[];
  authentication: string[];
  apis: string[];
};

export const extractFromPrd = action({
  args: { appId: v.id("apps") },
  handler: async (ctx, args): Promise<ExtractedStack> => {
    const app = await ctx.runQuery(api.apps.getApp, { appId: args.appId });
    if (!app) throw new Error("App not found or no access");

    const prd = await ctx.runQuery(api.prds.getPrd, { appId: args.appId });
    if (!prd || prd.content.trim().length < 20) {
      throw new Error(
        "Write a PRD first — add at least a couple of paragraphs before extracting your stack.",
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
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prd.content }],
      output_config: { format: zodOutputFormat(StackSchema) },
    });

    if (!response.parsed_output) {
      throw new Error("Claude could not extract a stack from this PRD.");
    }

    const parsed = response.parsed_output;
    return {
      builder: parsed.builder ?? undefined,
      frontend: parsed.frontend as string[],
      backend: parsed.backend as string[],
      database: parsed.database as string[],
      authentication: parsed.authentication as string[],
      apis: parsed.apis as string[],
    };
  },
});
