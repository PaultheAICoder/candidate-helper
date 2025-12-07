-- Resume Builder Schema Migration
-- Creates tables for resume drafts and templates

-- Resume Drafts Table
-- Stores in-progress resume data with JSONB for flexibility
CREATE TABLE resume_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  step_completed TEXT CHECK (step_completed IN ('basic_info', 'work_history', 'education', 'summary', 'review')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT resume_drafts_user_unique UNIQUE (user_id)
);

-- Resume Templates Table
-- Stores available resume templates for export
CREATE TABLE resume_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_resume_drafts_user_id ON resume_drafts(user_id);
CREATE INDEX idx_resume_drafts_updated_at ON resume_drafts(updated_at DESC);
CREATE INDEX idx_resume_templates_active ON resume_templates(is_active) WHERE is_active = TRUE;

-- RLS Policies for resume_drafts
ALTER TABLE resume_drafts ENABLE ROW LEVEL SECURITY;

-- Users can only access their own drafts
CREATE POLICY "Users can view own resume drafts"
  ON resume_drafts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resume drafts"
  ON resume_drafts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resume drafts"
  ON resume_drafts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own resume drafts"
  ON resume_drafts
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for resume_templates
ALTER TABLE resume_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can read active templates (needed for guest users)
CREATE POLICY "Anyone can view active templates"
  ON resume_templates
  FOR SELECT
  USING (is_active = TRUE);

-- Only authenticated users with admin role can modify templates
CREATE POLICY "Admins can manage templates"
  ON resume_templates
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Seed initial template data
INSERT INTO resume_templates (name, description, template_data) VALUES
(
  'classic',
  'Clean and professional template suitable for most industries',
  '{
    "fonts": {
      "heading": "serif",
      "body": "sans-serif"
    },
    "colors": {
      "primary": "#000000",
      "secondary": "#333333",
      "accent": "#0066CC"
    },
    "layout": {
      "margins": {
        "top": 0.75,
        "bottom": 0.75,
        "left": 0.75,
        "right": 0.75
      },
      "spacing": {
        "section": 0.25,
        "item": 0.125
      }
    },
    "sections": {
      "order": ["header", "summary", "experience", "education", "skills"],
      "header": {
        "align": "center",
        "fontSize": 16
      },
      "summary": {
        "show": true,
        "fontSize": 10
      },
      "experience": {
        "showDates": true,
        "bulletStyle": "disc",
        "fontSize": 10
      },
      "education": {
        "showGradYear": true,
        "fontSize": 10
      },
      "skills": {
        "layout": "inline",
        "separator": " " ",
        "fontSize": 10
      }
    }
  }'::jsonb
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_resume_draft_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER resume_drafts_updated_at
  BEFORE UPDATE ON resume_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_resume_draft_timestamp();

-- Comments for documentation
COMMENT ON TABLE resume_drafts IS 'Stores in-progress resume data for authenticated users';
COMMENT ON TABLE resume_templates IS 'Available resume templates for export formatting';
COMMENT ON COLUMN resume_drafts.data IS 'JSONB structure: {basic_info, work_history[], education[], skills[], summary}';
COMMENT ON COLUMN resume_templates.template_data IS 'JSONB configuration for fonts, colors, layout, and section ordering';
