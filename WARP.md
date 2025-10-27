# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Cindy from Cinder** is an AI interview and application coach built with Next.js 14, Supabase, and OpenAI. This is a spec-driven development project using GitHub's speckit methodology.

**Domain**: teamcinder.com/coach  
**Status**: Phase 3 complete (Guest Practice Session - MVP core functional)

## Commands

### Development
```bash
# Start local development
npm run dev                      # Next.js dev server on http://localhost:3000

# Database (Supabase)
supabase start                   # Start local Supabase (requires Docker)
supabase db reset                # Reset database + run migrations + seed data
npm run db:types                 # Generate TypeScript types from Supabase schema
```

### Testing
```bash
# Unit tests (Jest + React Testing Library)
npm test                         # Run all unit tests
npm run test:unit                # Explicit unit test command
npm run test:watch               # Watch mode for TDD

# E2E tests (Playwright)
npm run test:e2e                 # Run all E2E tests (SLOW - ~8min, costs OpenAI credits)
npm run test:e2e:ui              # Interactive E2E test runner
npm run test:a11y                # Accessibility tests only
npx playwright test e2e/a11y.spec.ts --project=chromium --timeout=30000  # Fast a11y check

# Note: E2E tests call real OpenAI API and cost money. Run sparingly.
```

### Code Quality
```bash
npm run lint                     # ESLint (has config issues - use with caution)
npm run format                   # Prettier formatting
npm run format:check             # Check formatting without changing
```

## Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router), TypeScript 5, React 18
- **Database**: Supabase (PostgreSQL + Row Level Security + Auth + Storage)
- **AI**: OpenAI GPT-4o (coaching), Whisper (STT), TTS-1 (audio)
- **Email**: Microsoft Graph API (from AI-Cindy@teamcinder.com)
- **UI**: Radix UI + TailwindCSS (WCAG 2.2 AA compliant)
- **Testing**: Jest, React Testing Library, Playwright, axe-core

### Project Structure
```
app/
├── (public)/              # Guest routes (no auth): landing, login
│   ├── page.tsx          # Landing page
│   └── layout.tsx        # Public layout with Navbar
├── (coach)/              # Practice session routes
│   └── practice/
│       ├── page.tsx      # Session setup (question count, mode selection)
│       ├── session/[id]/ # Active session (answer questions)
│       └── results/[id]/ # Coaching report (strengths, clarifications, feedback)
├── api/                  # REST API routes
│   ├── sessions/         # POST create, GET /[id], POST /[id]/questions, POST /[id]/coaching
│   ├── answers/          # POST submit answer
│   └── reports/[id]/     # GET report data
├── layout.tsx            # Root layout (fonts, providers)
└── globals.css           # TailwindCSS + WCAG-compliant focus styles

components/
├── coach/               # Interview coaching UI
│   ├── AnswerInput.tsx         # Question display + text input + char count + STAR hint
│   ├── CoachingFeedback.tsx    # Narrative feedback + rubric tags + example answers
│   └── ReportPane.tsx          # (not yet implemented - US3)
├── ui/                  # Radix UI primitives
│   ├── Button.tsx, Dialog.tsx, Input.tsx, Label.tsx, Select.tsx, Textarea.tsx, Toast.tsx
└── shared/
    ├── Navbar.tsx              # Main navigation
    ├── Footer.tsx              # Site footer
    └── ErrorBoundary.tsx       # Error handling

lib/
├── data/question-bank.ts       # Generic soft-skill questions for guest mode
├── openai/
│   └── coaching.ts             # OpenAI prompts for STAR scoring + narrative feedback
├── scoring/
│   ├── star.ts                 # Parse STAR framework scores (1-5 per element)
│   └── job-match.ts            # (not yet implemented - US4)
├── security/
│   ├── pii-detection.ts        # Strip SSN/DOB from resumes
│   ├── rate-limit.ts           # Per-IP and per-account limits
│   ├── recaptcha.ts            # reCAPTCHA v3 verification
│   └── virus-scan.ts           # ClamAV integration
├── supabase/
│   ├── client.ts               # Browser client
│   ├── server.ts               # Server client
│   └── middleware.ts           # Auth middleware (eligibility checks)
└── utils/
    ├── cost-tracker.ts         # Track OpenAI API costs
    └── validators.ts           # Zod schemas for API validation

supabase/
├── migrations/                 # Database schema migrations
│   ├── 20251026000001_initial_schema.sql    # Tables: users, sessions, questions, answers, reports, etc.
│   ├── 20251026000002_rls_policies.sql      # Row Level Security policies
│   ├── 20251026000003_audit_triggers.sql    # Auto-update triggers
│   └── 20251026000004_test_helpers.sql      # reset_test_data() for E2E tests
└── seed.sql                    # Question bank seed data + system config

specs/001-ai-interview-coach/   # Spec-driven development docs
├── spec.md                     # 6 user stories (US1-US6) + requirements
├── plan.md                     # Technical implementation plan
├── data-model.md               # Database schema (10 tables)
├── tasks.md                    # 180 implementation tasks (T001-T180)
└── quickstart.md               # Developer onboarding guide
```

### Key Data Flow (Guest Session - US1)

1. **Setup**: User visits `/` → clicks "Try Practice Session" → navigates to `/practice`
2. **Configure**: Select question count (3-10, default 8), enable/disable Low-Anxiety Mode
3. **Session Creation**: Click "Start Practice" → POST `/api/sessions` → creates session with `user_id=NULL`
4. **Question Generation**: POST `/api/sessions/[id]/questions` → fetches 8 generic soft-skill questions from seed data → inserts into `questions` table
5. **Answer Loop**: For each question:
   - Display question with STAR framework hint
   - User types answer (min 10 chars, max 5000 chars)
   - Character count shows "X / 5000" format
   - Click "Submit Answer" → POST `/api/answers` → saves transcript, updates completion rate
6. **Coaching**: After final answer → redirect to `/practice/results/[sessionId]`
   - POST `/api/sessions/[id]/coaching` → calls OpenAI GPT-4o to analyze all answers
   - Generates STAR scores (1-5 per element), narrative feedback, example improved answers
   - Inserts report into `reports` table with JSONB fields: strengths, clarifications, per_question_feedback
7. **Report Display**: Shows:
   - **Pane 1**: Top 3 Strengths (with evidence from answers)
   - **Pane 2**: 3 Clarifications (suggestions for resume/cover letter)
   - **Pane 3**: Per-Question Feedback (narrative + STAR scores + example answer)
   - **Banner**: Sign-up nudge for guest users

### Constitutional Principles (Critical - Must Follow)

All code changes MUST comply with these 5 core principles (see `.specify/memory/constitution.md`):

1. **Accessibility-First**: WCAG 2.2 AA mandatory. Text-only fallback for all features. Radix UI for ARIA compliance.
2. **Ethical AI**: AI must NOT fabricate facts. Audio never stored (transcripts only). Strip SSN/DOB from resumes.
3. **Performance**: TTS ≤700ms, ASR ≤300ms, coaching ≤3s. Monthly OpenAI budget cap: $300. Graceful degradation to text-only.
4. **Progressive Enhancement**: Guest mode provides core value. Registered mode adds resume uploads, audio, tailored questions, job digest.
5. **User Safety**: 18+ U.S. eligibility. Virus scan uploads. reCAPTCHA on forms. Rate limiting. Double opt-in for email.

## Database Schema Essentials

**Core Tables** (see `specs/001-ai-interview-coach/data-model.md` for full schema):
- `users`: Registered accounts (guest sessions have `user_id = NULL`)
- `sessions`: Practice sessions (mode: 'audio'|'text', low_anxiety_enabled, question_count)
- `questions`: Interview questions (question_order, category, is_tailored)
- `answers`: User responses (transcript_text, STAR scores 1-5, rubric tags)
- `reports`: Coaching feedback (strengths/clarifications/per_question_feedback as JSONB)

**Row Level Security**: Users isolated to own data via `auth.uid() = user_id`. Guest sessions allowed via `user_id IS NULL`.

**Helper Function**: `reset_test_data()` - Deletes test data created in last hour. Call before E2E tests to avoid constraint violations.

## Testing Strategy

### Unit Tests (194 tests - 100% passing)
- **Location**: `__tests__/` directories next to source files
- **Coverage**: 70% threshold for branches/functions/lines/statements
- **Mocking**: MSW for OpenAI/Microsoft Graph API calls
- **Run**: `npm test` (fast, no API costs)

### E2E Tests (34 tests - ~74% passing)
- **Location**: `e2e/` directory
- **Framework**: Playwright with Chromium/Firefox/Safari
- **Cost Warning**: Each test session calls OpenAI API ($0.01-0.05 per run). Full suite costs ~$1-2.
- **Performance**: Tests run serially (`--workers=1`) to avoid database constraint violations. Full suite takes 8-10 minutes.
- **Database Cleanup**: Call `reset_test_data()` in `beforeEach` hook to avoid duplicate question_order errors.

**Known E2E Issues**:
- Accessibility tests (10 tests): Some keyboard navigation and ARIA label checks failing. Most pages timeout trying to load.
- Test expectations sometimes don't match implementation (e.g., "Your Top 3 Strengths" vs "Top 3 Strengths").
- Option elements reported as "hidden" by Playwright (browser implementation detail).

### Accessibility Tests
```bash
npm run test:a11y              # Run all a11y tests (~40s)
npx playwright test e2e/a11y.spec.ts --project=chromium --timeout=30000  # With strict timeout
```
**WCAG 2.2 AA Requirements**:
- Color contrast: Minimum 4.5:1 ratio (fixed: --color-muted-foreground changed from #64748b to #475569)
- ARIA labels: All form inputs must have `aria-label` or associated `<label>`
- Keyboard navigation: All interactive elements must be keyboard accessible
- Focus indicators: `:focus-visible` styles required (defined in `app/globals.css`)

## Development Workflow

### Spec-Kit Methodology
This project follows spec-driven development. Task list: `specs/001-ai-interview-coach/tasks.md`

**Phase Status**:
- ✅ Phase 1: Setup (T001-T016) - Complete
- ✅ Phase 2: Foundational (T017-T065) - Complete
- ✅ Phase 3: US1 Guest Practice Session (T066-T080) - Complete
- ⏳ Phase 4: US2 Registered User Tailored Practice (T081-T102) - Not started
- ⏳ Phase 5: US3 Comprehensive Coaching Report (T103-T111) - Not started
- ⏳ Phase 6+: US4-US6, Admin, Security, Polish - Not started

**Before Starting New Phase**:
1. Read the spec: `specs/001-ai-interview-coach/spec.md`
2. Review the plan: `specs/001-ai-interview-coach/plan.md`
3. Check task dependencies in `tasks.md`
4. Run `npm test` to ensure no regressions
5. Consider OpenAI API costs before running E2E tests

### Making Changes
1. **Unit test first**: Write test in appropriate `__tests__/` directory
2. **Implement feature**: Follow existing patterns in similar files
3. **Accessibility check**: Use Radix UI components, add ARIA labels, test keyboard navigation
4. **Run tests**: `npm test` for unit tests (always safe to run)
5. **Lint** (optional): `npm run format` (lint command has config issues)
6. **E2E test** (if needed): `npm run test:e2e` (EXPENSIVE - only when necessary)

## Common Gotchas

1. **ESLint Configuration Broken**: Running `npm run lint` may fail with "Unknown options" error. Use `npm run format` instead or fix `.eslintrc.json`.

2. **E2E Tests Expensive**: Every coaching test calls OpenAI API. Full suite costs $1-2. Use `--timeout=30000` to fail fast.

3. **Database Constraint Violations**: If E2E tests fail with "duplicate key value violates unique constraint 'unique_question_order'", the database wasn't reset between tests. Solution: Call `reset_test_data()` in test setup or run `supabase db reset`.

4. **Audio Never Stored**: Per constitution principle #2, only transcripts are stored. Check `answers.transcript_text`, not audio files.

5. **Guest vs Registered Mode**: Guest sessions have `user_id = NULL` in database. Test guest flow without auth. Registered mode requires Phase 4 implementation.

6. **OpenAI Rate Limits**: If tests fail with 429 errors, you've hit rate limits. Add credits to OpenAI account or implement MSW mocking for E2E tests.

7. **Supabase Local vs Production**: Local dev uses `http://127.0.0.1:54321`. Production uses hosted Supabase URL. Check `.env.local` for correct configuration.

8. **Character Count Format**: Tests expect "X / 5000" format, not "X characters remaining". See `components/coach/AnswerInput.tsx` line 127.

9. **Test Text Expectations**: Tests look for exact strings like "Top 3 Strengths" not "Your Top 3 Strengths". Check test files before changing UI text.

10. **Focus Indicators**: Custom focus styles in `app/globals.css` (line 24-27). All interactive elements must have visible focus for WCAG compliance.

## Environment Variables

Required in `.env.local`:
```env
# Supabase (get from `supabase status`)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# OpenAI (required for coaching)
OPENAI_API_KEY=sk-proj-...

# Microsoft Graph (for email - can be mocked locally)
GRAPH_CLIENT_ID=mock-client-id
GRAPH_CLIENT_SECRET=mock-client-secret
GRAPH_TENANT_ID=mock-tenant-id

# ClamAV (optional for local - required for production)
CLAMAV_URL=http://localhost:3310

# Cost Control
MONTHLY_COST_CAP_USD=300
COST_ALERT_THRESHOLD_USD=285

# reCAPTCHA (can be mocked locally)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=mock-site-key
RECAPTCHA_SECRET_KEY=mock-secret-key

# Vercel Cron (for scheduled jobs)
CRON_SECRET=local-dev-secret
```

## Performance Targets (from Constitution)
- TTS first byte: ≤700ms
- ASR partial transcripts: ≤300ms  
- Coaching generation: ≤3s
- Report generation: ≤10s
- File upload (3MB): ≤10s
- Page loads (p95): ≤1.5s

If targets missed, investigate:
- Vercel Edge Functions for low-latency API routes
- Streaming OpenAI responses (don't buffer)
- React.memo on heavy components
- Suspense boundaries for data fetching

## Deployment Notes

**Not yet deployed**. When deploying:
1. Set all environment variables in Vercel
2. Create production Supabase project
3. Deploy ClamAV service on Railway
4. Configure domain: teamcinder.com/coach
5. Set up Vercel cron jobs (daily digest, job curation)
6. Validate WCAG 2.2 AA compliance with axe-core + manual testing
7. Test with real OpenAI credits (not test keys)

## Links

- **Spec**: `specs/001-ai-interview-coach/spec.md`
- **PRD**: `cindy-comprehensive-prd.md`
- **Claude Rules**: `CLAUDE.md` (similar to this file but for Claude Code)
- **Constitution**: `.specify/memory/constitution.md`
- **Quickstart**: `specs/001-ai-interview-coach/quickstart.md`

---

**Last Updated**: 2025-10-26  
**Current Phase**: Phase 3 complete (Guest Practice Session MVP)  
**Next Priority**: Phase 4 (Registered User Mode with resume upload + audio recording)
