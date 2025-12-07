# Resume Builder Feature Sketch

## Overview

A conversational AI-powered resume builder that helps users create professional resumes from sparse information (like a LinkedIn profile) through guided questions and intelligent content enhancement.

## User Flow

### Entry Points
1. **New Users**: "Don't have a resume? Let's build one together!" CTA on practice page
2. **LinkedIn Import**: "Import from LinkedIn" button that scrapes public profile data
3. **Settings Page**: "Build/Rebuild Resume" option

### Core Experience

```
┌─────────────────────────────────────────────────────────┐
│  Step 1: Basic Info                                     │
│  - Name, contact, location (prefilled if signed in)    │
│  - LinkedIn URL (optional for import)                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Step 2: Conversational Work History                    │
│  - AI asks about each job one at a time                 │
│  - "Tell me about your role at [company]"               │
│  - "What were your main accomplishments?"               │
│  - AI helps rephrase weak answers into strong bullets   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Step 3: Education & Skills                             │
│  - Simple form for degrees/institutions                 │
│  - AI suggests skills based on work history             │
│  - User can add/remove skills                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Step 4: Professional Summary                           │
│  - AI generates 2-3 options based on full profile       │
│  - User selects and edits preferred version             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Step 5: Review & Export                                │
│  - Live preview with multiple templates                 │
│  - Edit any section inline                              │
│  - Export as PDF, DOCX, or plain text                   │
│  - "Use this resume for interview practice" →           │
└─────────────────────────────────────────────────────────┘
```

## Key Features

### 1. LinkedIn Profile Import
- Paste LinkedIn URL → AI scrapes public data
- Extracts: name, headline, work history, education, skills
- Pre-populates builder fields (user reviews/edits)

### 2. AI-Powered Content Enhancement
**Problem**: Users write weak bullet points like "Responsible for customer service"

**Solution**: AI coaching in real-time
- User types initial description
- AI analyzes and suggests improvements:
  - "Try quantifying this: How many customers did you serve?"
  - "Add an outcome: What improved as a result?"
  - Generates 2-3 enhanced versions using STAR framework

**Example**:
```
User input: "Managed social media accounts"

AI suggestions:
1. "Managed social media accounts for 5+ clients, increasing engagement by 40% through data-driven content strategy"
2. "Led social media strategy across Instagram, Twitter, and LinkedIn, growing follower base from 2K to 15K in 6 months"
3. "Developed and executed social media campaigns that drove 25% increase in website traffic and 50+ qualified leads"
```

### 3. Draft Persistence
- Auto-save every 30 seconds (like practice sessions)
- "Resume Draft" saved to database
- Can resume building anytime from settings

### 4. Multiple Export Formats
- **PDF**: Professional formatting with multiple templates (Classic, Modern, Minimal)
- **DOCX**: For ATS systems that prefer Word
- **Plain Text**: For copy-paste into application forms
- **JSON**: Structured data for programmatic use

### 5. Seamless Integration
After building resume:
- "Practice interview questions with this resume" → redirects to practice session
- Auto-uploads built resume to profile
- Available for job matching immediately

## Technical Architecture

### Database Schema Changes

```sql
-- New table: resume_drafts
CREATE TABLE resume_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  step_completed TEXT, -- 'basic_info', 'work_history', 'education', 'summary', 'review'
  data JSONB NOT NULL, -- Stores all resume data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- JSONB structure for data field:
{
  "basic_info": {
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "503-555-0123",
    "location": "Portland, OR",
    "linkedin_url": "https://linkedin.com/in/janedoe"
  },
  "work_history": [
    {
      "title": "Marketing Coordinator",
      "company": "Acme Corp",
      "start_date": "2020-06",
      "end_date": "2023-03",
      "is_current": false,
      "raw_description": "Managed social media",
      "enhanced_bullets": [
        "Managed social media accounts for 5+ clients, increasing engagement by 40%",
        "Created weekly content calendars and analytics reports"
      ]
    }
  ],
  "education": [...],
  "skills": ["Social Media Marketing", "Google Analytics", "Adobe Creative Suite"],
  "summary": "Marketing professional with 3+ years..."
}

-- New table: resume_templates
CREATE TABLE resume_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 'classic', 'modern', 'minimal'
  description TEXT,
  template_data JSONB NOT NULL, -- Styling/layout configuration
  is_active BOOLEAN DEFAULT TRUE
);
```

### API Routes

```
POST   /api/resume-builder/draft          # Create/update draft
GET    /api/resume-builder/draft          # Get current draft
POST   /api/resume-builder/enhance        # Enhance content with AI
POST   /api/resume-builder/import-linkedin # Import from LinkedIn URL
POST   /api/resume-builder/generate-summary # Generate professional summary
GET    /api/resume-builder/export/[format] # Export as PDF/DOCX/TXT
DELETE /api/resume-builder/draft          # Delete draft
```

### OpenAI Prompts

**Content Enhancement** (`lib/openai/resume-enhancer.ts`):
```typescript
const ENHANCEMENT_PROMPT = `You are a professional resume coach. The user has provided this job description:

"${userInput}"

Help them create 2-3 strong resume bullets that:
1. Use action verbs (achieved, led, developed, etc.)
2. Include quantifiable metrics where possible
3. Highlight impact and outcomes
4. Follow STAR framework (Situation, Task, Action, Result)
5. NEVER fabricate numbers or accomplishments - ask clarifying questions if metrics are missing

Generate variations that maintain accuracy while presenting the work professionally.`;
```

**LinkedIn Import** (`lib/openai/linkedin-parser.ts`):
```typescript
// Similar to resume-parser.ts but for LinkedIn HTML content
// Extracts: headline, about, experience, education, skills
```

**Summary Generation** (`lib/openai/summary-generator.ts`):
```typescript
const SUMMARY_PROMPT = `Based on this complete resume data:

Work History: ${JSON.stringify(workHistory)}
Education: ${JSON.stringify(education)}
Skills: ${skills.join(', ')}

Generate 2-3 professional summary options (2-3 sentences each) that:
1. Highlight key strengths and expertise
2. Mention years of experience and core competencies
3. Are tailored to the user's career level (junior/mid/senior)
4. Avoid clichés and generic phrases
5. Use active voice and confident tone`;
```

### UI Components

```
components/resume-builder/
├── BuilderStepper.tsx          # Progress indicator (5 steps)
├── BasicInfoForm.tsx           # Step 1: Contact info
├── WorkHistoryBuilder.tsx      # Step 2: Conversational job entry
├── ContentEnhancer.tsx         # AI suggestions for bullets
├── EducationSkillsForm.tsx     # Step 3: Degrees & skills
├── SummaryGenerator.tsx        # Step 4: AI-generated summaries
├── ResumePreview.tsx           # Live preview with template selector
├── ExportDialog.tsx            # Download options
└── LinkedInImportModal.tsx     # Import flow
```

### Cost Control

**OpenAI Usage**:
- Content enhancement: ~500 tokens per job description → ~$0.003 per enhancement
- Summary generation: ~1000 tokens → ~$0.006
- LinkedIn import: ~2000 tokens → ~$0.012

**Estimated Cost per Resume Build**: ~$0.05-0.10 (10-15 AI interactions)
- Well within monthly $300 budget
- Track costs in `cost_tracking` table as usual

## Constitutional Compliance

### ✅ Accessibility-First
- All steps keyboard navigable
- Screen reader announcements for AI suggestions
- Text-only mode available (no fancy preview)
- WCAG 2.2 AA compliant forms

### ✅ Ethical AI & Data Privacy
- AI NEVER fabricates accomplishments or metrics
- If user says "increased sales", AI asks "by how much?" rather than guessing
- Resume drafts deletable via one-click data export/delete
- Plain-English consent before LinkedIn import

### ✅ Performance & Cost Control
- Content enhancement: ≤2s response time
- LinkedIn import: ≤5s (web scraping + parsing)
- Auto-save debounced to avoid excessive writes
- Track OpenAI costs for resume builder separately

### ✅ Progressive Enhancement
- Guest users can build resume without account (stored in localStorage)
- Registered users get cloud sync and export options
- Works without JavaScript (form-based fallback)

### ✅ User Safety & Consent
- LinkedIn import requires explicit "I consent to import public data" checkbox
- PII detection still runs (strip SSN/DOB if somehow in LinkedIn data)
- No virus scanning needed (text-only input, not file uploads)

## Success Metrics

**Activation**:
- % of users who start resume builder
- % of LinkedIn imports vs. manual entry
- Average completion rate (reach Step 5)

**Engagement**:
- Average AI enhancements requested per job
- Average time spent in builder (target: 15-20 minutes)
- % of users who edit AI suggestions vs. accept as-is

**Conversion**:
- % of builder completions → interview practice session
- % of built resumes used in job digest opt-in

## Open Questions

1. **LinkedIn Scraping**: LinkedIn actively blocks scrapers. May need to use official API (requires LinkedIn partnership) or have users paste HTML manually.
   - **Mitigation**: Start with manual copy-paste of LinkedIn "About" and experience sections

2. **Template Complexity**: How many resume templates to support initially?
   - **Recommendation**: Start with 1 clean template, expand later

3. **Editing After Export**: Should users be able to re-import an exported resume to make edits?
   - **Recommendation**: Yes, store mapping between export and draft_id

4. **Guest User Limitation**: How to handle guest users who build resume but don't sign up?
   - **Recommendation**: Show persistent "Sign up to save your resume" banner, store in localStorage for 7 days

## Implementation Priority

**Phase 1 - MVP** (Critical Path):
1. Database schema + API routes
2. Basic info form + work history conversational builder
3. Content enhancement with OpenAI
4. Single template PDF export
5. Integration with practice session

**Phase 2 - Enhancement**:
6. LinkedIn import (manual paste)
7. Multiple resume templates
8. DOCX/TXT export formats
9. Summary generation with options

**Phase 3 - Polish**:
10. Guest user localStorage persistence
11. Advanced editing (drag-to-reorder experience)
12. A11y audit + testing
13. Analytics integration

---

**Estimated Timeline**: 3-4 weeks for Phase 1 MVP
**Dependencies**: None (independent feature)
**Risk**: LinkedIn scraping may be blocked → mitigate with manual paste fallback
