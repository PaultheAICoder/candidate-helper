# Deployment Checklist

Use this list to promote the AI Interview Coach to a new environment (staging or production) with the required integrations and safeguards.

## Environment & Secrets
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- OpenAI: `OPENAI_API_KEY`
- Email (SMTP): `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` (verify DKIM/SPF/DMARC for the sender domain)
- reCAPTCHA: `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY`
- Microsoft Graph (if using Graph for mail): `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`, `GRAPH_TENANT_ID`
- Security & cost: `CRON_SECRET`, `MONTHLY_COST_CAP_USD`, `COST_ALERT_THRESHOLD_USD`, `DIGEST_TOKEN_SECRET`
- App URLs: `NEXT_PUBLIC_APP_URL`, plus any host-specific callback URLs set in Supabase auth settings
- Optional: `CLAMAV_URL` reachable from the app for virus scanning

## Supabase & Database
- Apply migrations: run `supabase db push` (hosted) or `supabase db reset` (local) to ensure schema from `supabase/migrations` is in place.
- Storage buckets: create private buckets `resumes` and `reports` (used for uploads and generated PDFs).
- Auth settings: configure redirect URLs for your deployment domain(s).
- Verify seed data/question bank if your environment needs it (see migrations and seeds).

## Application Services
- OpenAI: confirm billing and usage limits cover LLM + Whisper.
- Email: verify SMTP credentials with a test send; confirm TLS/ports open from hosting environment.
- ClamAV: ensure the service endpoint is reachable; decide whether to block uploads when unavailable.
- reCAPTCHA: register your deployment domain(s) and set keys.
- Cron jobs (protect with header `x-cron-secret: ${CRON_SECRET}`):
  - `POST /api/cron/send-digests` (e.g., daily 5:00 p.m. PT)
  - `POST /api/cron/curate-jobs` (e.g., hourly)
  - `POST /api/cron/enforce-cost-cap` (e.g., hourly)
  - `POST /api/cron/reset-audio-mode` (e.g., daily)

## Pre-Deploy Checks
- `npm run lint`
- `npm test` (or the subset relevant to your changes)
- `npm run build`

## Post-Deploy Smoke Tests
- Create a guest session (text mode) and complete a short run; confirm coaching report loads.
- Authenticated flow: sign in, upload resume (virus scan + PII redaction), request tailored questions, and generate coaching feedback/PDF.
- Trigger digest opt-in/confirm/unsubscribe links and ensure emails arrive.
- Hit cron routes with `x-cron-secret` from a secure runner; verify logs and outcomes (e.g., digest emails sent, cost cap enforced).
