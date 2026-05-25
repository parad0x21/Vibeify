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

## Deployment

Vibeify is built to deploy to **Vercel** (Next.js) + **Convex Cloud** (backend). The two systems each hold their own subset of secrets — read the env-var map below before clicking buttons.

### Env var ownership

| Variable | Where it lives | Notes |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Vercel | `pk_live_…` for prod |
| `CLERK_SECRET_KEY` | Vercel | `sk_live_…` for prod |
| `CLERK_JWT_ISSUER_DOMAIN` | Vercel **and** Convex | Issuer URL of the `convex` JWT template on your Clerk **production** instance |
| `CLERK_WEBHOOK_SECRET` | Convex only | Optional, only if you wire up the user-sync webhook |
| `NEXT_PUBLIC_CONVEX_URL` | Vercel | The prod URL — looks like `https://<deployment>.convex.cloud` |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Vercel | Same deployment but `.convex.site` (used for webhooks) |
| `CONVEX_DEPLOY_KEY` | Vercel (CI only) | Generated in Convex dashboard → Settings → Deploy Keys |
| `ANTHROPIC_API_KEY` | Vercel **and** Convex | Used by `/api/claude/chat` (Next) and Convex Node actions |
| `FIRECRAWL_API_KEY` | Convex only | Used by `convex/firecrawl.ts` |
| `NEXT_PUBLIC_APP_URL` | Vercel | e.g. `https://app.your-domain.com` |

### 1. Create the Clerk production instance

1. Clerk dashboard → top-left workspace switcher → **Create production instance** (or "Promote" existing dev — Clerk gives you a separate prod instance either way)
2. Configure social providers, redirect URLs (`/sign-in`, `/sign-up`, `/welcome`), and your real domain
3. Create a JWT template named exactly **`convex`** (use the Convex preset) — copy its **Issuer URL**
4. Copy the **Publishable** + **Secret** keys (`pk_live_…` / `sk_live_…`)

### 2. Deploy Convex to production

From your local checkout, with `CONVEX_DEPLOYMENT` already set for dev:

```bash
npx convex deploy
```

This creates (or updates) the `prod:` deployment for your project. Note the prod URL — it's of the form `https://<name>.convex.cloud`.

Set the Convex prod env vars (they're separate from your dev deployment):

```bash
npx convex env set --prod CLERK_JWT_ISSUER_DOMAIN https://<your-prod-issuer>
npx convex env set --prod ANTHROPIC_API_KEY sk-ant-...
npx convex env set --prod FIRECRAWL_API_KEY fc-...
# Optional:
npx convex env set --prod CLERK_WEBHOOK_SECRET whsec_...
```

In the Convex dashboard, go to **Settings → Deploy Keys** and generate a key for the prod deployment. Copy it — you'll paste it into Vercel as `CONVEX_DEPLOY_KEY`.

### 3. Vercel project

1. Push the repo to GitHub
2. Vercel dashboard → **Import Project** → select the repo
3. Framework preset: **Next.js** (auto-detected)
4. **Build command — pick one:**
   - **Option A (recommended):** `npx convex deploy --cmd 'npm run build'` — Vercel deploys Convex backend and Next.js frontend atomically on every push. Requires `CONVEX_DEPLOY_KEY` set in env vars.
   - **Option B (simpler):** leave as `npm run build`. Deploy Convex manually with `npx convex deploy` from your local machine when backend changes.
5. Add all `[vercel]` env vars from `.env.example` (Production scope; mirror to Preview if you want PR previews to work)
6. Click **Deploy**

### 4. Custom domain

Per the project plan, the app is meant to be served from a subdomain (`app.your-domain.com`).

1. Vercel project → **Settings → Domains → Add** → `app.your-domain.com`
2. Add the DNS record Vercel shows you (CNAME or ALIAS)
3. Clerk dashboard → **Domains** → add `app.your-domain.com` as an allowed origin
4. Update `NEXT_PUBLIC_APP_URL` in Vercel to match

### 5. Webhook endpoint (optional)

If you set up the Clerk → Convex user-sync webhook locally (per step 6 of the Local setup section), reconfigure it for prod:

1. Clerk **production** dashboard → **Webhooks** → Add endpoint
2. URL: `https://<your-prod-convex-deployment>.convex.site/clerk-webhook`
3. Subscribe to `user.created`, `user.updated`, `user.deleted`
4. Copy the new signing secret and run `npx convex env set --prod CLERK_WEBHOOK_SECRET whsec_...`

### 6. Post-deploy smoke test

Click through the golden path on the live URL:

1. Sign up (fresh email) → land on `/welcome`
2. Create a new app → 3-step wizard → land on PRD
3. Type in the PRD editor → verify the "Saved" pill flips after ~800ms → refresh → content persists
4. Stack tab → manually pick a few chips → "Extract from PRD" → review modal → Apply
5. Knowledge tab → "Pricing strategy" AI quick-create → doc opens → "Add knowledge → From URL" with a real URL
6. Features tab → "Extract from PRD" → drag a feature across columns in Progress view → reload → order persists
7. Open the AI panel (⌘B) → ask "What's the most important feature to build first?" → confirm it streams, references your context, and persists across reloads

### Robots & SEO

`app/robots.ts` blocks all crawlers by default — Vibeify is a private workspace, not a discoverable site. Remove the disallow rule when you're ready to go public.

## Roadmap

See [project-plan.mmd](./project-plan.mmd) for the full phased build plan.
