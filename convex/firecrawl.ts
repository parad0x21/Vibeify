"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

interface FirecrawlResponse {
  success?: boolean;
  data?: {
    markdown?: string;
    metadata?: {
      title?: string;
      ogTitle?: string;
      sourceURL?: string;
    };
  };
  error?: string;
}

export const scrapeUrl = action({
  args: { appId: v.id("apps"), url: v.string() },
  handler: async (ctx, args): Promise<Id<"knowledge">> => {
    const app = await ctx.runQuery(api.apps.getApp, { appId: args.appId });
    if (!app) throw new Error("App not found or no access");

    // Validate URL
    let parsed: URL;
    try {
      parsed = new URL(args.url);
    } catch {
      throw new Error("That doesn't look like a valid URL.");
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("URL must be http or https.");
    }

    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error(
        "FIRECRAWL_API_KEY is not configured. Run: npx convex env set FIRECRAWL_API_KEY fc-...",
      );
    }

    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ url: args.url, formats: ["markdown"] }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Firecrawl returned ${response.status}: ${body.slice(0, 200) || response.statusText}`,
      );
    }

    const data = (await response.json()) as FirecrawlResponse;
    if (!data.success || !data.data?.markdown) {
      throw new Error(data.error || "Firecrawl returned no markdown for that URL.");
    }

    const meta = data.data.metadata ?? {};
    const title =
      (meta.title || meta.ogTitle || parsed.hostname).trim().slice(0, 200) ||
      parsed.hostname;

    const docId: Id<"knowledge"> = await ctx.runMutation(api.knowledge.create, {
      appId: args.appId,
      title,
      content: data.data.markdown,
      source: "url",
      sourceUrl: args.url,
    });

    return docId;
  },
});
