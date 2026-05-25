import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_INTRO = `You are Vibeify Assistant, an AI helper for app builders.

The user is working on an app in their Vibeify workspace. Their PRD, tech stack, releases, features, and knowledge documents are provided below as context. Help them:
- Answer questions about their app and plan
- Suggest improvements to their PRD
- Generate or refine feature ideas
- Discuss tradeoffs in their stack
- Think through validation, pricing, and go-to-market

Rules:
- Be concise and direct. Skip preambles like "Great question!"
- Always respond in markdown.
- When something isn't in the context, ask — don't invent details.
- When suggesting changes, point at the specific section (e.g. "your PRD's Overview section…").`;

type ChatBody = {
  appId?: string;
  message?: string;
};

export async function POST(req: Request) {
  const { getToken, userId } = await auth();
  if (!userId) {
    return jsonError(401, "Unauthorized");
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError(
      500,
      "ANTHROPIC_API_KEY is not configured on the Next.js side. Add it to .env.local and restart `npm run dev`.",
    );
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return jsonError(500, "NEXT_PUBLIC_CONVEX_URL is not configured.");
  }

  const token = await getToken({ template: "convex" });
  if (!token) {
    return jsonError(401, "Missing Convex auth token");
  }

  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  const appIdRaw = body.appId;
  const userMessage = (body.message ?? "").trim();
  if (!appIdRaw || !userMessage) {
    return jsonError(400, "Missing appId or message");
  }
  if (userMessage.length > 8000) {
    return jsonError(400, "Message is too long");
  }
  const appId = appIdRaw as Id<"apps">;

  const convex = new ConvexHttpClient(convexUrl);
  convex.setAuth(token);

  // Verify ownership + fetch all context in parallel
  const app = await convex.query(api.apps.getApp, { appId });
  if (!app) {
    return jsonError(404, "App not found");
  }

  const [prd, stack, releases, features, knowledge, history] = await Promise.all([
    convex.query(api.prds.getPrd, { appId }),
    convex.query(api.stacks.getStack, { appId }),
    convex.query(api.releases.list, { appId }),
    convex.query(api.features.list, { appId }),
    convex.query(api.knowledge.list, { appId }),
    convex.query(api.chatMessages.list, { appId }),
  ]);

  const contextBlock = buildContext({ app, prd, stack, releases, features, knowledge });
  const systemPrompt = `${SYSTEM_INTRO}\n\n---\n\n${contextBlock}`;

  // Persist user message before the model call so we don't lose it on failure.
  await convex.mutation(api.chatMessages.send, {
    appId,
    role: "user",
    content: userMessage,
  });

  const claudeMessages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userMessage },
  ];

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = anthropic.messages.stream({
    model: "claude-opus-4-7",
    max_tokens: 16000,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: claudeMessages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            buffer += event.delta.text;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "delta", text: event.delta.text })}\n\n`,
              ),
            );
          }
        }
        await stream.finalMessage();
        if (buffer.trim().length > 0) {
          await convex.mutation(api.chatMessages.send, {
            appId,
            role: "assistant",
            content: buffer,
          });
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Stream failed";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", message })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const MAX_KNOWLEDGE_CHARS_EACH = 4000;
const MAX_FEATURE_DESC_CHARS = 400;

function buildContext({
  app,
  prd,
  stack,
  releases,
  features,
  knowledge,
}: {
  app: Doc<"apps">;
  prd: Doc<"prds"> | null;
  stack: Doc<"stacks"> | null;
  releases: Doc<"releases">[];
  features: Doc<"features">[];
  knowledge: Doc<"knowledge">[];
}): string {
  const parts: string[] = [];

  parts.push(`# App: ${app.name}`);
  parts.push(`Type: ${app.type}`);
  parts.push("");

  // PRD
  parts.push("## PRD");
  if (prd && prd.content.trim().length > 0) {
    parts.push(prd.content.trim());
  } else {
    parts.push("_The user hasn't written a PRD yet._");
  }
  parts.push("");

  // Stack
  parts.push("## Stack");
  if (stack) {
    const lines: string[] = [];
    if (stack.builder) lines.push(`- **Builder:** ${stack.builder}`);
    if (stack.frontend.length > 0) lines.push(`- **Frontend:** ${stack.frontend.join(", ")}`);
    if (stack.backend.length > 0) lines.push(`- **Backend:** ${stack.backend.join(", ")}`);
    if (stack.database.length > 0) lines.push(`- **Database:** ${stack.database.join(", ")}`);
    if (stack.authentication.length > 0)
      lines.push(`- **Auth:** ${stack.authentication.join(", ")}`);
    if (stack.apis.length > 0) lines.push(`- **APIs:** ${stack.apis.join(", ")}`);
    parts.push(lines.length > 0 ? lines.join("\n") : "_No stack selections yet._");
  } else {
    parts.push("_No stack defined yet._");
  }
  parts.push("");

  // Releases
  if (releases.length > 0) {
    parts.push("## Releases");
    const sortedReleases = [...releases].sort((a, b) => a.order - b.order);
    for (const r of sortedReleases) {
      const inRelease = features.filter((f) => f.releaseId === r._id);
      parts.push(`- ${r.emoji} **${r.name}** (${inRelease.length} feature${inRelease.length === 1 ? "" : "s"})`);
    }
    parts.push("");
  }

  // Features
  parts.push(`## Features (${features.length})`);
  if (features.length === 0) {
    parts.push("_No features defined yet._");
  } else {
    const byStatus: Record<string, Doc<"features">[]> = {};
    for (const f of features) {
      (byStatus[f.status] ?? (byStatus[f.status] = [])).push(f);
    }
    const order = ["backlog", "in_progress", "testing", "complete", "live"];
    for (const status of order) {
      const items = byStatus[status];
      if (!items || items.length === 0) continue;
      parts.push(`### ${labelStatus(status)} (${items.length})`);
      for (const f of items) {
        const desc = truncate(f.description.trim(), MAX_FEATURE_DESC_CHARS);
        parts.push(`- **${f.name}**${desc ? `: ${desc.replace(/\n/g, " ")}` : ""}`);
      }
    }
  }
  parts.push("");

  // Knowledge
  if (knowledge.length > 0) {
    parts.push("## Knowledge Documents");
    const sorted = [...knowledge].sort((a, b) => b.updatedAt - a.updatedAt);
    for (const k of sorted) {
      parts.push(`### ${k.title} _(${k.source})_`);
      parts.push(truncate(k.content.trim(), MAX_KNOWLEDGE_CHARS_EACH));
      parts.push("");
    }
  }

  return parts.join("\n");
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max).trimEnd()}…\n_(truncated)_`;
}

function labelStatus(key: string): string {
  switch (key) {
    case "backlog":
      return "Backlog";
    case "in_progress":
      return "In progress";
    case "testing":
      return "Testing";
    case "complete":
      return "Complete";
    case "live":
      return "Live";
    default:
      return key;
  }
}
