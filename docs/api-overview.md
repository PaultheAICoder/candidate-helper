# API Overview

Key Next.js API routes (authentication via Supabase; all paths relative to `/api`).

## Practice Sessions
| Path | Method | Purpose | Auth |
| ---- | ------ | ------- | ---- |
| `/sessions` | POST | Create practice session (guest or signed-in); enforces Low-Anxiety rules and daily limits | Optional (guest allowed) |
| `/sessions/[id]` | GET | Fetch session metadata | Session owner or guest token |
| `/sessions/[id]/questions` | GET | Generate or return question set for session | Session owner or guest token |
| `/answers` | POST | Submit transcript/metadata for a question | Session owner or guest token |
| `/answers/[id]/transcribe` | POST | Transcribe uploaded audio blob via OpenAI Whisper | Authenticated; must own answer |
| `/sessions/[id]/coaching` | POST | Generate per-question coaching + aggregate report rows | Session owner or guest token |

## Reports
| Path | Method | Purpose | Auth |
| ---- | ------ | ------- | ---- |
| `/reports/[id]` | GET | Fetch coaching report content | Session owner or guest token |
| `/reports/[id]/pdf` | GET | Download or generate report PDF (stored in `reports` bucket) | Session owner or guest token |

## Uploads
| Path | Method | Purpose | Auth |
| ---- | ------ | ------- | ---- |
| `/uploads/resume` | POST (multipart) | Virus-scan, parse, and store resume; updates profile | Authenticated |
| `/uploads/jd` | POST (multipart) | Accept job description upload for tailoring | Authenticated |

## Jobs & Digest
| Path | Method | Purpose | Auth |
| ---- | ------ | ------- | ---- |
| `/jobs/match` | POST | Return top job matches for current user profile | Authenticated |
| `/users/digest-optin` | POST | Start opt-in flow; sends confirmation email | Authenticated |
| `/users/digest-confirm/[token]` | GET | Confirm digest subscription | Token link |
| `/users/digest-unsubscribe/[token]` | GET | One-click unsubscribe | Token link |

## User Management
| Path | Method | Purpose | Auth |
| ---- | ------ | ------- | ---- |
| `/users/export` | POST | Export user data as JSON | Authenticated |
| `/users/[id]` | DELETE | Delete user (self or admin) | Authenticated; admin can delete others |

## Admin (domain `@teamcinder.com` or `users.admin=true`)
| Path | Method | Purpose |
| ---- | ------ | ------- |
| `/admin/analytics` | GET | Aggregate survey tallies, referral clicks, session stats |
| `/admin/sessions` | GET | List sessions with pagination/filtering |
| `/admin/transcripts/[id]` | GET | Fetch transcript for review |
| `/admin/costs` | GET | Current cost usage and caps |

## Cron / Scheduled Jobs (header `x-cron-secret: ${CRON_SECRET}`)
| Path | Method | Purpose |
| ---- | ------ | ------- |
| `/cron/send-digests` | POST | Send daily job digest emails to confirmed subscribers |
| `/cron/curate-jobs` | POST | Curate job pool and store in database |
| `/cron/enforce-cost-cap` | POST | Enforce monthly cost cap; degrade features if exceeded |
| `/cron/reset-audio-mode` | POST | Restore audio availability when cost window resets |

## OpenAI Utility
| Path | Method | Purpose | Auth |
| ---- | ------ | ------- | ---- |
| `/openai/transcribe` | POST | Direct transcription helper for uploads | Authenticated |
