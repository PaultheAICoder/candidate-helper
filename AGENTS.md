# Repository Guidelines

## Project Structure & Module Organization
- App routes and UI live under `app/` and `components/`.
- API routes: `app/api/**` (sessions, answers, admin, digests, etc.).
- Library logic: `lib/` (OpenAI, scoring, security, Supabase helpers, email, utilities).
- Database schema/migrations: `supabase/`.
- Tests mirror sources under `**/__tests__` and `lib/**/__tests__`.
- Assets: `public/` (including `public/images/cindy-avatar.svg`).

## Build, Test, and Development Commands
- `npm run dev` – start Next.js dev server.
- `npm run build` – Next.js production build.
- `npm run test` – run Jest test suite.
- `npm run lint` – lint codebase with ESLint.
- `npm run test:e2e` – run Playwright e2e tests (if configured).

## Coding Style & Naming Conventions
- TypeScript/React with functional components; favor hooks.
- Use ESLint + Prettier (see `eslint.config.mjs`, `package.json` scripts).
- Keep components small and composable; prefer descriptive prop names.
- Naming: kebab-case for files under `app/`, PascalCase for components, camelCase for functions/variables.
- Avoid introducing warnings; fix lint/test warnings before merge.

## Testing Guidelines
- Framework: Jest for unit/integration; Playwright for e2e (where applicable).
- Place tests alongside code in `__tests__` or the same folder.
- Naming: `*.test.ts(x)` or `*.spec.ts(x)`.
- Run `npm test` before opening a PR; ensure no warnings and maintain coverage on new code paths.

## Commit & Pull Request Guidelines
- Commit messages: present tense, concise (e.g., `Add audio transcription endpoint`).
- PRs should include: summary of changes, linked issue (e.g., #123), testing performed (`npm test`, etc.), and screenshots for UI changes when relevant.
- Keep PRs scoped; avoid unrelated refactors mixed with feature fixes.

## Security & Configuration Tips
- Required env vars for core flows: Supabase keys, OpenAI key, SMTP (`EMAIL_HOST/PORT/USER/PASS/FROM`), `CRON_SECRET`, `DIGEST_TOKEN_SECRET`.
- Never commit secrets; use `.env.local` for local dev.
- For admin endpoints, only `users.admin` flag or `@teamcinder.com` emails are authorized.
