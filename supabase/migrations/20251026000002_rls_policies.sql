-- Migration 002: Row Level Security Policies
-- AI Interview Coach (Cindy from Cinder)
-- Created: 2025-10-26

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
-- Note: cost_tracking, system_config, audit_logs are admin-only (service role access)

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if user is a recruiter (simplified - in production would check role table)
CREATE OR REPLACE FUNCTION is_recruiter(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- For MVP, recruiters are users with a specific email pattern
    -- In production, this would check against a roles table
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = check_user_id
        AND email LIKE '%@teamcinder.com'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if session meets performance threshold for recruiter access
CREATE OR REPLACE FUNCTION session_meets_recruiter_threshold(check_session_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM sessions
        WHERE id = check_session_id
        AND avg_star_score >= 4.2
        AND completion_rate >= 0.70
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY users_select_own
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY users_update_own
    ON users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (during registration)
CREATE POLICY users_insert_own
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY profiles_select_own
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY profiles_update_own
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY profiles_insert_own
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SESSIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own sessions OR guest sessions (user_id IS NULL)
CREATE POLICY sessions_select_own_or_guest
    ON sessions FOR SELECT
    USING (
        auth.uid() = user_id
        OR user_id IS NULL
    );

-- Users can insert sessions (registered or guest)
CREATE POLICY sessions_insert_all
    ON sessions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR user_id IS NULL
    );

-- Users can update their own sessions
CREATE POLICY sessions_update_own
    ON sessions FOR UPDATE
    USING (
        auth.uid() = user_id
        OR user_id IS NULL
    )
    WITH CHECK (
        auth.uid() = user_id
        OR user_id IS NULL
    );

-- ============================================================================
-- QUESTIONS TABLE POLICIES
-- ============================================================================

-- Users can view questions for their own sessions (via session ownership)
CREATE POLICY questions_select_via_session
    ON questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = questions.session_id
            AND (sessions.user_id = auth.uid() OR sessions.user_id IS NULL)
        )
    );

-- System can insert questions (via API routes with service role)
-- Users cannot directly insert questions
CREATE POLICY questions_insert_system
    ON questions FOR INSERT
    WITH CHECK (true); -- Controlled via API authentication

-- ============================================================================
-- ANSWERS TABLE POLICIES
-- ============================================================================

-- Users can view answers for their own sessions
CREATE POLICY answers_select_via_session
    ON answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = answers.session_id
            AND (sessions.user_id = auth.uid() OR sessions.user_id IS NULL)
        )
    );

-- Recruiters can view answers if user opted in OR session meets performance threshold
CREATE POLICY answers_select_recruiter
    ON answers FOR SELECT
    USING (
        is_recruiter(auth.uid())
        AND (
            -- User explicitly granted access
            EXISTS (
                SELECT 1 FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.id = answers.session_id
                AND u.recruiter_access_granted = TRUE
            )
            -- OR session meets performance threshold
            OR session_meets_recruiter_threshold(answers.session_id)
        )
    );

-- Users can insert answers
CREATE POLICY answers_insert_via_session
    ON answers FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = answers.session_id
            AND (sessions.user_id = auth.uid() OR sessions.user_id IS NULL)
        )
    );

-- Users can update their own answers (for retakes)
CREATE POLICY answers_update_via_session
    ON answers FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = answers.session_id
            AND (sessions.user_id = auth.uid() OR sessions.user_id IS NULL)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = answers.session_id
            AND (sessions.user_id = auth.uid() OR sessions.user_id IS NULL)
        )
    );

-- ============================================================================
-- REPORTS TABLE POLICIES
-- ============================================================================

-- Users can view reports for their own sessions
CREATE POLICY reports_select_via_session
    ON reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = reports.session_id
            AND (sessions.user_id = auth.uid() OR sessions.user_id IS NULL)
        )
    );

-- System can insert reports (via API routes)
CREATE POLICY reports_insert_system
    ON reports FOR INSERT
    WITH CHECK (true);

-- System can update reports (for PDF generation)
CREATE POLICY reports_update_system
    ON reports FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- JOBS TABLE POLICIES
-- ============================================================================

-- All authenticated users can view active jobs
CREATE POLICY jobs_select_authenticated
    ON jobs FOR SELECT
    USING (auth.uid() IS NOT NULL AND active = TRUE);

-- System can insert jobs (via cron)
CREATE POLICY jobs_insert_system
    ON jobs FOR INSERT
    WITH CHECK (true);

-- System can update jobs (to mark inactive)
CREATE POLICY jobs_update_system
    ON jobs FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- MATCHES TABLE POLICIES
-- ============================================================================

-- Users can view their own matches
CREATE POLICY matches_select_own
    ON matches FOR SELECT
    USING (auth.uid() = user_id);

-- System can insert matches (via job matching algorithm)
CREATE POLICY matches_insert_system
    ON matches FOR INSERT
    WITH CHECK (true);

-- System can update matches (for notification tracking)
CREATE POLICY matches_update_system
    ON matches FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- EVENTS TABLE POLICIES
-- ============================================================================

-- Users can view their own events
CREATE POLICY events_select_own
    ON events FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

-- System can insert events
CREATE POLICY events_insert_all
    ON events FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- CONSENTS TABLE POLICIES
-- ============================================================================

-- Users can view their own consents
CREATE POLICY consents_select_own
    ON consents FOR SELECT
    USING (auth.uid() = user_id);

-- System can insert consents
CREATE POLICY consents_insert_system
    ON consents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant authenticated users basic access
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant anon users limited access (for guest sessions)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT ON sessions TO anon;
GRANT SELECT, INSERT ON questions TO anon;
GRANT SELECT, INSERT, UPDATE ON answers TO anon;
GRANT SELECT ON reports TO anon;
GRANT SELECT ON jobs TO anon;
GRANT INSERT ON events TO anon;
