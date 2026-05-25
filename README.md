# Vibeify

The planning workspace for vibe coders and app builders. Track PRDs, stacks, knowledge, and features — with an AI assistant alongside.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4** with custom design tokens
- **Clerk** authentication
- **Convex.dev** for database, backend functions, and real-time sync
- **Claude API** (`claude-opus-4-7`) for AI features
- **Firecrawl API** for URL → markdown scraping
- **Polar** payments (later phase)

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Clerk

1. Create a Clerk application at https://dashboard.clerk.com
2. In **JWT Templates** create one named exactly `convex` — copy its **Issuer** URL
3. Copy your **Publishable** and **Secret** keys

### 3. Configure Convex

1. `npx convex dev` — follow prompts to create a Convex project (writes `CONVEX_DEPLOYMENT` + `NEXT_PUBLIC_CONVEX_URL` to `.env.local`)
2. Leave this running — it deploys schema/functions on save

### 4. Fill `.env.local`

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`
- `CLERK_JWT_ISSUER_DOMAIN` (the Issuer URL from step 2)
- `ANTHROPIC_API_KEY` (https://console.anthropic.com)
- `FIRECRAWL_API_KEY` (https://firecrawl.dev)

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000 — you'll be redirected to sign in.

### 6. (Optional) Wire up the Clerk → Convex webhook

This keeps the Convex `users` table in sync if a user is updated or deleted in Clerk without opening the app. The client-side `EnsureUser` component already handles create/update on sign-in, so the webhook is only required if you want server-side delete cascades and offline updates.

1. In the Clerk dashboard, go to **Configure → Webhooks** → **Add endpoint**
2. Set the endpoint URL to your Convex deployment's HTTP host:
   ```
   https://<your-deployment>.convex.site/clerk-webhook
   ```
   (Use `NEXT_PUBLIC_CONVEX_SITE_URL` from `.env.local` — same hostname, `.convex.site` not `.convex.cloud`.)
3. Subscribe to events: `user.created`, `user.updated`, `user.deleted`
4. Copy the endpoint's **Signing Secret** (starts with `whsec_`)
5. Set it on your Convex deployment:
   ```bash
   npx convex env set CLERK_WEBHOOK_SECRET whsec_...
   ```
   (Also paste into `.env.local` for parity, though only Convex needs it.)
6. Hit **Send example** from the Clerk dashboard to verify — you should see a `200` response.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server (Turbopack) |
| `npm run convex:dev` | Start Convex dev daemon |
| `npm run build` | Production build |
| `npm run typecheck` | TS type check |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Project structure

```
app/                Next.js App Router
  (auth pages)      /sign-in, /sign-up
  welcome/          Post-auth landing
  new/              3-step app setup flow (Phase 4)
  app/[appId]/      The app workspace (Phase 5+)
components/         Shared React components
convex/             Schema + server functions
lib/                Client utils
```

## Roadmap

See [project-plan.mmd](./project-plan.mmd) for the full phased build plan.
