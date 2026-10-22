-- ═══════════════════════════════════════════════════════════
-- 007 UPDATE TEACHER / USER EMAIL RPC
-- Allows authenticated users to safely update their login email
-- without hitting Supabase free-tier SMTP rate limits (429)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_teacher_email(
  p_new_email TEXT,
  p_current_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_trimmed_email TEXT;
  v_current_pw_hash TEXT;
BEGIN
  -- 1. Ensure caller is authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_trimmed_email := lower(trim(p_new_email));
  IF v_trimmed_email IS NULL OR v_trimmed_email = '' OR v_trimmed_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Invalid email address';
  END IF;

  -- 2. Fetch current password hash from auth.users
  SELECT encrypted_password INTO v_current_pw_hash
  FROM auth.users
  WHERE id = v_user_id;

  IF v_current_pw_hash IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- 3. Verify current password with pgcrypto
  IF crypt(p_current_password, v_current_pw_hash) != v_current_pw_hash THEN
    RAISE EXCEPTION 'Current password does not match.';
  END IF;

  -- 4. Check if new email is already in use by another account
  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = v_trimmed_email AND id != v_user_id) THEN
    RAISE EXCEPTION 'A user with this email address already exists.';
  END IF;

  -- 5. Update auth.users directly (updating email, email_confirmed_at, user metadata, clearing tokens)
  UPDATE auth.users
  SET
    email = v_trimmed_email,
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    email_change = '',
    email_change_token_new = '',
    email_change_token_current = '',
    raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{email}', to_jsonb(v_trimmed_email)),
    updated_at = now()
  WHERE id = v_user_id;

  -- 6. Update auth.identities
  UPDATE auth.identities
  SET
    identity_data = jsonb_set(COALESCE(identity_data, '{}'::jsonb), '{email}', to_jsonb(v_trimmed_email)),
    updated_at = now()
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
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
      v_user_id,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_trimmed_email),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- 7. Update public.profiles
  UPDATE public.profiles
  SET
    email = v_trimmed_email,
    updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'email', v_trimmed_email,
    'message', 'Email address updated successfully'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_teacher_email(TEXT, TEXT) TO authenticated;
