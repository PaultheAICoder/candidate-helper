# Candidate Helper (AI Interview Coach)

AI-powered interview and job-coaching app (“Cindy”) with guest practice, resume/JD tailoring, audio recording, coaching reports, and daily job digests.

## Repository Layout
- `app/` Next.js routes (UI + API)
- `components/` Shared UI components
- `lib/` OpenAI, scoring, security, Supabase, email, utilities
- `supabase/` Database schema and migrations
- `specs/` Product requirements (see `001-ai-interview-coach`)
- `e2e/` Playwright tests; `__tests__` alongside code for Jest
- `public/` Assets (e.g., `public/images/cindy-avatar.svg`)

## Getting Started (Local Dev)
1) **Prereqs:** Node 20+, npm 10+, Supabase CLI, Docker (for ClamAV), OpenAI key.  
2) **Install deps:** `npm install`  
3) **Environment:** `cp .env.example .env.local` and fill values (see table below).  
4) **Start Supabase:** `supabase start` then `supabase db reset` to apply migrations/seed data.  
5) **Run dev server:** `npm run dev` (http://localhost:3000). Ensure Supabase is running for API flows.  
6) **Open app:** Test guest practice, auth flows, uploads, and job digests per `specs/001-ai-interview-coach/spec.md`.

## Environment Variables
Set in `.env.local` (local) or your deployment environment.

| Name | Purpose | Example |
| ---- | ------- | ------- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client config | http://127.0.0.1:54321 |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role for server RPC/storage | service-role-key |
| `OPENAI_API_KEY` | LLM + Whisper | sk-proj-... |
| `GRAPH_CLIENT_ID` / `GRAPH_CLIENT_SECRET` / `GRAPH_TENANT_ID` | Microsoft Graph (email option) | … |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASS` / `EMAIL_FROM` | SMTP for digests/notifications | smtp.example.com / 587 / user / pass / `"Cindy <noreply@example.com>"` |
| `CLAMAV_URL` | Virus scan uploads (optional local) | http://localhost:3310 |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` | Bot protection | … |
| `CRON_SECRET` | Protect cron routes | strong-shared-secret |
| `NEXT_PUBLIC_APP_URL` | Public origin for links/emails | https://app.example.com |
| `MONTHLY_COST_CAP_USD` / `COST_ALERT_THRESHOLD_USD` | Cost safeguards | 300 / 285 |
| `DIGEST_TOKEN_SECRET` | Signing digest confirm/unsubscribe tokens | long-random-string |

## Testing & Quality
- Unit/integration: `npm test`
- Lint: `npm run lint`
- E2E (if Playwright deps available): `npm run test:e2e`
- Formatting: `npm run format:check`

## Additional Docs
- Product spec: `specs/001-ai-interview-coach/spec.md`
- Quickstart: `specs/001-ai-interview-coach/quickstart.md`
- Deployment checklist: `docs/deployment-checklist.md`
- API overview: `docs/api-overview.md`

