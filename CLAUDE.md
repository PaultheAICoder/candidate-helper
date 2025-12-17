# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Cindy from Cinder** is a free AI interview and application coach that helps job seekers practice tailored interview questions, receive supportive coaching, and (for registered users) get daily job digest emails. This is a spec-driven development project using GitHub's spec-kit methodology.

**Tech Stack**: Next.js 14 (App Router), TypeScript 5, Supabase (PostgreSQL + Auth + Storage), OpenAI (GPT-4o + Whisper STT + TTS), Microsoft Graph (email), Radix UI + TailwindCSS

**Target**: teamcinder.com/coach

## Constitutional Principles

All code changes MUST comply with these five core principles (see `.specify/memory/constitution.md`):

### 1. Accessibility-First

- WCAG 2.2 AA conformance is MANDATORY
- Text-only fallback required for all features
- Use Radix UI primitives for ARIA compliance
- Support Low-Anxiety Mode (gentler UI, no scores)
- Keyboard navigation and screen reader compatibility

### 2. Ethical AI & Data Privacy

- AI MUST NOT fabricate facts or invent experiences
- Audio recordings NEVER stored (transcripts only)
- Strip SSN/DOB from resumes, keep location for ATS
- One-click data export/delete required
- Plain-English consent before uploads

### 3. Performance & Cost Control

- TTS ≤700ms, ASR ≤300ms, coaching ≤3s, report ≤10s
- Monthly OpenAI budget cap: $300
- Gracefully degrade to text-only when approaching cap
- Track costs in `cost_tracking` table after each API call
- Session limits: 2/day/user, 10 questions OR 30 minutes max

### 4. Progressive Enhancement

- Guest mode: text-only, generic questions, no auth required
- Registered mode: resume upload, audio recording, tailored questions, job digest
- Never hard-gate core coaching value

### 5. User Safety & Consent

- Eligibility: 18+, U.S.-based (MVP scope)
- Virus scan all uploads (ClamAV on Railway)
- reCAPTCHA on forms, rate limiting per IP/account
- Double opt-in for email digest
- Audit logs for all admin actions

## Spec-Kit Workflow

This project uses spec-driven development. All feature work follows this sequence:

```bash
/speckit.constitution  # Define/update project principles (one-time)
/speckit.specify       # Create feature spec from requirements
/speckit.plan          # Generate technical implementation plan
/speckit.tasks         # Generate dependency-ordered task list
# Then implement tasks from tasks.md
```

**Current Feature**: `001-ai-interview-coach` in `specs/001-ai-interview-coach/`

Key documents:

- `spec.md` - 6 user stories (US1-US6), functional requirements, success criteria
- `plan.md` - Technical architecture, constitution check, project structure
- `data-model.md` - Database schema (10 core entities + 3 supporting tables)
- `tasks.md` - 180 implementation tasks organized by user story
- `contracts/rest-api.yaml` - OpenAPI 3.0 API specification
- `research.md` - Architecture decisions (MSW testing, OpenAI resume parsing, cost tracking)
- `quickstart.md` - Local development setup

## Architecture

### Next.js App Router Structure

```
app/
├── (public)/           # Guest users: landing, login (no auth)
├── (auth)/             # Registered users: dashboard, settings (auth required)
├── (coach)/            # Practice sessions: setup, session, results
└── api/                # REST endpoints organized by domain
    ├── sessions/       # Create, retrieve, generate questions/coaching
    ├── answers/        # Submit answer, transcribe audio (Whisper)
    ├── reports/        # Get report, download PDF
    ├── uploads/        # Resume (virus scan + PII detection), JD
    ├── jobs/           # Match scores, daily digest (cron)
    ├── admin/          # Dashboards, analytics, recruiter transcript access
    └── cron/           # Vercel cron jobs (curate-jobs, send-digests, reset-audio-mode)
```

### Data Flow

**Guest Session (US1)**:

1. POST /api/sessions (user_id=NULL, mode='text') → session created
2. POST /api/sessions/[id]/questions → fetch generic soft-skills from seed data
3. User answers via text → POST /api/answers (transcript_text)
4. POST /api/sessions/[id]/coaching → OpenAI generates STAR scores + narrative feedback
5. View report → strengths, clarifications, per-question coaching

**Registered Session (US2)**:

1. User signs in (Supabase Auth: Google OAuth or email magic link)
2. POST /api/uploads/resume → ClamAV scan → PII detection → OpenAI parsing → Supabase Storage
3. POST /api/sessions (user_id, mode='audio', resume/JD attached)
4. POST /api/sessions/[id]/questions → OpenAI generates tailored questions from resume/JD
5. AudioRecorder component → POST /api/answers/[id]/transcribe (Whisper STT, real-time partials)
6. Adaptive follow-up if STAR elements missing (disabled in Low-Anxiety Mode)
7. POST /api/sessions/[id]/coaching → comprehensive report with strengths vs JD
8. Download PDF → GET /api/reports/[id]/pdf (pdf-lib generation)

**Job Digest (US4)**:

1. Cron: POST /api/cron/curate-jobs (noon PT) → parse ZipRecruiter/Indeed/Mac's List emails via OpenAI
2. User opts in → POST /api/users/digest-optin → double opt-in email sent
3. Cron: POST /api/cron/send-digests (5pm PT) → calculate match scores (hard skills 50%, soft 20%, seniority 20%, logistics 10%)
4. If ≥80% match: send digest email via Microsoft Graph
5. If ≥80% Cinder role match: send internal recruiting alert

### Database Schema

**Core entities** (see `data-model.md` for full schema):

- `users` - registered accounts with eligibility, preferences, consent flags
- `profiles` - career details, resume metadata (1:1 with users)
- `sessions` - practice sessions with mode, anxiety flag, draft-save JSONB
- `questions` - interview questions with category, tailoring, follow-ups
- `answers` - user responses with STAR scores (1-5 per element), rubric tags, honesty flags
- `reports` - coaching feedback (strengths/clarifications/per-question as JSONB)
- `jobs` - curated postings with skills arrays, must-haves, source
- `matches` - user-job pairings with weighted scores, notification tracking
- `events` - analytics (session_start, coaching_viewed, etc.)
- `consents` - versioned Terms/Privacy agreements

**Row Level Security**:

- Users isolated to own data via `auth.uid() = user_id`
- Guest sessions allowed via `user_id IS NULL`
- Recruiters access transcripts if `recruiter_access_granted = TRUE` OR performance threshold (avg STAR ≥4.2, completion ≥70%)
- Admin-only tables bypass RLS via service role

### Key Utilities

**OpenAI Integration** (`lib/openai/`):

- `coaching.ts` - GPT-4o prompts for STAR scoring, narrative feedback, example answers (NEVER fabricate)
- `questions.ts` - Generate tailored questions from resume/JD
- `stt.ts` - Whisper transcription (partial=true for real-time, partial=false for final)
- `tts.ts` - Text-to-speech streaming (tts-1 model, opus format)
- `resume-parser.ts` - Structured output extraction (name, email, skills, experience, education)

**Security** (`lib/security/`):

- `virus-scan.ts` - HTTP client to ClamAV service on Railway
- `pii-detection.ts` - Regex for SSN/DOB with age validation, replace with [REDACTED]
- `rate-limit.ts` - Per-IP and per-account limits
- `recaptcha.ts` - reCAPTCHA v3 verification (score threshold ≥0.5)

**Scoring** (`lib/scoring/`):

- `star.ts` - Parse OpenAI responses for Situation/Task/Action/Result scores (1-5 each), specificity/impact/clarity tags
- `job-match.ts` - 0-100 match score algorithm with weighted criteria, must-have skills gate

**Cost Control** (`lib/utils/cost-tracker.ts`):

- Insert `cost_tracking` row after each OpenAI API call
- Check `get_current_month_cost() >= $285` before enabling audio mode
- Set `audio_mode_enabled = FALSE` in `system_config` when cap approached
- Monthly reset cron restores audio mode on 1st of month

## Development Commands

### Local Setup

**NOTE**: This project uses **hosted Supabase** (not local). The database is at `jbgbgiehjvviuvirkfcg.supabase.co`. You do NOT need to run `supabase start` or have Docker installed for local development.

```bash
# Install dependencies
npm install

# Start Next.js dev server
npm run dev  # http://localhost:3000
```

For database schema changes, apply migrations directly to the hosted Supabase instance.

### Production Deployment

For production, Next.js requires a build step:

```bash
# Build for production
npm run build

# Start production server
npm run start  # http://localhost:3333
```

**Deployment options:**

- **Vercel (recommended)**: Automatic builds on push, handles `build` + `start` automatically
- **Docker**: Can containerize with `next build` + `next start` in Dockerfile
- **Self-hosted**: Run `npm run build && npm run start` on any Node.js server

The project is configured for Vercel deployment (see `vercel.json` if present, or auto-detected by Vercel).

### Testing

```bash
# Unit tests (Jest + React Testing Library)
npm run test:unit

# Integration tests (MSW mocking for OpenAI/Microsoft Graph)
npm run test:integration

# E2E tests (Playwright)
npm run test:e2e
npx playwright test --ui  # with UI

# Accessibility tests (axe-core)
npm run test:a11y
```

### Database

**NOTE**: Using hosted Supabase - manage via Supabase Dashboard at https://supabase.com/dashboard

```bash
# View/edit data in Supabase Studio (hosted)
# Navigate to: https://supabase.com/dashboard/project/jbgbgiehjvviuvirkfcg

# Generate TypeScript types from hosted schema
npm run db:types

# For schema changes, use Supabase Dashboard SQL Editor
# or apply migrations via Supabase CLI linked to the hosted project
```

### API Testing

```bash
# Import OpenAPI spec to Postman/Swagger Editor
# File: specs/001-ai-interview-coach/contracts/rest-api.yaml

# Test endpoints with curl (examples in quickstart.md)
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"mode": "text", "questionCount": 8}'
```

## Implementation Workflow

### Task Execution Order

1. **Phase 1: Setup** (T001-T016) - Install dependencies, configure tooling
2. **Phase 2: Foundational** (T017-T065) - Database schema, RLS policies, auth middleware, shared utilities
   - **CRITICAL**: All user stories BLOCKED until this phase completes
3. **Phase 3+: User Stories** (T066+) - Implement in priority order (P1 → P2 → P3)
   - US1 (Guest Practice): T066-T080
   - US2 (Registered Practice): T081-T102
   - US3 (Coaching Report): T103-T111 ← **MVP complete at this checkpoint**
   - US4 (Job Digest): T112-T124
   - US5 (Low-Anxiety Mode): T125-T130
   - US6 (Feedback & Referral): T131-T138
4. **Phase 9-11**: Admin, Security, Polish (can run parallel with user stories)

Each task in `tasks.md` follows format: `- [ ] T### [P?] [Story?] Description with file path`

- `[P]` = parallelizable (different files, no dependencies)
- `[US1]`-`[US6]` = user story labels for traceability

### Testing Each User Story

Validate independently at checkpoints:

- **US1**: Guest can complete text session → receive coaching → see sign-up nudge
- **US2**: User uploads resume → records audio → receives tailored questions
- **US3**: User views 3-pane report → downloads PDF
- **US4**: User opts into digest → receives email at 5pm PT
- **US5**: User enables Low-Anxiety → answers 3 questions → no scores shown
- **US6**: User completes survey → shares referral link → click tracked

### Code Review Checklist

Before committing feature code:

1. ✅ Constitutional compliance: Accessibility (text fallback?), Privacy (no fabrication?), Performance (cost tracked?), Progressive (guest value?), Safety (consent obtained?)
2. ✅ File paths match task description in tasks.md
3. ✅ TypeScript strict mode, no `any` types
4. ✅ Radix UI components used (not plain `<div>` for interactive elements)
5. ✅ ARIA labels present, keyboard navigation works
6. ✅ Error handling with user-friendly messages
7. ✅ OpenAI calls include cost tracking insertion
8. ✅ RLS policies tested (user can't access other users' data)
9. ✅ Audio transcripts stored, audio files never persisted
10. ✅ Draft-save updates every 30s for long sessions

## Environment Variables

Required in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Microsoft Graph
GRAPH_CLIENT_ID=
GRAPH_CLIENT_SECRET=
GRAPH_TENANT_ID=

# ClamAV (optional local, required production)
CLAMAV_URL=

# Cost Control
MONTHLY_COST_CAP_USD=300
COST_ALERT_THRESHOLD_USD=285

# Vercel Cron
CRON_SECRET=

# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
```

## Key File Locations

- Constitution: `.specify/memory/constitution.md`
- Feature spec: `specs/001-ai-interview-coach/spec.md`
- Implementation plan: `specs/001-ai-interview-coach/plan.md`
- Task list: `specs/001-ai-interview-coach/tasks.md`
- Database schema: `specs/001-ai-interview-coach/data-model.md`
- API contracts: `specs/001-ai-interview-coach/contracts/rest-api.yaml`
- Migrations: `supabase/migrations/`
- Seed data: `supabase/seed.sql`

## Common Pitfalls

1. **Don't fabricate in coaching** - AI must only use facts from user's resume/answers
2. **Never store audio files** - Only transcripts (answers.transcript_text)
3. **Check cost before audio** - Query `get_current_month_cost()` before enabling mode='audio'
4. **Virus scan all uploads** - Call ClamAV before Supabase Storage upload
5. **Strip SSN/DOB** - Run PII detection on resume text before parsing
6. **RLS always on** - Never bypass Row Level Security in application code
7. **Guest sessions nullable** - user_id IS NULL is valid for guest mode
8. **Adaptive follow-ups conditional** - Disabled when low_anxiety_enabled=TRUE
9. **Must-have skills gate** - Job match score invalid if missing must-have skills
10. **Cron auth required** - Verify `Authorization: Bearer <CRON_SECRET>` header

## Performance Targets

Monitor these SLOs in production:

- TTS first byte: ≤700ms
- ASR partial transcripts: ≤300ms
- Coaching generation: ≤3s
- Report generation: ≤10s
- File upload (3MB): ≤10s
- Page loads (p95): ≤1.5s

If targets missed, investigate:

- Vercel Edge Functions for OpenAI routes (reduce cold starts)
- Streaming responses (don't buffer entire response)
- React.memo on heavy components (AudioRecorder, CoachingFeedback)
- Suspense boundaries for data fetching

## Deployment Checklist

Before deploying to production:

1. Environment variables set in Vercel
2. Supabase project created (not local)
3. ClamAV service deployed on Railway
4. Domain configured: teamcinder.com/coach
5. SPF/DKIM configured for AI-Cindy@teamcinder.com
6. Vercel cron jobs configured (send-digests at 5pm PT, curate-jobs at noon PT, reset-audio-mode on 1st of month)
7. Cost tracking dashboard accessible to admins
8. Terms of Service and Privacy Policy pages live
9. WCAG 2.2 AA compliance validated (axe-core + manual testing)
10. reCAPTCHA keys configured

---

**Last Updated**: 2025-10-26
**Active Technologies**: TypeScript 5.x, Next.js 14 (App Router), React 18, Supabase, OpenAI SDK, Microsoft Graph SDK, React Hook Form, Zod, TailwindCSS, Radix UI, pdf-lib, ClamAV
