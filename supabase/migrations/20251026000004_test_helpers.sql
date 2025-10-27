-- Test Helper Functions
-- These functions help reset database state between E2E test runs

-- Function to delete all test sessions and related data
-- This prevents constraint violations in E2E tests
CREATE OR REPLACE FUNCTION reset_test_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete in order to respect foreign key constraints
  DELETE FROM audit_logs WHERE created_at > NOW() - INTERVAL '1 hour';
  DELETE FROM events WHERE created_at > NOW() - INTERVAL '1 hour';
  DELETE FROM matches WHERE created_at > NOW() - INTERVAL '1 hour';
  DELETE FROM reports WHERE created_at > NOW() - INTERVAL '1 hour';
  DELETE FROM answers WHERE created_at > NOW() - INTERVAL '1 hour';
  DELETE FROM questions WHERE created_at > NOW() - INTERVAL '1 hour';
  DELETE FROM sessions WHERE created_at > NOW() - INTERVAL '1 hour';
  DELETE FROM consents WHERE created_at > NOW() - INTERVAL '1 hour';
  DELETE FROM cost_tracking WHERE created_at > NOW() - INTERVAL '1 hour';
  
  -- Note: We don't delete users or profiles to preserve test accounts
  -- Note: We don't delete jobs as they're seeded data
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION reset_test_data() TO service_role;
