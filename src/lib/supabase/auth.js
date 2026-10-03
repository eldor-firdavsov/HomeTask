import { supabase } from './client.js';

// ── Sign in with email/password ──────────────────────────
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

// ── Sign out ─────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ── Get current session ──────────────────────────────────
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

// ── Get current user ─────────────────────────────────────
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// ── Get user profile ─────────────────────────────────────
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// ── Send password reset email ────────────────────────────
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

// ── Update password ──────────────────────────────────────
export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
  return data;
}

// ── Update email ─────────────────────────────────────────
export async function updateEmail(newEmail) {
  const { data, error } = await supabase.auth.updateUser({
    email: newEmail,
  });
  if (error) throw error;

  // Also update public.profiles
  if (data?.user?.id) {
    try {
      await supabase
        .from('profiles')
        .update({
          email: newEmail,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.user.id);
    } catch (profErr) {
      console.warn('Could not update profile email directly:', profErr);
    }
  }

  return data;
}

// ── Update profile details ───────────────────────────────
export async function updateProfile(userId, updates) {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Verify current password ──────────────────────────────
export async function verifyPassword(email, password) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    throw new Error('Current password does not match.');
  }
  return true;
}

// ── Subscribe to auth state changes ──────────────────────
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

