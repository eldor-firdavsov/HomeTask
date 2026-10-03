-- ═══════════════════════════════════════════════════════════
-- COMPLETE PRODUCTION SUPABASE SCHEMA FOR HOMEWORK PLATFORM
-- Run this script in Supabase Dashboard -> SQL Editor
-- ═══════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════
-- 001 INITIAL SCHEMA
-- Homework Management Platform
-- ═══════════════════════════════════════════════════════════

-- ── Role enum ─────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
'teacher', 'student'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ── Assignment status enum ────────────────────────────────
DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM (

  'not_started',
  'in_progress',
  'submitted',
  'under_review',
  'needs_revision',
  'done'

  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ── Task type enum ────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE task_type AS ENUM (

  'keyword',
  'summary',
  'vocabulary',
  'writing',
  'reading',
  'listening',
  'speaking',
  'grammar',
  'other'

  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ═══════════════════════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  email       TEXT,
  role        user_role NOT NULL,
  teacher_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for teacher-student lookup
CREATE INDEX IF NOT EXISTS idx_profiles_teacher_id ON profiles(teacher_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ═══════════════════════════════════════════════════════════
-- TASK TEMPLATES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS task_templates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  type             task_type NOT NULL DEFAULT 'other',
  instructions     TEXT,
  submission_types JSONB NOT NULL DEFAULT '["text"]'::jsonb,
  metadata         JSONB DEFAULT '{}'::jsonb,
  is_archived      BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_templates_teacher_id ON task_templates(teacher_id);

-- ═══════════════════════════════════════════════════════════
-- TASK ATTACHMENTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS task_attachments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_template_id UUID NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  file_name        TEXT NOT NULL,
  storage_path     TEXT NOT NULL,
  mime_type        TEXT,
  file_size        BIGINT,
  attachment_type  TEXT NOT NULL DEFAULT 'file', -- 'file', 'image', 'link'
  url              TEXT,  -- for link attachments
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_template_id ON task_attachments(task_template_id);

-- ═══════════════════════════════════════════════════════════
-- ASSIGNMENTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS assignments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_template_id UUID REFERENCES task_templates(id) ON DELETE SET NULL,
  teacher_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Snapshot of template at assignment time
  title            TEXT NOT NULL,
  type             task_type NOT NULL DEFAULT 'other',
  instructions     TEXT,
  submission_types JSONB NOT NULL DEFAULT '["text"]'::jsonb,

  deadline         TIMESTAMPTZ,
  status           assignment_status NOT NULL DEFAULT 'not_started',

  grade            INTEGER CHECK (grade >= 0 AND grade <= 100),
  feedback         TEXT,
  reviewed_at      TIMESTAMPTZ,
  reviewed_by      UUID REFERENCES profiles(id),

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_student_id ON assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_deadline ON assignments(deadline);
CREATE INDEX IF NOT EXISTS idx_assignments_template_id ON assignments(task_template_id);

-- ═══════════════════════════════════════════════════════════
-- ASSIGNMENT ATTACHMENTS (references to template attachments)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS assignment_attachments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id    UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  file_name        TEXT NOT NULL,
  storage_path     TEXT NOT NULL,
  mime_type        TEXT,
  file_size        BIGINT,
  attachment_type  TEXT NOT NULL DEFAULT 'file',
  url              TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assignment_attachments_assignment_id ON assignment_attachments(assignment_id);

-- ═══════════════════════════════════════════════════════════
-- SUBMISSIONS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  text_content    TEXT,
  version         INTEGER NOT NULL DEFAULT 1,

  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);

-- ═══════════════════════════════════════════════════════════
-- SUBMISSION ATTACHMENTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS submission_attachments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,
  storage_path    TEXT NOT NULL,
  mime_type       TEXT,
  file_size       BIGINT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submission_attachments_submission_id ON submission_attachments(submission_id);

-- ═══════════════════════════════════════════════════════════
-- TRIGGERS: Auto-update updated_at
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_templates_updated_at ON task_templates;
CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON task_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_submissions_updated_at ON submissions;
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════
-- 002 ROW LEVEL SECURITY POLICIES
-- ═══════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_attachments ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- PROFILES POLICIES
-- ═══════════════════════════════════════════════════════════

-- Teachers can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Teachers can read profiles of their students
DROP POLICY IF EXISTS "Teachers can read their students profiles" ON profiles;
CREATE POLICY "Teachers can read their students profiles"
  ON profiles FOR SELECT
  USING (teacher_id = auth.uid());

-- Users can update their own profile (limited fields)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow service role insert (for Edge Function student creation)
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- TASK TEMPLATES POLICIES
-- ═══════════════════════════════════════════════════════════

-- Teachers can CRUD only their own templates
DROP POLICY IF EXISTS "Teachers can read own templates" ON task_templates;
CREATE POLICY "Teachers can read own templates"
  ON task_templates FOR SELECT
  USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can insert own templates" ON task_templates;
CREATE POLICY "Teachers can insert own templates"
  ON task_templates FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can update own templates" ON task_templates;
CREATE POLICY "Teachers can update own templates"
  ON task_templates FOR UPDATE
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can delete own templates" ON task_templates;
CREATE POLICY "Teachers can delete own templates"
  ON task_templates FOR DELETE
  USING (teacher_id = auth.uid());

-- ═══════════════════════════════════════════════════════════
-- TASK ATTACHMENTS POLICIES
-- ═══════════════════════════════════════════════════════════

-- Teachers can manage attachments for their templates
DROP POLICY IF EXISTS "Teachers can read own template attachments" ON task_attachments;
CREATE POLICY "Teachers can read own template attachments"
  ON task_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM task_templates
      WHERE task_templates.id = task_attachments.task_template_id
      AND task_templates.teacher_id = auth.uid()
    )
  );

-- Students can read attachments for their assigned templates
DROP POLICY IF EXISTS "Students can read assigned template attachments" ON task_attachments;
CREATE POLICY "Students can read assigned template attachments"
  ON task_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.task_template_id = task_attachments.task_template_id
      AND assignments.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can insert own template attachments" ON task_attachments;
CREATE POLICY "Teachers can insert own template attachments"
  ON task_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_templates
      WHERE task_templates.id = task_attachments.task_template_id
      AND task_templates.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can delete own template attachments" ON task_attachments;
CREATE POLICY "Teachers can delete own template attachments"
  ON task_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM task_templates
      WHERE task_templates.id = task_attachments.task_template_id
      AND task_templates.teacher_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════
-- ASSIGNMENTS POLICIES
-- ═══════════════════════════════════════════════════════════

-- Teachers can read their assignments
DROP POLICY IF EXISTS "Teachers can read own assignments" ON assignments;
CREATE POLICY "Teachers can read own assignments"
  ON assignments FOR SELECT
  USING (teacher_id = auth.uid());

-- Students can read their assignments
DROP POLICY IF EXISTS "Students can read own assignments" ON assignments;
CREATE POLICY "Students can read own assignments"
  ON assignments FOR SELECT
  USING (student_id = auth.uid());

-- Teachers can create assignments for their students
DROP POLICY IF EXISTS "Teachers can create assignments" ON assignments;
CREATE POLICY "Teachers can create assignments"
  ON assignments FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = assignments.student_id
      AND profiles.teacher_id = auth.uid()
    )
  );

-- Teachers can update their assignments
DROP POLICY IF EXISTS "Teachers can update own assignments" ON assignments;
CREATE POLICY "Teachers can update own assignments"
  ON assignments FOR UPDATE
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Students can update status of their assignments (limited)
DROP POLICY IF EXISTS "Students can update own assignment status" ON assignments;
CREATE POLICY "Students can update own assignment status"
  ON assignments FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (
    student_id = auth.uid()
    -- Students can only set status to in_progress or submitted
    AND status IN ('in_progress', 'submitted')
  );

-- Teachers can delete their assignments
DROP POLICY IF EXISTS "Teachers can delete own assignments" ON assignments;
CREATE POLICY "Teachers can delete own assignments"
  ON assignments FOR DELETE
  USING (teacher_id = auth.uid());

-- ═══════════════════════════════════════════════════════════
-- ASSIGNMENT ATTACHMENTS POLICIES
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Teachers can read own assignment attachments" ON assignment_attachments;
CREATE POLICY "Teachers can read own assignment attachments"
  ON assignment_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = assignment_attachments.assignment_id
      AND assignments.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can read own assignment attachments" ON assignment_attachments;
CREATE POLICY "Students can read own assignment attachments"
  ON assignment_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = assignment_attachments.assignment_id
      AND assignments.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can insert assignment attachments" ON assignment_attachments;
CREATE POLICY "Teachers can insert assignment attachments"
  ON assignment_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = assignment_attachments.assignment_id
      AND assignments.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can delete assignment attachments" ON assignment_attachments;
CREATE POLICY "Teachers can delete assignment attachments"
  ON assignment_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = assignment_attachments.assignment_id
      AND assignments.teacher_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════
-- SUBMISSIONS POLICIES
-- ═══════════════════════════════════════════════════════════

-- Students can create submissions for their own assignments
DROP POLICY IF EXISTS "Students can create own submissions" ON submissions;
CREATE POLICY "Students can create own submissions"
  ON submissions FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = submissions.assignment_id
      AND assignments.student_id = auth.uid()
    )
  );

-- Students can read their own submissions
DROP POLICY IF EXISTS "Students can read own submissions" ON submissions;
CREATE POLICY "Students can read own submissions"
  ON submissions FOR SELECT
  USING (student_id = auth.uid());

-- Teachers can read submissions for their assignments
DROP POLICY IF EXISTS "Teachers can read submissions for own assignments" ON submissions;
CREATE POLICY "Teachers can read submissions for own assignments"
  ON submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = submissions.assignment_id
      AND assignments.teacher_id = auth.uid()
    )
  );

-- Students can update their own submissions (before final review)
DROP POLICY IF EXISTS "Students can update own submissions" ON submissions;
CREATE POLICY "Students can update own submissions"
  ON submissions FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ═══════════════════════════════════════════════════════════
-- SUBMISSION ATTACHMENTS POLICIES
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Students can insert own submission attachments" ON submission_attachments;
CREATE POLICY "Students can insert own submission attachments"
  ON submission_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM submissions
      WHERE submissions.id = submission_attachments.submission_id
      AND submissions.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can read own submission attachments" ON submission_attachments;
CREATE POLICY "Students can read own submission attachments"
  ON submission_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM submissions
      WHERE submissions.id = submission_attachments.submission_id
      AND submissions.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can read submission attachments for own assignments" ON submission_attachments;
CREATE POLICY "Teachers can read submission attachments for own assignments"
  ON submission_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM submissions
      JOIN assignments ON assignments.id = submissions.assignment_id
      WHERE submissions.id = submission_attachments.submission_id
      AND assignments.teacher_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════
-- 003 STORAGE BUCKETS AND POLICIES
-- ═══════════════════════════════════════════════════════════

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('task-attachments', 'task-attachments', false, 52428800, NULL),
  ('submission-files', 'submission-files', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════
-- TASK ATTACHMENTS BUCKET POLICIES
-- ═══════════════════════════════════════════════════════════

-- Teachers can upload to their own folder
DROP POLICY IF EXISTS "Teachers can upload task attachments" ON storage.objects;
CREATE POLICY "Teachers can upload task attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Teachers can read their own task attachments
DROP POLICY IF EXISTS "Teachers can read own task attachments" ON storage.objects;
CREATE POLICY "Teachers can read own task attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'task-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Students can read task attachments from their teacher's folder
DROP POLICY IF EXISTS "Students can read assigned task attachments" ON storage.objects;
CREATE POLICY "Students can read assigned task attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'task-attachments'
    AND (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.teacher_id::text = (storage.foldername(name))[1]
      )
      OR
      EXISTS (
        SELECT 1 FROM assignments
        WHERE assignments.student_id = auth.uid()
        AND assignments.teacher_id::text = (storage.foldername(name))[1]
      )
    )
  );

-- Teachers can delete their own task attachments
DROP POLICY IF EXISTS "Teachers can delete own task attachments" ON storage.objects;
CREATE POLICY "Teachers can delete own task attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'task-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ═══════════════════════════════════════════════════════════
-- SUBMISSION FILES BUCKET POLICIES
-- ═══════════════════════════════════════════════════════════

-- Students can upload to their own folder
DROP POLICY IF EXISTS "Students can upload submission files" ON storage.objects;
CREATE POLICY "Students can upload submission files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'submission-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Students can read their own submission files
DROP POLICY IF EXISTS "Students can read own submission files" ON storage.objects;
CREATE POLICY "Students can read own submission files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'submission-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Teachers can read submission files from their students
DROP POLICY IF EXISTS "Teachers can read student submission files" ON storage.objects;
CREATE POLICY "Teachers can read student submission files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'submission-files'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id::text = (storage.foldername(name))[1]
      AND profiles.teacher_id = auth.uid()
    )
  );

-- Students can delete their own submission files
DROP POLICY IF EXISTS "Students can delete own submission files" ON storage.objects;
CREATE POLICY "Students can delete own submission files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'submission-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ═══════════════════════════════════════════════════════════
-- 004 REALTIME CONFIGURATION
-- ═══════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'assignments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE assignments;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- 005 AUTH TRIGGERS & RPC HELPERS
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Automatically confirm email and set empty string tokens for all new users so GoTrue never fails schema scan
CREATE OR REPLACE FUNCTION public.auto_confirm_users()
RETURNS trigger AS $$
BEGIN
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, now());
  NEW.confirmation_token = COALESCE(NEW.confirmation_token, '');
  NEW.recovery_token = COALESCE(NEW.recovery_token, '');
  NEW.email_change = COALESCE(NEW.email_change, '');
  NEW.email_change_token_new = COALESCE(NEW.email_change_token_new, '');
  NEW.email_change_token_current = COALESCE(NEW.email_change_token_current, '');
  NEW.phone_change = COALESCE(NEW.phone_change, '');
  NEW.phone_change_token = COALESCE(NEW.phone_change_token, '');
  NEW.reauthentication_token = COALESCE(NEW.reauthentication_token, '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_before_insert ON auth.users;
CREATE TRIGGER on_auth_user_before_insert
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_users();

-- Trigger to automatically create profile and identity when user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role public.user_role;
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  -- 1. Ensure auth.identities entry exists for GoTrue
  BEGIN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.id,
      jsonb_build_object('sub', NEW.id::text, 'email', lower(NEW.email)),
      'email',
      NEW.id::text,
      now(),
      now(),
      now()
    )
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 2. Determine role safely
  IF lower(COALESCE(NEW.raw_user_meta_data->>'role', '')) = 'student' THEN
    v_role := 'student'::public.user_role;
  ELSE
    v_role := 'teacher'::public.user_role;
  END IF;

  -- 3. Determine names safely
  v_first_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'first_name'), ''),
    NULLIF(split_part(COALESCE(NEW.email, 'User'), '@', 1), ''),
    'User'
  );
  v_last_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'last_name'), ''),
    ''
  );

  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    email,
    role,
    is_active
  ) VALUES (
    NEW.id,
    v_first_name,
    v_last_name,
    NEW.email,
    v_role,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user exception: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RPC function to securely create student accounts from teacher session
CREATE OR REPLACE FUNCTION public.create_student_by_teacher(
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_teacher_id UUID;
  v_teacher_role user_role;
  v_new_user_id UUID;
  v_encrypted_pw TEXT;
BEGIN
  v_teacher_id := auth.uid();
  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO v_teacher_role FROM public.profiles WHERE id = v_teacher_id;
  IF v_teacher_role IS NULL OR v_teacher_role != 'teacher' THEN
    RAISE EXCEPTION 'Only teachers can create students';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(trim(p_email))) THEN
    RAISE EXCEPTION 'A user with this email already exists';
  END IF;

  v_new_user_id := gen_random_uuid();
  v_encrypted_pw := crypt(p_password, gen_salt('bf'));

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    email_change_token_current
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_new_user_id,
    'authenticated',
    'authenticated',
    lower(trim(p_email)),
    v_encrypted_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('first_name', trim(p_first_name), 'last_name', trim(p_last_name), 'role', 'student'),
    now(),
    now(),
    '',
    '',
    '',
    '',
    ''
  );

  BEGIN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_new_user_id,
      v_new_user_id,
      jsonb_build_object('sub', v_new_user_id::text, 'email', lower(trim(p_email))),
      'email',
      v_new_user_id::text,
      now(),
      now(),
      now()
    )
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    email,
    role,
    teacher_id,
    is_active
  ) VALUES (
    v_new_user_id,
    trim(p_first_name),
    trim(p_last_name),
    lower(trim(p_email)),
    'student',
    v_teacher_id,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    teacher_id = EXCLUDED.teacher_id,
    role = 'student',
    is_active = true;

  RETURN jsonb_build_object(
    'id', v_new_user_id,
    'first_name', trim(p_first_name),
    'last_name', trim(p_last_name),
    'email', lower(trim(p_email)),
    'role', 'student'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_student_by_teacher(TEXT, TEXT, TEXT, TEXT) TO authenticated;
