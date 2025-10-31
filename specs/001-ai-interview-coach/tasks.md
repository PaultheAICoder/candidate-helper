# Tasks: AI Interview Coach (Cindy from Cinder)

**Input**: Design documents from `/specs/001-ai-interview-coach/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Automated tests REQUIRED for each user story. Tests should be written BEFORE implementation (TDD approach).

- Unit tests: Core utilities (STAR scoring, job matching, validators)
- Integration tests: API routes with MSW mocking for OpenAI/Microsoft Graph
- E2E tests: Critical user journeys with Playwright
- Accessibility tests: WCAG 2.2 AA compliance with axe-core

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: Next.js App Router structure with `app/`, `components/`, `lib/` at repository root
- Paths shown below follow Next.js 14 conventions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize Next.js 14 project with TypeScript and App Router
- [x] T002 Install core dependencies: react@18, next@14, typescript@5
- [x] T003 [P] Install Supabase client: @supabase/supabase-js, @supabase/auth-helpers-nextjs
- [x] T004 [P] Install OpenAI SDK: openai@latest
- [x] T005 [P] Install Microsoft Graph SDK: @microsoft/microsoft-graph-client
- [x] T006 [P] Install UI dependencies: @radix-ui/react-\*, tailwindcss, class-variance-authority
- [x] T007 [P] Install form dependencies: react-hook-form, zod, @hookform/resolvers
- [x] T008 [P] Install PDF generation: pdf-lib
- [x] T009 [P] Install dev dependencies: jest, @testing-library/react, playwright, msw, eslint, prettier
- [x] T010 Configure TailwindCSS with Radix UI color palette in tailwind.config.ts
- [x] T011 [P] Configure TypeScript with strict mode in tsconfig.json
- [x] T012 [P] Configure ESLint with Next.js and accessibility rules in .eslintrc.json
- [x] T013 [P] Configure Prettier for consistent formatting in .prettierrc
- [x] T014 Create environment variable template in .env.example (Supabase, OpenAI, Microsoft Graph, ClamAV, reCAPTCHA keys)
- [x] T015 Set up Supabase CLI and initialize local development with supabase init
- [x] T016 Create .gitignore with Next.js, node_modules, .env.local patterns

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema

- [x] T017 Create migration 001: Initial schema in supabase/migrations/001_initial_schema.sql
- [x] T018 Define users table: id, email, auth_provider, work_auth_status, comp_range_min/max, remote_preference, location, eligibility_confirmed, recruiter_access_granted, digest_opt_in, digest_confirmed, timestamps
- [x] T019 [P] Define profiles table: id, user_id FK, target_roles, seniority_level, resume_filename, resume_storage_path, resume_uploaded_at, resume_file_size_bytes, timestamps
- [x] T020 [P] Define sessions table: id, user_id FK (nullable), mode, low_anxiety_enabled, per_question_coaching, job_description_text, target_role_override, question_count, started_at, completed_at, avg_star_score, completion_rate, draft_save JSONB, created_at
- [x] T021 [P] Define questions table: id, session_id FK, question_order, question_text, category, is_tailored, follow_up_question, follow_up_used, created_at
- [x] T022 [P] Define answers table: id, session_id FK, question_id FK UNIQUE, transcript_text, duration_seconds, retake_used, extension_used, star_situation_score, star_task_score, star_action_score, star_result_score, specificity_tag, impact_tag, clarity_tag, honesty_flag, created_at
- [x] T023 [P] Define reports table: id, session_id FK UNIQUE, strengths JSONB, clarifications JSONB, per_question_feedback JSONB, pdf_storage_path, pdf_generated_at, created_at
- [x] T024 [P] Define jobs table: id, source, title, company, skills TEXT[], must_have_skills TEXT[], seniority_level, location, posting_url UNIQUE, curated_at, active
- [x] T025 [P] Define matches table: id, user_id FK, job_id FK, match_score, hard_skills_score, soft_skills_score, seniority_score, logistics_score, match_reasons TEXT[], notified_at, recruiting_alert_sent, created_at
- [x] T026 [P] Define events table: id, user_id FK (nullable), event_type, session_id FK (nullable), payload JSONB, created_at
- [x] T027 [P] Define consents table: id, user_id FK, terms_version, privacy_version, ip_address INET, user_agent, created_at
- [x] T028 [P] Define cost_tracking table: id, period_start, period_end, model, tokens_used, audio_seconds, estimated_cost_usd, created_at
- [x] T029 [P] Define system_config table: key PRIMARY KEY, value TEXT, updated_at
- [x] T030 [P] Define audit_logs table: id, admin_user_id FK (nullable), action_type, resource_type, resource_id, details JSONB, created_at
- [x] T031 Add indexes: users(email), users(digest_opt_in, digest_confirmed), profiles(user_id), sessions(user_id), sessions(completed_at), sessions(avg_star_score, completion_rate), questions(session_id, question_order), answers(session_id), answers(question_id), reports(session_id), jobs(source), jobs(active, curated_at DESC), jobs(posting_url), jobs(skills USING GIN), matches(user_id, match_score DESC), matches(job_id), matches(user_id, notified_at), matches(match_score, recruiting_alert_sent), events(user_id, created_at DESC), events(event_type, created_at DESC), events(session_id), consents(user_id, created_at DESC), cost_tracking(period_start, period_end), cost_tracking(model, period_start), audit_logs(admin_user_id, created_at DESC), audit_logs(resource_type, resource_id)
- [x] T032 Create migration 002: Row Level Security in supabase/migrations/002_rls_policies.sql
- [x] T033 Enable RLS on all tables: users, profiles, sessions, questions, answers, reports, matches, consents, events
- [x] T034 [P] Create RLS policy: Users can view own profile (users table SELECT)
- [x] T035 [P] Create RLS policy: Users can update own profile (users table UPDATE)
- [x] T036 [P] Create RLS policy: Users can view own sessions (sessions table SELECT, allow user_id = auth.uid() OR user_id IS NULL for guests)
- [x] T037 [P] Create RLS policy: Users can create sessions (sessions table INSERT)
- [x] T038 [P] Create RLS policy: Users can view own answers (answers table SELECT via session ownership)
- [x] T039 [P] Create helper function: is_recruiter(user_id UUID) RETURNS BOOLEAN in supabase/migrations/002_rls_policies.sql
- [x] T040 Create RLS policy: Recruiters can view eligible transcripts (answers table SELECT, check recruiter_access_granted OR performance threshold)
- [x] T041 [P] Create RLS policy: Users can view own consents (consents table SELECT)
- [x] T042 [P] Create RLS policy: System can insert consents (consents table INSERT)
- [x] T043 Create migration 003: Audit triggers in supabase/migrations/003_audit_triggers.sql
- [x] T044 Create trigger: Update sessions.avg_star_score when answers inserted/updated
- [x] T045 [P] Create trigger: Update sessions.completion_rate when answers inserted
- [x] T046 Create function: get_current_month_cost() RETURNS DECIMAL for cost tracking
- [x] T047 Create seed data file: supabase/seed.sql with generic soft-skill question bank (conflict, leadership, ownership, collaboration, failure/learning, communication categories)
- [x] T048 Insert sample system_config rows: audio_mode_enabled=true, monthly_cost_threshold_usd=285.00, max_sessions_per_day=2, max_questions_per_session=10

### Auth & Middleware

- [x] T049 Create Supabase browser client in lib/supabase/client.ts
- [x] T050 Create Supabase server client in lib/supabase/server.ts
- [x] T051 Create auth middleware in lib/supabase/middleware.ts with eligibility checks (18+, U.S.-based)
- [x] T052 Create Next.js middleware in middleware.ts to protect auth routes and apply Supabase session handling
- [x] T053 Create rate limiting utility in lib/security/rate-limit.ts (per-IP and per-account limits)
- [x] T054 Create reCAPTCHA verification utility in lib/security/recaptcha.ts

### Shared Utilities & Components

- [x] T055 Create Zod validation schemas in lib/utils/validators.ts (session create, answer submit, resume upload, etc.)
- [x] T056 Create TypeScript types file: types/database.ts (Supabase generated types via npm run db:types)
- [x] T057 Create TypeScript types file: types/models.ts (domain model types: Session, Question, Answer, Report, etc.)
- [x] T058 Create TypeScript types file: types/openai.ts (OpenAI response types for structured outputs)
- [x] T059 Create cost tracker utility in lib/utils/cost-tracker.ts (insert cost_tracking rows after OpenAI calls)
- [x] T060 Create base UI components in components/ui/ using Radix UI primitives: Button.tsx, Dialog.tsx, Form.tsx, Input.tsx, Label.tsx, Select.tsx, Textarea.tsx, Toast.tsx
- [x] T061 Create shared Navbar component in components/shared/Navbar.tsx
- [x] T062 [P] Create shared Footer component in components/shared/Footer.tsx
- [x] T063 [P] Create ErrorBoundary component in components/shared/ErrorBoundary.tsx
- [x] T064 Create root layout in app/layout.tsx (fonts, TailwindCSS, providers, metadata)
- [x] T065 Create global styles in app/globals.css (TailwindCSS imports, custom utilities, WCAG-compliant focus rings)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Guest Practice Session (Priority: P1) 🎯 MVP

**Goal**: Job seekers can immediately try the interview coach without creating an account, practicing with generic soft-skill questions and receiving supportive feedback

**Independent Test**: A visitor can land on teamcinder.com/coach, start a text-based practice session with 3-5 generic behavioral questions, receive end-of-session coaching feedback, and see a nudge to create an account for personalized features

### Implementation for User Story 1

- [x] T066 [P] [US1] Create public landing page in app/(public)/page.tsx with "Try Practice Session" CTA
- [x] T067 [P] [US1] Create public layout in app/(public)/layout.tsx (Navbar, Footer, no auth required)
- [x] T068 [US1] Create practice session setup page in app/(coach)/practice/page.tsx (select question count 3-10, text-only mode for guest, Low-Anxiety Mode toggle)
- [x] T069 [US1] Create coach layout in app/(coach)/layout.tsx
- [x] T070 [US1] Create POST /api/sessions route in app/api/sessions/route.ts (create session with user_id=NULL for guest, validate question_count, insert into sessions table, track session_start event)
- [x] T071 [US1] Create POST /api/sessions/[id]/questions route in app/api/sessions/[id]/questions/route.ts (fetch generic soft-skill questions from database seed, return 3-10 questions based on session.question_count, insert into questions table)
- [x] T072 [US1] Create active session page in app/(coach)/practice/session/[id]/page.tsx (display questions one-by-one, AnswerInput component for text, track q_answered events)
- [x] T073 [US1] Create AnswerInput component in components/coach/AnswerInput.tsx (text textarea with character count, accessibility labels, submit button)
- [x] T074 [US1] Create POST /api/answers route in app/api/answers/route.ts (submit answer with transcriptText, validate against session, insert into answers table, update session.completion_rate)
- [x] T075 [US1] Create OpenAI coaching utility in lib/openai/coaching.ts (prompt templates for STAR scoring and narrative feedback, function to call GPT-4o with structured output)
- [x] T076 [US1] Create STAR scoring utility in lib/scoring/star.ts (parse OpenAI response, extract situation/task/action/result scores 1-5, calculate specificity/impact/clarity tags)
- [x] T077 [US1] Create POST /api/sessions/[id]/coaching route in app/api/sessions/[id]/coaching/route.ts (fetch all answers for session, call OpenAI coaching for each, generate narrative + rubric tags + example improved answer, insert report into reports table, mark session completed_at)
- [x] T078 [US1] Create coaching results page in app/(coach)/practice/results/[id]/page.tsx (display narrative coaching, rubric tags, example answers, sign-up nudge banner)
- [x] T079 [US1] Create CoachingFeedback component in components/coach/CoachingFeedback.tsx (narrative text, STAR rubric tags with colors, example answer collapsible, hide scores if Low-Anxiety Mode)
- [x] T080 [US1] Add sign-up nudge banner to results page: "Create a free account to unlock resume uploads, audio practice, and personalized job matching!"

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Registered User Tailored Practice (Priority: P1) 🎯 MVP

**Goal**: Registered users upload their resume and job description to receive tailored interview questions and practice with audio or text responses

**Independent Test**: A registered user uploads a PDF resume and pastes a job description, selects 8 questions (6 tailored + 2 soft-skills), records audio answers with mic test and device selection, and receives a comprehensive end-of-session report with strengths and clarifications

### Implementation for User Story 2

- [x] T081 [P] [US2] Create login page in app/(public)/login/page.tsx (Google Sign-In button, email magic link form, reCAPTCHA)
- [x] T082 [P] [US2] Create auth callback route in app/api/auth/callback/route.ts (handle Supabase OAuth redirect)
- [x] T083 [US2] Create eligibility confirmation modal component in components/shared/EligibilityModal.tsx (18+, U.S.-based checkboxes, store eligibility_confirmed in users table)
- [x] T084 [US2] Create consent modal component in components/shared/ConsentModal.tsx (plain-English summary, link to full Terms/Privacy, store consent in consents table with IP and user agent)
- [x] T085 [US2] Create auth layout in app/(auth)/layout.tsx (require authentication via middleware, show eligibility/consent modals if not completed)
- [x] T086 [US2] Create dashboard page in app/(auth)/dashboard/page.tsx (show user session history, resume status, job digest opt-in toggle)
- [x] T087 [US2] Create settings page in app/(auth)/settings/page.tsx (account info, recruiter access toggle, one-click data export button, one-click delete account button)
- [x] T088 [US2] Create virus scanning utility in lib/security/virus-scan.ts (HTTP client to call ClamAV service on Railway, return clean/infected result)
- [x] T089 [US2] Create PII detection utility in lib/security/pii-detection.ts (regex patterns for SSN and DOB, age validation 16-100, replace with [REDACTED], log warnings)
- [x] T090 [US2] Create resume parsing utility in lib/openai/resume-parser.ts (use GPT-4o structured output to extract name, email, phone, location, skills, experience, education from text)
- [x] T091 [US2] Create POST /api/uploads/resume route in app/api/uploads/resume/route.ts (accept PDF/DOCX/TXT/MD, enforce 3MB limit, call virus-scan, extract text via pdf-parse/mammoth, call PII detection, call resume parser, upload to Supabase Storage, update profiles table with resume_storage_path and parsed data)
- [x] T092 [US2] Create POST /api/uploads/jd route in app/api/uploads/jd/route.ts (accept pasted text or file, return jdText)
- [x] T093 [US2] Extend practice session setup page app/(coach)/practice/page.tsx: Add resume upload component (file input with drag-drop, show parse status), JD paste/upload component, mode selector (audio/text with text-only accessibility toggle), tailored question preferences (6 tailored + 2 soft-skills default)
- [x] T094 [US2] Update POST /api/sessions/[id]/questions route: If user authenticated and resume uploaded, call OpenAI to generate tailored questions based on resume + JD, mix with generic soft-skills, return question mix
- [x] T095 [US2] Create tailored question generation utility in lib/openai/questions.ts (GPT-4o prompt with resume/JD context, generate behavioral and technical questions matching user background, return array of question objects)
- [x] T096 [US2] Create mic test page/modal in components/coach/MicTestModal.tsx (device selector dropdown, test recording, playback, show waveform or volume indicator, mic_check_passed event)
- [x] T097 [US2] Create AudioRecorder component in components/coach/AudioRecorder.tsx (MediaRecorder API, 3-minute countdown timer, real-time captions via Whisper partials, retake button, +30s extension button once, stop button)
- [x] T098 [US2] Create Whisper transcription utility in lib/openai/stt.ts (send audio blob in webm format to OpenAI Whisper API, support partial=true for real-time and partial=false for final transcript)
- [x] T099 [US2] Create POST /api/answers/[id]/transcribe route in app/api/answers/[id]/transcribe/route.ts (accept audio blob multipart/form-data, call Whisper STT, return transcriptText and partial flag, insert/update answer)
- [x] T100 [US2] Update active session page app/(coach)/practice/session/[id]/page.tsx: Show mic test before first audio question, render AudioRecorder for audio mode or AnswerInput for text mode, display real-time captions below recorder
- [x] T101 [US2] Create adaptive follow-up logic in POST /api/answers route: After answer submitted, check if STAR elements missing (call OpenAI to analyze), if missing and low_anxiety_enabled=false, generate follow-up question (max 1 per question), store in questions.follow_up_question, return follow_up to frontend
- [x] T102 [US2] Update active session page to handle follow-up questions: If follow_up returned, show follow-up question before proceeding to next question

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Comprehensive Coaching Report (Priority: P1) 🎯 MVP

**Goal**: Users receive detailed feedback identifying their top 3 strengths versus the job description and 3 concrete clarifications to add to their resume or cover letter

**Independent Test**: After completing a practice session with resume and JD, a user views a three-pane report showing (1) top 3 strengths vs JD, (2) 3 clarifications to add to application materials, and (3) per-question narrative coaching with example improved answers, all downloadable as PDF

### Implementation for User Story 3

- [x] T103 [US3] Update POST /api/sessions/[id]/coaching route: Enhance to generate three-pane report structure (strengths, clarifications, per-question feedback), use OpenAI to compare answers against JD for strengths, identify gaps for clarifications, ensure encouraging/non-penalizing tone, store in reports.strengths and reports.clarifications as JSONB arrays
- [x] T104 [US3] Update coaching results page app/(coach)/practice/results/[id]/page.tsx: Add three-pane layout (Pane 1: Top 3 Strengths, Pane 2: 3 Clarifications, Pane 3: Per-Question Feedback), render strengths with evidence bullets, render clarifications with suggestion + rationale, render per-question narrative + example improved answers
- [ ] T105 [US3] Create ReportPane component in components/coach/ReportPane.tsx (reusable component for strengths/clarifications sections, display JSONB arrays with icons and formatting)
- [x] T106 [US3] Create honesty nudge logic in lib/openai/coaching.ts: If answer contradicts resume/JD, flag in OpenAI prompt, return clarifying follow-up question, add note to report: "Consider making this connection clearer in your resume or cover letter"
- [ ] T107 [US3] Create PDF generation utility in lib/pdf/generate-report.ts (use pdf-lib to create PDF with report branding, include strengths section, clarifications section, per-question feedback with STAR scores and example answers, Cindy avatar illustration, footer with "Generated with Claude Code")
- [ ] T108 [US3] Create GET /api/reports/[id]/pdf route in app/api/reports/[id]/pdf/route.ts (fetch report from database, call PDF generation utility, upload PDF to Supabase Storage, update reports.pdf_storage_path, stream PDF to response with Content-Type: application/pdf)
- [ ] T109 [US3] Add PDF download button to results page: "Download Report as PDF" button that calls GET /api/reports/[sessionId]/pdf
- [ ] T110 [US3] Add per-question coaching toggle to practice session setup: Checkbox for "Show coaching after each question (vs end-of-session)", store in sessions.per_question_coaching
- [ ] T111 [US3] Update active session page to support per-question coaching: If per_question_coaching=true, call POST /api/sessions/[id]/coaching with perQuestion=true after each answer, display CoachingFeedback modal before next question

**Checkpoint**: All P1 user stories (US1, US2, US3) should now be independently functional - this is MVP-ready

---

## Phase 6: User Story 4 - Daily Job Digest Email (Priority: P2)

**Goal**: Registered users opt into a daily email digest of highly relevant job postings matched to their resume and performance, delivered at 5:00 p.m. PT

**Independent Test**: A registered user with an uploaded resume opts into the job digest, receives a double opt-in confirmation email, and at 5:00 p.m. PT receives a curated list of jobs scoring ≥80% match with clear one-click unsubscribe

### Implementation for User Story 4

- [ ] T112 [P] [US4] Create job matching algorithm utility in lib/scoring/job-match.ts (calculate 0-100 match score: hard skills 50%, soft skills 20%, seniority 20%, logistics 10%, enforce must-have skills gate, return match reasons array)
- [ ] T113 [P] [US4] Create Microsoft Graph email utility in lib/microsoft-graph/send-email.ts (authenticate with client credentials, send email via Graph API from AI-Cindy@teamcinder.com with Reply-To recruiting@teamcinder.com, handle SPF/DKIM)
- [ ] T114 [US4] Create job email parser utility in lib/microsoft-graph/parse-jobs.ts (fetch emails from dedicated mailbox, use OpenAI structured output to parse job details: title, company, skills, must_haves, level, location, url, insert into jobs table with source, deduplicate by posting_url)
- [ ] T115 [US4] Create cron route POST /api/cron/curate-jobs in app/api/cron/curate-jobs/route.ts (verify Vercel cron secret header, call job parser for ZipRecruiter/Indeed/Mac's List, insert parsed jobs, return job count)
- [ ] T116 [US4] Create POST /api/jobs/match route in app/api/jobs/match/route.ts (for given user, fetch resume from profile, fetch recent active jobs, call job matching algorithm for each, insert into matches table with scores/reasons, return top matches)
- [ ] T117 [US4] Create job digest email template in lib/microsoft-graph/templates/digest-email.html (responsive HTML with job cards showing title, company, match score, match reasons, CTA button to posting_url, one-click unsubscribe link)
- [ ] T118 [US4] Create cron route POST /api/cron/send-digests in app/api/cron/send-digests/route.ts (verify cron secret, query users with digest_opt_in=TRUE and digest_confirmed=TRUE, for each user call POST /api/jobs/match, filter matches ≥80% score, if matches found render email template and send via Microsoft Graph, update matches.notified_at, return emailsSent count)
- [ ] T119 [US4] Add recruiting alert logic to send-digests cron: If match score ≥80% AND job.source='cinder', send internal email to recruiting@teamcinder.com with candidate summary and transcript access link, set matches.recruiting_alert_sent=TRUE
- [ ] T120 [US4] Update settings page app/(auth)/settings/page.tsx: Add job digest section with opt-in toggle (digest_opt_in), show confirmation status (digest_confirmed), unsubscribe button
- [ ] T121 [US4] Create POST /api/users/digest-optin route in app/api/users/digest-optin/route.ts (set digest_opt_in=TRUE, send double opt-in confirmation email with unique confirmation link, track digest_opt_in event)
- [ ] T122 [US4] Create GET /api/users/digest-confirm route in app/api/users/digest-confirm/[token]/route.ts (verify token, set digest_confirmed=TRUE, redirect to dashboard with success message)
- [ ] T123 [US4] Create GET /api/users/digest-unsubscribe route in app/api/users/digest-unsubscribe/[token]/route.ts (verify token, set digest_opt_in=FALSE and digest_confirmed=FALSE, show unsubscribe confirmation page)
- [ ] T124 [US4] Configure Vercel cron jobs in vercel.json: Add cron for /api/cron/send-digests at "0 17 \* \* _" (5pm PT = 00:00 UTC adjusted for DST), add cron for /api/cron/curate-jobs at "0 12 _ \* \*" (noon PT)

**Checkpoint**: User Story 4 complete and independently testable

---

## Phase 7: User Story 5 - Low-Anxiety Mode (Priority: P2)

**Goal**: Users who feel intimidated by traditional interviews can enable Low-Anxiety Mode for a gentler experience with only 3 questions, no adaptive follow-ups, and no numeric scores

**Independent Test**: A user selects Low-Anxiety Mode at session start, answers 3 questions with gentler prompts and pacing, receives supportive narrative feedback with no numeric scores, and completes an optional open-ended survey question about the experience

### Implementation for User Story 5

- [ ] T125 [US5] Update practice session setup page app/(coach)/practice/page.tsx: Add Low-Anxiety Mode toggle with explanation tooltip, when enabled force question_count=3 and disable adaptive follow-ups, show gentler UI messaging
- [ ] T126 [US5] Update POST /api/sessions route: When low_anxiety_enabled=TRUE, validate question_count=3, set per_question_coaching=FALSE
- [ ] T127 [US5] Update POST /api/sessions/[id]/questions route: When low_anxiety_enabled=TRUE, select gentler-worded questions from question bank (add is_gentle flag to questions table during seed), adjust pacing hints in response
- [ ] T128 [US5] Update POST /api/answers route: Skip adaptive follow-up generation if session.low_anxiety_enabled=TRUE
- [ ] T129 [US5] Update CoachingFeedback component: When low_anxiety_enabled=TRUE, hide all numeric STAR scores, show only narrative feedback and qualitative rubric tags (e.g., "clear" instead of "4/5")
- [ ] T130 [US5] Update coaching results page app/(coach)/practice/results/[id]/page.tsx: Detect Low-Anxiety Mode, hide score displays, use gentler language in UI ("strengths" instead of "performance")

**Checkpoint**: User Story 5 complete and independently testable

---

## Phase 8: User Story 6 - Post-Session Feedback & Referral (Priority: P3)

**Goal**: Users provide quick feedback on session helpfulness and can share a referral link to invite others, with clicks tracked for growth metrics

**Independent Test**: After completing a session, a user rates helpfulness on three Likert items (Like/Neutral/Dislike), sees a shareable referral link, and shares it with a friend whose click is tracked in admin analytics

### Implementation for User Story 6

- [ ] T131 [P] [US6] Create survey component in components/coach/SurveyForm.tsx (3 Likert items: helpfulness, advice quality, preparedness with Like/Neutral/Dislike radio buttons, if Low-Anxiety session add open-ended textarea: "Anything we should improve about Low-Anxiety Mode?")
- [ ] T132 [US6] Create POST /api/surveys route in app/api/surveys/route.ts (accept survey responses, insert into events table with event_type='survey_submitted', payload={responses, sessionId}, track survey_submitted event)
- [ ] T133 [US6] Update coaching results page app/(coach)/practice/results/[id]/page.tsx: Add SurveyForm component at bottom, show after report is viewed
- [ ] T134 [US6] Create referral link generator utility in lib/utils/referral.ts (generate unique referral code, encode with user_id, create shareable link: teamcinder.com/coach?ref=<code>)
- [ ] T135 [US6] Update coaching results page: Add referral section with "Share with Friends" heading, show shareable link with copy button, track share_link_clicked event on copy
- [ ] T136 [US6] Create referral tracking middleware in middleware.ts: Detect ?ref=<code> query param on landing page, decode user_id, insert event with event_type='share_link_clicked', payload={referrer_user_id, source: 'referral'}
- [ ] T137 [US6] Create admin analytics dashboard page in app/(auth)/admin/analytics/page.tsx (require admin role via middleware, display survey tallies with Like/Neutral/Dislike percentages, show referral click count and conversion rate, show total sessions and completion rates)
- [ ] T138 [US6] Create GET /api/admin/analytics route in app/api/admin/analytics/route.ts (query events table for survey tallies, referral clicks, session stats, return AnalyticsDashboard schema, require admin authentication)

**Checkpoint**: All user stories (US1-US6) should now be independently functional

---

## Phase 9: Admin & Observability

**Purpose**: Admin dashboard, recruiter access, audit logging, and cost monitoring

- [ ] T139 [P] Create admin sessions dashboard page in app/(auth)/admin/sessions/page.tsx (require admin role, display session summaries with filters by date range, show user_id, mode, question_count, avg_star_score, completion_rate, completed_at)
- [ ] T140 [P] Create GET /api/admin/sessions route in app/api/admin/sessions/route.ts (query sessions table with pagination and filters, return SessionSummary array, require admin auth)
- [ ] T141 [P] Create recruiter transcript access page in app/(auth)/admin/transcripts/[sessionId]/page.tsx (require recruiter role, display session details and all answer transcripts, show access reason: user_opted_in or performance_threshold, log view in audit_logs)
- [ ] T142 [P] Create GET /api/admin/transcripts/[sessionId] route in app/api/admin/transcripts/[sessionId]/route.ts (check RLS policy: recruiter_access_granted OR avg_star_score ≥4.2 AND completion_rate ≥0.70, fetch session + answers, insert audit log with action_type='view_transcript', return transcript data or 403)
- [ ] T143 Create cost tracking dashboard component in components/admin/CostDashboard.tsx (display current month cost gauge with color coding: green $0-$200, yellow $200-$285, red $285-$300, show breakdown by model: GPT-4 vs Whisper vs TTS, show projection: "At current rate, month will end at $X")
- [ ] T144 Add cost tracking dashboard to admin analytics page app/(auth)/admin/analytics/page.tsx
- [ ] T145 Update GET /api/admin/analytics route: Add cost tracking data by calling get_current_month_cost() function, breakdown by model from cost_tracking table
- [ ] T146 Create cost cap enforcement utility in lib/utils/cost-tracker.ts: Function to check if get_current_month_cost() ≥ monthly_cost_threshold_usd from system_config, if TRUE set audio_mode_enabled=FALSE in system_config
- [ ] T147 Update POST /api/sessions route: Check audio_mode_enabled flag before allowing mode='audio', if FALSE force mode='text' and return degradation message to frontend
- [ ] T148 Create degradation banner component in components/shared/DegradationBanner.tsx (display when audio mode disabled: "Audio mode temporarily unavailable due to high demand. Text mode available.")
- [ ] T149 Add degradation banner to practice session setup page when mode forced to text
- [ ] T150 Create monthly cost reset cron in app/api/cron/reset-audio-mode/route.ts (check if new billing period started via date_trunc('month', CURRENT_DATE), if new month set audio_mode_enabled=TRUE, clear degradation banner flag)
- [ ] T151 Add cron job to vercel.json: /api/cron/reset-audio-mode at "0 0 1 \* \*" (midnight on first of month)

---

## Phase 10: Security & Compliance

**Purpose**: Security hardening, data privacy controls, accessibility validation

- [ ] T152 [P] Implement session limits enforcement in POST /api/sessions route: Check if user has created 2 sessions today (query sessions table WHERE user_id=X AND created_at >= today), if TRUE return 429 with message: "You've reached your limit of 2 sessions today. Come back tomorrow!"
- [ ] T153 [P] Implement file format blocking in POST /api/uploads/resume route: Detect .pages files by extension, return 400 with helpful message: "Please export your .pages file to PDF and upload again"
- [ ] T154 [P] Create one-click data export utility in lib/utils/data-export.ts (query all user data: profile, sessions, answers, reports, consents, matches, events, package as JSON, comply with GDPR-like export requirements)
- [ ] T155 [P] Create POST /api/users/export route in app/api/users/export/route.ts (call data export utility, return JSON file download)
- [ ] T156 [P] Create one-click data deletion utility in lib/utils/data-delete.ts (cascade delete user records: ON DELETE CASCADE for profiles, sessions, answers, reports, matches, consents, events per data model, preserve audit_logs for legal compliance)
- [ ] T157 [P] Create DELETE /api/users/[id] route in app/api/users/[id]/route.ts (verify user owns account, call data deletion utility, log deletion in audit_logs, sign out user, redirect to goodbye page)
- [ ] T158 Update settings page app/(auth)/settings/page.tsx: Add "Export My Data" button (calls POST /api/users/export), add "Delete My Account" button with confirmation modal (calls DELETE /api/users/[userId])
- [ ] T159 Create Terms of Service page in app/(public)/terms/page.tsx (plain-English summary at top, link to full legal text, version number)
- [ ] T160 [P] Create Privacy Policy page in app/(public)/privacy/page.tsx (plain-English summary, data usage statement: "You own your content. Cinder may use it to improve the service.", version number)
- [ ] T161 [P] Run axe-core accessibility audit on all key pages: landing, practice setup, active session, coaching results, login, dashboard, settings
- [ ] T162 [P] Manual keyboard navigation testing: Verify all interactive elements accessible via Tab, Enter, Space, escape closes modals, focus trap in modals works
- [ ] T163 [P] Manual screen reader testing: Test with NVDA (Windows) and VoiceOver (Mac), verify all ARIA labels present, status messages announced
- [ ] T164 [P] Color contrast validation: Use WebAIM Contrast Checker to verify all text meets 4.5:1 (normal) or 3:1 (large) contrast ratios
- [ ] T165 Add reCAPTCHA to forms: Login form, resume upload form, session creation form (use reCAPTCHA v3 invisible with score threshold ≥0.5)

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T166 [P] Create Cindy avatar illustration in public/images/cindy-avatar.svg (illustrated non-photoreal character per branding guidelines)
- [ ] T167 [P] Add Cindy avatar to Navbar, coaching results page header, email digest template
- [ ] T168 [P] Create loading states for all async operations: Spinner components, skeleton loaders for report generation, progress bars for file uploads
- [ ] T169 [P] Create error handling components: ErrorBoundary catches React errors, API error toast messages, retry buttons for transient failures
- [ ] T170 [P] Add optimistic UI updates: Immediate feedback on answer submission, instant question progression, draft-save indicators
- [ ] T171 [P] Implement draft-save functionality: Auto-save session state to sessions.draft_save JSONB every 30 seconds, restore on page reload, clear on completion
- [ ] T172 [P] Add metadata and SEO: Update app/layout.tsx with title, description, Open Graph tags, Twitter Card, favicon
- [ ] T173 [P] Configure sitemap in app/sitemap.ts (public pages: landing, login, terms, privacy)
- [ ] T174 [P] Configure robots.txt in app/robots.ts (allow all, sitemap URL)
- [ ] T175 [P] Performance optimization: Add React.memo to heavy components (AudioRecorder, CoachingFeedback, ReportPane), use Suspense boundaries for streaming data, lazy load admin pages
- [ ] T176 [P] Add analytics event tracking: Implement trackEvent utility that inserts into events table, add tracking to all user actions: session_start, mic_check_passed, q_answered, coaching_viewed, survey_submitted, share_link_clicked, digest_opt_in
- [ ] T177 Create deployment checklist documentation in docs/deployment.md (environment variables, Supabase project setup, OpenAI API key, Microsoft Graph credentials, ClamAV service deployment, domain configuration, SPF/DKIM setup, reCAPTCHA keys, Vercel cron jobs, cost tracking dashboard access)
- [ ] T178 Create API documentation in docs/api.md (link to OpenAPI spec at specs/001-ai-interview-coach/contracts/rest-api.yaml, usage examples, authentication flow, rate limits)
- [ ] T179 Update README.md in repository root (project overview, tech stack, local development instructions per quickstart.md, link to spec and plan, contribution guidelines)
- [ ] T180 Run final validation per quickstart.md: Test all key journeys (guest session, registered session, Low-Anxiety Mode, job digest), verify WCAG 2.2 AA compliance, check performance targets (TTS ≤700ms, coaching ≤3s, report ≤10s), validate cost cap graceful degradation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-8)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Admin & Observability (Phase 9)**: Can start after Foundational, parallel with user stories
- **Security & Compliance (Phase 10)**: Can start after Foundational, parallel with user stories
- **Polish (Phase 11)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Builds on US1 but independently testable
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Enhances US2 but independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Requires resume upload from US2 but independently testable
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Modifies US1/US2 but independently testable
- **User Story 6 (P3)**: Can start after Foundational (Phase 2) - Enhances results page from US1/US2/US3 but independently testable

### Within Each User Story

- Models before services
- Services before API routes
- API routes before UI components
- Core implementation before integration with other stories
- Story complete before moving to next priority

### Parallel Opportunities

**Setup Phase (Phase 1)**:

- All dependency installations (T003-T009) can run in parallel
- Configuration tasks (T010-T013) can run in parallel after installations

**Foundational Phase (Phase 2)**:

- Database table definitions (T019-T030) can run in parallel
- RLS policy creation (T034-T042) can run in parallel after RLS is enabled
- Utility creation (T049-T065) can run in parallel

**User Story Phases (Phase 3-8)**:

- Once Foundational completes, all user stories can start in parallel if team capacity allows
- Within US1: T066-T067 (public pages) can be parallel
- Within US2: T081-T084 (auth pages) can be parallel, T088-T090 (security utilities) can be parallel
- Within US4: T112-T114 (job matching and email utilities) can be parallel

**Admin Phase (Phase 9)**:

- T139-T142 (admin dashboards and routes) can run in parallel

**Security Phase (Phase 10)**:

- T152-T165 (all security hardening tasks) can run in parallel

**Polish Phase (Phase 11)**:

- T166-T180 (all polish tasks) can run in parallel

---

## Parallel Execution Examples

### Setup Phase

```bash
# Launch all dependency installations together:
Task: "Install Supabase client: @supabase/supabase-js, @supabase/auth-helpers-nextjs"
Task: "Install OpenAI SDK: openai@latest"
Task: "Install Microsoft Graph SDK: @microsoft/microsoft-graph-client"
Task: "Install UI dependencies: @radix-ui/react-*, tailwindcss, class-variance-authority"
Task: "Install form dependencies: react-hook-form, zod, @hookform/resolvers"
Task: "Install PDF generation: pdf-lib"
Task: "Install dev dependencies: jest, @testing-library/react, playwright, msw, eslint, prettier"
```

### Foundational Phase

```bash
# Launch all database table definitions together:
Task: "Define users table: id, email, auth_provider, ..."
Task: "Define profiles table: id, user_id FK, ..."
Task: "Define sessions table: id, user_id FK (nullable), ..."
Task: "Define questions table: id, session_id FK, ..."
Task: "Define answers table: id, session_id FK, ..."
Task: "Define reports table: id, session_id FK UNIQUE, ..."
Task: "Define jobs table: id, source, title, ..."
Task: "Define matches table: id, user_id FK, job_id FK, ..."
Task: "Define events table: id, user_id FK (nullable), ..."
Task: "Define consents table: id, user_id FK, ..."
Task: "Define cost_tracking table: id, period_start, ..."
Task: "Define system_config table: key PRIMARY KEY, ..."
Task: "Define audit_logs table: id, admin_user_id FK, ..."
```

### User Story 1

```bash
# Launch public pages together:
Task: "Create public landing page in app/(public)/page.tsx"
Task: "Create public layout in app/(public)/layout.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Guest Practice Session)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Complete Phase 4: User Story 2 (Registered User Tailored Practice)
6. **STOP and VALIDATE**: Test User Story 2 independently
7. Complete Phase 5: User Story 3 (Comprehensive Coaching Report)
8. **STOP and VALIDATE**: Test User Story 3 independently
9. **MVP COMPLETE**: Deploy P1 features (guest + registered + reports)

### Incremental Delivery (Add P2 Features)

10. Complete Phase 6: User Story 4 (Daily Job Digest) → Deploy
11. Complete Phase 7: User Story 5 (Low-Anxiety Mode) → Deploy
12. Each story adds value without breaking previous stories

### Full Feature Set (Add P3 Features)

13. Complete Phase 8: User Story 6 (Post-Session Feedback & Referral) → Deploy
14. Complete Phase 9: Admin & Observability → Deploy
15. Complete Phase 10: Security & Compliance → Deploy
16. Complete Phase 11: Polish → Deploy

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T065)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (T066-T080)
   - **Developer B**: User Story 2 (T081-T102)
   - **Developer C**: User Story 3 (T103-T111)
3. Stories complete and integrate independently
4. Repeat for P2/P3 stories

---

## Notes

- Total tasks: **180**
- P1 (MVP) tasks: **111** (62% of total: Setup + Foundational + US1 + US2 + US3)
- P2 tasks: **31** (17% of total: US4 + US5)
- P3 tasks: **8** (4% of total: US6)
- Admin/Security/Polish tasks: **30** (17% of total)
- Parallel opportunities: **~60 tasks** marked with [P] can run concurrently
- Each user story independently completable and testable
- Automated tests required: unit, integration, E2E, and accessibility tests per TDD approach
- Commit after each task or logical group
- Stop at checkpoints to validate stories independently before proceeding
