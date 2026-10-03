import { supabase } from './client.js';

// ── Create student via Edge Function ─────────────────────
export async function createStudent({ firstName, lastName, email, password }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  // 1. Attempt Edge Function first
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-student`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ firstName, lastName, email, password }),
      }
    );

    if (response.ok) {
      const result = await response.json();
      return result.student;
    }
    
    // If not a 404 (i.e. function exists and returned validation/logic error), throw it
    if (response.status !== 404) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || `Error ${response.status}: Failed to create student`);
    }
  } catch (edgeErr) {
    if (!edgeErr.message?.includes('404') && !edgeErr.message?.includes('Failed to fetch')) {
      throw edgeErr;
    }
    console.warn('Edge Function create-student unavailable, attempting PostgreSQL RPC fallback...');
  }

  // 2. Fallback to PostgreSQL RPC
  const { data, error } = await supabase.rpc('create_student_by_teacher', {
    p_first_name: firstName,
    p_last_name: lastName,
    p_email: email,
    p_password: password,
  });

  if (error) {
    throw new Error(error.message || 'Failed to create student');
  }

  return data;
}

// ── Get teacher's students ───────────────────────────────
export async function getStudents() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ── Get a single student ─────────────────────────────────
export async function getStudent(studentId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', studentId)
    .single();
  if (error) throw error;
  return data;
}

// ── Deactivate student (soft delete) ─────────────────────
export async function deactivateStudent(studentId) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', studentId);
  if (error) throw error;
}
