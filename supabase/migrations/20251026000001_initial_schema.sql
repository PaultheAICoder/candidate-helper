-- Migration 001: Initial Schema
-- AI Interview Coach (Cindy from Cinder)
-- Created: 2025-10-26

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

-- Users table: Registered accounts
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    auth_provider VARCHAR(50) NOT NULL CHECK (auth_provider IN ('google', 'email_magic_link')),
    work_auth_status VARCHAR(50),
    comp_range_min INTEGER CHECK (comp_range_min >= 0),
    comp_range_max INTEGER CHECK (comp_range_max >= comp_range_min),
    remote_preference VARCHAR(20) CHECK (remote_preference IN ('remote', 'hybrid', 'onsite', 'flexible')),
    location VARCHAR(255),
    eligibility_confirmed BOOLEAN DEFAULT FALSE,
    recruiter_access_granted BOOLEAN DEFAULT FALSE,
    digest_opt_in BOOLEAN DEFAULT FALSE,
    digest_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table: Career details (1:1 with users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_roles TEXT[],
    seniority_level VARCHAR(20) CHECK (seniority_level IN ('entry', 'mid', 'senior', 'lead', 'executive')),
    resume_filename VARCHAR(255),
    resume_storage_path TEXT,
    resume_uploaded_at TIMESTAMPTZ,
    resume_file_size_bytes INTEGER CHECK (resume_file_size_bytes <= 3145728), -- 3MB limit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_profile UNIQUE(user_id)
);

-- Sessions table: Practice interview sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for guest sessions
    mode VARCHAR(10) NOT NULL CHECK (mode IN ('audio', 'text')),
    low_anxiety_enabled BOOLEAN DEFAULT FALSE,
    per_question_coaching BOOLEAN DEFAULT FALSE,
    job_description_text TEXT,
    target_role_override VARCHAR(255),
    question_count INTEGER NOT NULL CHECK (question_count BETWEEN 3 AND 10),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    avg_star_score DECIMAL(3,2) CHECK (avg_star_score BETWEEN 1.00 AND 5.00),
    completion_rate DECIMAL(3,2) CHECK (completion_rate BETWEEN 0.00 AND 1.00),
    draft_save JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table: Individual interview questions
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'tailored_technical',
        'tailored_behavioral',
        'soft_skills_conflict',
        'soft_skills_leadership',
        'soft_skills_ownership',
        'soft_skills_collaboration',
        'soft_skills_failure',
        'soft_skills_communication'
    )),
    is_tailored BOOLEAN NOT NULL,
    is_gentle BOOLEAN DEFAULT FALSE, -- For Low-Anxiety Mode
    follow_up_question TEXT,
    follow_up_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_question_order UNIQUE(session_id, question_order)
);

-- Answers table: User responses to questions
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    question_id UUID UNIQUE NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    transcript_text TEXT NOT NULL,
    duration_seconds INTEGER CHECK (duration_seconds BETWEEN 1 AND 210), -- Max 3.5 min
    retake_used BOOLEAN DEFAULT FALSE,
    extension_used BOOLEAN DEFAULT FALSE,
    star_situation_score INTEGER CHECK (star_situation_score BETWEEN 1 AND 5),
    star_task_score INTEGER CHECK (star_task_score BETWEEN 1 AND 5),
    star_action_score INTEGER CHECK (star_action_score BETWEEN 1 AND 5),
    star_result_score INTEGER CHECK (star_result_score BETWEEN 1 AND 5),
    specificity_tag VARCHAR(20) CHECK (specificity_tag IN ('specific', 'vague', 'unclear')),
    impact_tag VARCHAR(20) CHECK (impact_tag IN ('high_impact', 'medium_impact', 'low_impact')),
    clarity_tag VARCHAR(20) CHECK (clarity_tag IN ('clear', 'rambling', 'incomplete')),
    honesty_flag BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table: Coaching feedback (1:1 with sessions)
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID UNIQUE NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    strengths JSONB NOT NULL,
    clarifications JSONB NOT NULL,
    per_question_feedback JSONB NOT NULL,
    pdf_storage_path TEXT,
    pdf_generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs table: Curated job postings
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) NOT NULL CHECK (source IN ('cinder', 'ziprecruiter', 'indeed', 'macslist')),
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    skills TEXT[] NOT NULL,
    must_have_skills TEXT[],
    seniority_level VARCHAR(20) NOT NULL CHECK (seniority_level IN ('entry', 'mid', 'senior', 'lead', 'executive')),
    location VARCHAR(255),
    posting_url TEXT UNIQUE NOT NULL,
    curated_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE
);

-- Matches table: User-job pairings with scores
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    match_score INTEGER NOT NULL CHECK (match_score BETWEEN 0 AND 100),
    hard_skills_score INTEGER CHECK (hard_skills_score BETWEEN 0 AND 50),
    soft_skills_score INTEGER CHECK (soft_skills_score BETWEEN 0 AND 20),
    seniority_score INTEGER CHECK (seniority_score BETWEEN 0 AND 20),
    logistics_score INTEGER CHECK (logistics_score BETWEEN 0 AND 10),
    match_reasons TEXT[],
    notified_at TIMESTAMPTZ,
    recruiting_alert_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table: Analytics event log
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for guest events
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'session_start',
        'mic_check_passed',
        'q_answered',
        'coaching_viewed',
        'survey_submitted',
        'share_link_clicked',
        'digest_opt_in'
    )),
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consents table: Terms/Privacy agreement records
CREATE TABLE consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    terms_version VARCHAR(20) NOT NULL,
    privacy_version VARCHAR(20) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SUPPORTING TABLES
-- ============================================================================

-- Cost tracking table: OpenAI API usage monitoring
CREATE TABLE cost_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    model VARCHAR(50) NOT NULL CHECK (model IN ('gpt-4o', 'gpt-4-turbo', 'whisper-1', 'tts-1')),
    tokens_used INTEGER,
    audio_seconds DECIMAL(10,2),
    estimated_cost_usd DECIMAL(10,4) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System config table: Feature flags and settings
CREATE TABLE system_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table: Admin action trail
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_digest ON users(digest_opt_in, digest_confirmed) WHERE digest_opt_in = TRUE;

-- Profiles indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Sessions indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_sessions_completed_at ON sessions(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_sessions_recruiter_eligible ON sessions(avg_star_score, completion_rate) WHERE avg_star_score >= 4.2 AND completion_rate >= 0.70;

-- Questions indexes
CREATE INDEX idx_questions_session_id ON questions(session_id);
CREATE INDEX idx_questions_session_order ON questions(session_id, question_order);

-- Answers indexes
CREATE INDEX idx_answers_session_id ON answers(session_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);

-- Reports indexes
CREATE INDEX idx_reports_session_id ON reports(session_id);

-- Jobs indexes
CREATE INDEX idx_jobs_source ON jobs(source);
CREATE INDEX idx_jobs_active ON jobs(active, curated_at DESC) WHERE active = TRUE;
CREATE INDEX idx_jobs_url ON jobs(posting_url);
CREATE INDEX idx_jobs_skills ON jobs USING GIN(skills);

-- Matches indexes
CREATE INDEX idx_matches_user_id ON matches(user_id, match_score DESC);
CREATE INDEX idx_matches_job_id ON matches(job_id);
CREATE INDEX idx_matches_digest ON matches(user_id, notified_at);
CREATE INDEX idx_matches_recruiting ON matches(match_score, recruiting_alert_sent) WHERE match_score >= 80;

-- Events indexes
CREATE INDEX idx_events_user_id ON events(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_events_type ON events(event_type, created_at DESC);
CREATE INDEX idx_events_session_id ON events(session_id) WHERE session_id IS NOT NULL;

-- Consents indexes
CREATE INDEX idx_consents_user_id ON consents(user_id, created_at DESC);

-- Cost tracking indexes
CREATE INDEX idx_cost_tracking_period ON cost_tracking(period_start, period_end);
CREATE INDEX idx_cost_tracking_model ON cost_tracking(model, period_start);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_user_id, created_at DESC) WHERE admin_user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id) WHERE resource_type IS NOT NULL;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get current month's total cost
CREATE OR REPLACE FUNCTION get_current_month_cost()
RETURNS DECIMAL AS $$
    SELECT COALESCE(SUM(estimated_cost_usd), 0.00)
    FROM cost_tracking
    WHERE period_start >= date_trunc('month', CURRENT_DATE)
      AND period_end < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- Generic function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
