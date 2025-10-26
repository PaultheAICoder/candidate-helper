-- Migration 003: Audit Triggers
-- AI Interview Coach (Cindy from Cinder)
-- Created: 2025-10-26

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

-- Function to update session avg_star_score when answers are inserted/updated
CREATE OR REPLACE FUNCTION update_session_avg_star_score()
RETURNS TRIGGER AS $$
DECLARE
    avg_score DECIMAL(3,2);
BEGIN
    -- Calculate average of all 4 STAR components across all answers for this session
    SELECT AVG(
        (COALESCE(star_situation_score, 0) +
         COALESCE(star_task_score, 0) +
         COALESCE(star_action_score, 0) +
         COALESCE(star_result_score, 0)) / 4.0
    ) INTO avg_score
    FROM answers
    WHERE session_id = COALESCE(NEW.session_id, OLD.session_id)
    AND star_situation_score IS NOT NULL
    AND star_task_score IS NOT NULL
    AND star_action_score IS NOT NULL
    AND star_result_score IS NOT NULL;

    -- Update the session with the new average
    IF avg_score IS NOT NULL THEN
        UPDATE sessions
        SET avg_star_score = avg_score
        WHERE id = COALESCE(NEW.session_id, OLD.session_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update session completion_rate when answers are inserted
CREATE OR REPLACE FUNCTION update_session_completion_rate()
RETURNS TRIGGER AS $$
DECLARE
    total_questions INTEGER;
    answered_questions INTEGER;
    completion_pct DECIMAL(3,2);
BEGIN
    -- Get total question count for this session
    SELECT question_count INTO total_questions
    FROM sessions
    WHERE id = NEW.session_id;

    -- Count answered questions
    SELECT COUNT(*) INTO answered_questions
    FROM answers
    WHERE session_id = NEW.session_id;

    -- Calculate completion rate
    IF total_questions > 0 THEN
        completion_pct := answered_questions::DECIMAL / total_questions::DECIMAL;

        UPDATE sessions
        SET completion_rate = completion_pct
        WHERE id = NEW.session_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Trigger to update avg_star_score on answers INSERT
CREATE TRIGGER update_avg_star_on_insert
    AFTER INSERT ON answers
    FOR EACH ROW
    EXECUTE FUNCTION update_session_avg_star_score();

-- Trigger to update avg_star_score on answers UPDATE
CREATE TRIGGER update_avg_star_on_update
    AFTER UPDATE ON answers
    FOR EACH ROW
    WHEN (
        OLD.star_situation_score IS DISTINCT FROM NEW.star_situation_score OR
        OLD.star_task_score IS DISTINCT FROM NEW.star_task_score OR
        OLD.star_action_score IS DISTINCT FROM NEW.star_action_score OR
        OLD.star_result_score IS DISTINCT FROM NEW.star_result_score
    )
    EXECUTE FUNCTION update_session_avg_star_score();

-- Trigger to update completion_rate on answers INSERT
CREATE TRIGGER update_completion_rate_on_insert
    AFTER INSERT ON answers
    FOR EACH ROW
    EXECUTE FUNCTION update_session_completion_rate();

-- ============================================================================
-- ADDITIONAL HELPER FUNCTIONS
-- ============================================================================

-- Function to check if audio mode is enabled (for cost control)
CREATE OR REPLACE FUNCTION is_audio_mode_enabled()
RETURNS BOOLEAN AS $$
DECLARE
    enabled_value TEXT;
BEGIN
    SELECT value INTO enabled_value
    FROM system_config
    WHERE key = 'audio_mode_enabled';

    RETURN COALESCE(enabled_value::BOOLEAN, TRUE);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get monthly cost threshold
CREATE OR REPLACE FUNCTION get_monthly_cost_threshold()
RETURNS DECIMAL AS $$
DECLARE
    threshold_value TEXT;
BEGIN
    SELECT value INTO threshold_value
    FROM system_config
    WHERE key = 'monthly_cost_threshold_usd';

    RETURN COALESCE(threshold_value::DECIMAL, 285.00);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if cost threshold has been reached
CREATE OR REPLACE FUNCTION has_reached_cost_threshold()
RETURNS BOOLEAN AS $$
DECLARE
    current_cost DECIMAL;
    threshold DECIMAL;
BEGIN
    current_cost := get_current_month_cost();
    threshold := get_monthly_cost_threshold();

    RETURN current_cost >= threshold;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION update_session_avg_star_score() IS
    'Updates sessions.avg_star_score when answers are inserted or updated. Calculates average of all 4 STAR components across all answers.';

COMMENT ON FUNCTION update_session_completion_rate() IS
    'Updates sessions.completion_rate when answers are inserted. Calculates percentage of questions answered.';

COMMENT ON FUNCTION get_current_month_cost() IS
    'Returns total estimated cost for the current month from cost_tracking table.';

COMMENT ON FUNCTION is_audio_mode_enabled() IS
    'Checks if audio mode is currently enabled based on system_config.';

COMMENT ON FUNCTION get_monthly_cost_threshold() IS
    'Returns the monthly cost threshold from system_config (default: $285).';

COMMENT ON FUNCTION has_reached_cost_threshold() IS
    'Returns TRUE if current month cost has reached or exceeded the threshold.';
