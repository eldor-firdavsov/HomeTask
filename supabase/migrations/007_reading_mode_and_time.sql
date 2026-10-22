-- ═══════════════════════════════════════════════════════════
-- 007 IELTS READING TEST ASSIGNMENT MODES & TIME LIMITS
-- Adds exam mode vs practice mode & custom teacher time limit
-- ═══════════════════════════════════════════════════════════

ALTER TABLE reading_test_assignments
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'exam',
  ADD COLUMN IF NOT EXISTS time_limit_mins INTEGER NOT NULL DEFAULT 60;

-- Index for querying assignments by mode
CREATE INDEX IF NOT EXISTS idx_rt_assignments_mode ON reading_test_assignments(mode);
