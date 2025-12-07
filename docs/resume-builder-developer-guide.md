# Resume Builder Developer Guide

## Architecture Overview

The Resume Builder is a multi-step wizard that guides users through creating a professional resume with AI-powered content enhancement.

## Tech Stack

- **Frontend**: Next.js 14 App Router, React 18, TypeScript
- **UI**: Radix UI, TailwindCSS, Lucide Icons
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + Storage)
- **AI**: OpenAI GPT-4o (content enhancement, summary generation, LinkedIn parsing)
- **Export**: pdf-lib (PDF), docx (Word), plain text
- **State**: React hooks, localStorage for guests

## Project Structure

```
app/
├── (coach)/resume-builder/
│   └── page.tsx                    # Main multi-step wizard
└── api/resume-builder/
    ├── draft/route.ts              # Draft CRUD
    ├── enhance/route.ts            # AI content enhancement
    ├── generate-summary/route.ts   # AI summary generation
    ├── import-linkedin/route.ts    # LinkedIn import
    ├── use-for-practice/route.ts   # Practice integration
    └── export/
        ├── pdf/route.ts            # PDF export
        ├── docx/route.ts           # Word export
        └── txt/route.ts            # Text export

components/resume-builder/
├── BuilderStepper.tsx              # Progress indicator
├── BasicInfoForm.tsx               # Step 1
├── WorkHistoryBuilder.tsx          # Step 2 (with AI)
├── EducationSkillsForm.tsx         # Step 3
├── SummaryGenerator.tsx            # Step 4 (with AI)
├── ResumePreview.tsx               # Step 5
└── LinkedInImportModal.tsx         # LinkedIn import UI

lib/
├── types/resume-builder.ts         # TypeScript types
├── openai/
│   ├── resume-enhancer.ts          # Content enhancement
│   ├── summary-generator.ts        # Summary generation
│   └── linkedin-parser.ts          # LinkedIn parsing
├── resume/
│   ├── pdf-generator.ts            # PDF creation
│   ├── docx-generator.ts           # Word creation
│   ├── txt-generator.ts            # Text creation
│   └── upload-to-storage.ts        # Supabase upload
└── utils/
    └── resume-storage.ts           # localStorage utilities
```

## Database Schema

### `resume_drafts`

```sql
CREATE TABLE resume_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  step_completed TEXT CHECK (step_completed IN
    ('basic_info', 'work_history', 'education', 'summary', 'review')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT resume_drafts_user_unique UNIQUE (user_id)
);
```

**JSONB Structure:**
```typescript
{
  basic_info?: {
    full_name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin_url?: string;
  };
  work_history?: Array<{
    id: string;
    title: string;
    company: string;
    start_date: string; // YYYY-MM
    end_date?: string;
    is_current: boolean;
    raw_description: string;
    enhanced_bullets: string[];
  }>;
  education?: Array<{
    id: string;
    degree: string;
    institution: string;
    field?: string;
    graduation_year?: string;
  }>;
  skills?: string[];
  summary?: string;
}
```

### `resume_templates`

```sql
CREATE TABLE resume_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  template_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

### Draft Management

**GET /api/resume-builder/draft**
- Get current user's draft
- Returns: `{ draft: ResumeDraft | null }`
- Auth: Required (returns 401 if guest)

**POST /api/resume-builder/draft**
- Create or update draft
- Body: `{ step_completed?: ResumeStep; data: Partial<ResumeData> }`
- Returns: `{ draft: ResumeDraft }`
- Merges with existing data

**DELETE /api/resume-builder/draft**
- Delete current user's draft
- Returns: `{ success: boolean }`

### AI Features

**POST /api/resume-builder/enhance**
- Enhance work description with AI
- Body: `{ job_description: string; context?: { company, title } }`
- Returns: `{ needs_clarification: boolean; questions?: string[]; suggestions: string[] }`
- Costs: ~$0.003 per request

**POST /api/resume-builder/generate-summary**
- Generate professional summaries
- Body: `{ work_history, education, skills }`
- Returns: `{ summaries: string[] }` (3 options)
- Costs: ~$0.006 per request

**POST /api/resume-builder/import-linkedin**
- Parse LinkedIn profile text
- Body: `{ linkedinText: string }`
- Returns: `{ data: Partial<ResumeData> }`
- Costs: ~$0.012 per request

### Export

**GET /api/resume-builder/export/pdf**
- Generate PDF resume
- Returns: PDF file download
- Format: ATS-friendly, no tables

**GET /api/resume-builder/export/docx**
- Generate Word document
- Returns: DOCX file download
- Format: Editable in Microsoft Word

**GET /api/resume-builder/export/txt**
- Generate plain text
- Returns: TXT file download
- Format: Copy-paste friendly

### Integration

**POST /api/resume-builder/use-for-practice**
- Upload resume and prepare for practice
- Returns: `{ success: boolean; resumeUrl: string; redirectTo: string }`
- Uploads to Supabase Storage
- Updates user profile

## Key Components

### BuilderStepper

Displays progress through 5 steps with visual indicators.

**Props:**
- `currentStep: ResumeStep`
- `completedSteps: ResumeStep[]`

**Features:**
- ARIA labels for accessibility
- Visual state (completed, current, pending)

### WorkHistoryBuilder

Most complex component with AI integration.

**Features:**
- Add/edit/remove jobs
- Real-time AI enhancement
- Clarifying questions flow
- Drag-to-reorder (future)

**State Management:**
- `experiences: WorkExperience[]` - Saved jobs
- `currentJob: Partial<WorkExperience>` - In-progress
- `enhancementResult` - AI suggestions

### ResumePreview

Final review with live editing and export.

**Features:**
- Inline section editing
- 3 export formats (PDF, DOCX, TXT)
- Practice integration button

## OpenAI Integration

### Cost Tracking

All OpenAI calls use `trackCost()`:

```typescript
const cost = calculateGPTCost("gpt-4o", {
  prompt_tokens: usage.prompt_tokens,
  completion_tokens: usage.completion_tokens,
});

await trackCost({
  model: "gpt-4o",
  tokensUsed: usage.total_tokens,
  estimatedCostUsd: cost,
});
```

### Constitutional Compliance

**CRITICAL RULES:**
1. NEVER fabricate metrics or accomplishments
2. Ask clarifying questions when information is vague
3. Only use facts explicitly provided by user
4. Track all costs to maintain budget

### Prompts

**Content Enhancement:**
```typescript
const systemPrompt = `You are a professional resume coach...
CRITICAL RULES:
1. NEVER fabricate numbers, metrics, or accomplishments
2. If user's description lacks quantifiable details, ask questions
3. Use action verbs
4. Follow STAR framework
5. Be encouraging and supportive`;
```

**Summary Generation:**
```typescript
const systemPrompt = `You are an expert resume writer...
GUIDELINES:
1. Active voice and confident tone
2. Highlight key strengths
3. 2-3 sentences long
4. Avoid clichés
5. Tailor to career level
DO NOT fabricate experience or skills`;
```

## State Management

### Server State (Authenticated Users)

- Auto-save every 30 seconds
- Draft API persists to database
- RLS ensures user isolation

### Local State (Guest Users)

- localStorage with 7-day expiry
- `saveLocalDraft()` on changes
- `loadLocalDraft()` on mount
- `migrateLocalDraftToServer()` on sign-in

### Migration Flow

```typescript
// On sign-in
const localDraft = loadLocalDraft();
if (localDraft) {
  await POST("/api/resume-builder/draft", localDraft);
  clearLocalDraft();
}
```

## Export Generation

### PDF (pdf-lib)

```typescript
const doc = await PDFDocument.create();
const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

// Add content with proper fonts and spacing
page.drawText(name, { x, y, size, font, color });

const pdfBytes = await doc.save();
```

**Features:**
- Standard fonts (Times, Helvetica)
- Proper margins and spacing
- Text wrapping
- ATS-friendly (no images/tables)

### DOCX (docx library)

```typescript
const doc = new Document({
  sections: [{
    children: [
      new Paragraph({ text: name, heading: HeadingLevel.TITLE }),
      new Paragraph({ text: bullet, bullet: { level: 0 } }),
    ]
  }]
});

const buffer = await Packer.toBuffer(doc);
```

### TXT (Plain Text)

Simple concatenation with formatting:
```
NAME
====

Contact | Info | Here

PROFESSIONAL SUMMARY
--------------------

Summary text...
```

## Analytics Events

All tracked via `trackEvent()`:

```typescript
// Page load
trackEvent("resume_builder_started");

// Step completion
trackEvent("resume_builder_step_completed", { step_name });

// AI usage
trackEvent("content_enhancement_requested");
trackEvent("ai_suggestion_accepted");

// Exports
trackEvent("resume_exported", { format });

// Integration
trackEvent("resume_used_for_practice");
trackEvent("resume_linkedin_imported");
```

## Testing

### Unit Tests

```bash
npm run test:unit
```

Test files in `lib/__tests__/`:
- `resume-enhancer.test.ts`
- `summary-generator.test.ts`
- `pdf-generator.test.ts`

Mock OpenAI with MSW.

### E2E Tests

```bash
npm run test:e2e
```

Test scenarios:
1. Guest builds resume → export PDF
2. User signs in → builds resume → uses for practice
3. LinkedIn import → enhancement → export
4. Draft save/restore

### Accessibility

```bash
npm run test:a11y
```

- WCAG 2.2 AA compliance
- Keyboard navigation
- Screen reader support
- Focus management

## Performance Targets

- **AI Enhancement**: ≤2 seconds
- **Summary Generation**: ≤3 seconds
- **LinkedIn Import**: ≤5 seconds
- **PDF Export**: ≤3 seconds
- **Auto-save**: Debounced 30s

## Error Handling

### User-Facing Errors

```typescript
try {
  // API call
} catch (error) {
  console.error("Error:", error);
  alert("User-friendly message");
  // Fallback behavior
}
```

### Fallback Strategies

1. API fails → localStorage
2. OpenAI fails → Show error, allow retry
3. Export fails → Try different format
4. Upload fails → Keep local draft

## Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional (uses existing Supabase config)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Deployment Checklist

- [ ] Database migration applied
- [ ] Supabase Storage bucket created ("resumes")
- [ ] OpenAI API key configured
- [ ] Cost tracking enabled
- [ ] RLS policies active
- [ ] Navigation link added
- [ ] Analytics events working
- [ ] Export formats tested

## Future Enhancements

- Multiple resume templates
- Resume version history
- Drag-and-drop job reordering
- Skills recommendations from job descriptions
- Resume scoring/ATS optimization
- Cover letter generation
- One-click application integration

## Troubleshooting

### Common Issues

**TypeScript errors:**
- Regenerate types: `npm run db:types`
- Check Supabase migration applied

**OpenAI rate limits:**
- Check cost tracking table
- Verify API key valid
- Implement exponential backoff

**Storage upload fails:**
- Check Supabase bucket exists
- Verify RLS policies
- Check file size limits

## Support

- GitHub Issues: [candidate-helper/issues](https://github.com/McSchnizzle/candidate-helper/issues)
- Spec Kit Docs: `specs/001-ai-interview-coach/`
- Feature Sketch: `docs/resume-builder-feature-sketch.md`
