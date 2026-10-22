import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase/client.js';
import { getProfile, onAuthStateChange } from '../lib/supabase/auth.js';
import { getStudents } from '../lib/supabase/students.js';
import { getTaskTemplates } from '../lib/supabase/tasks.js';
import { getTeacherAssignments, getMyAssignments } from '../lib/supabase/assignments.js';
import { getTeacherSubmissions } from '../lib/supabase/submissions.js';
import { transformProfile, transformSubmission } from '../lib/supabase/transforms.js';
import { getUnifiedReadingAssignments, getUnifiedReadingSubmissions } from '../lib/supabase/readingTests.js';

/* ── Toast Context ─────────────────────────── */
const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

/* ── Data Context ──────────────────────────── */
const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

/* ── Toast Renderer ────────────────────────── */
function Toasts({ toasts }) {
  return (
    <div className="g-toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`g-toast g-toast-${t.type}`}>
          <div className="g-toast-dot" />
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ── Background Atmosphere ─────────────────── */
function AppBackground() {
  return (
    <div className="app-bg" aria-hidden="true">
      <div className="app-orb" style={{
        top: '-10%', left: '20%',
        width: '40%', height: '40%',
        background: 'radial-gradient(ellipse, rgba(139,148,255,0.22) 0%, transparent 70%)',
      }} />
      <div className="app-orb" style={{
        top: '30%', right: '-5%',
        width: '35%', height: '35%',
        background: 'radial-gradient(ellipse, rgba(167,210,255,0.18) 0%, transparent 70%)',
      }} />
      <div className="app-orb" style={{
        bottom: '5%', left: '10%',
        width: '30%', height: '30%',
        background: 'radial-gradient(ellipse, rgba(196,167,253,0.14) 0%, transparent 70%)',
      }} />
    </div>
  );
}

/* ── Provider ──────────────────────────────── */
export const DataProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    users: [],
    templates: [],
    assignments: [],
    submissions: [],
  });
  const [toasts, setToasts] = useState([]);
  const subscriptionsRef = useRef([]);

  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);

  // ── Friendly error handler ─────────────────
  const handleError = useCallback((error, fallbackMsg = 'An error occurred') => {
    console.error(error);
    const msg = error?.message || fallbackMsg;
    // Translate common Supabase errors
    if (msg.includes('JWT expired') || msg.includes('invalid claim')) {
      addToast('Session expired. Please log in again.', 'error');
      return;
    }
    if (msg.includes('duplicate key')) {
      addToast('This record already exists.', 'error');
      return;
    }
    if (msg.includes('violates row-level security')) {
      addToast('You do not have permission to perform this action.', 'error');
      return;
    }
    if (msg.includes('Failed to fetch') || msg.toLowerCase().includes('fetch')) {
      addToast('Cannot connect to database. Supabase may be paused or offline.', 'error');
      return;
    }
    addToast(msg, 'error');
  }, [addToast]);

  // ── Load data based on role ────────────────
  const loadData = useCallback(async (userProfile) => {
    try {
      if (userProfile.role === 'teacher') {
        const [students, templates, assignments, submissions, rAssignments, rSubmissions] = await Promise.all([
          getStudents(),
          getTaskTemplates(),
          getTeacherAssignments(),
          getTeacherSubmissions(),
          getUnifiedReadingAssignments({ role: 'teacher' }),
          getUnifiedReadingSubmissions(),
        ]);
        setData({
          users: [
            transformProfile(userProfile),
            ...students.map(transformProfile),
          ],
          templates,
          assignments: [...assignments, ...(rAssignments || [])],
          submissions: [...submissions, ...(rSubmissions || [])],
        });
      } else {
        // Student: load both regular and reading assignments
        const [assignments, subs, rAssignments, rSubmissions] = await Promise.all([
          getMyAssignments(),
          supabase
            .from('submissions')
            .select('*')
            .order('submitted_at', { ascending: false })
            .then(res => (res.data || []).map(transformSubmission))
            .catch(() => []),
          getUnifiedReadingAssignments({ role: 'student', studentId: userProfile.id }),
          getUnifiedReadingSubmissions(),
        ]);

        setData({
          users: [transformProfile(userProfile)],
          templates: [],
          assignments: [...assignments, ...(rAssignments || [])],
          submissions: [...subs, ...(rSubmissions || [])],
        });
      }
    } catch (err) {
      handleError(err, 'Failed to load data');
    }
  }, [handleError]);

  // ── Set up realtime subscriptions ──────────
  const setupRealtime = useCallback((userProfile) => {
    // Clean up existing subscriptions
    subscriptionsRef.current.forEach(sub => sub.unsubscribe());
    subscriptionsRef.current = [];

    if (userProfile.role === 'teacher') {
      // Teacher subscribes to assignment changes for their students
      const assignmentSub = supabase
        .channel('teacher-assignments')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'assignments',
          filter: `teacher_id=eq.${userProfile.id}`,
        }, async () => {
          try {
            const [assignments, rAssignments] = await Promise.all([
              getTeacherAssignments(),
              getUnifiedReadingAssignments({ role: 'teacher' }),
            ]);
            setData(prev => ({ ...prev, assignments: [...assignments, ...(rAssignments || [])] }));
          } catch (err) {
            console.error('Realtime assignment reload error:', err);
          }
        })
        .subscribe();

      // Teacher subscribes to reading test assignments
      const readingAssignmentSub = supabase
        .channel('teacher-reading-assignments')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'reading_test_assignments',
        }, async () => {
          try {
            const [assignments, rAssignments] = await Promise.all([
              getTeacherAssignments(),
              getUnifiedReadingAssignments({ role: 'teacher' }),
            ]);
            setData(prev => ({ ...prev, assignments: [...assignments, ...(rAssignments || [])] }));
          } catch (err) {
            console.error('Realtime reading assignment reload error:', err);
          }
        })
        .subscribe();

      // Teacher subscribes to new submissions
      const submissionSub = supabase
        .channel('teacher-submissions')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'submissions',
        }, async () => {
          try {
            const [submissions, rSubmissions] = await Promise.all([
              getTeacherSubmissions(),
              getUnifiedReadingSubmissions(),
            ]);
            setData(prev => ({ ...prev, submissions: [...submissions, ...(rSubmissions || [])] }));
          } catch (err) {
            console.error('Realtime submission reload error:', err);
          }
        })
        .subscribe();

      subscriptionsRef.current = [assignmentSub, readingAssignmentSub, submissionSub];
    } else {
      // Student subscribes to their own assignment changes
      const assignmentSub = supabase
        .channel('student-assignments')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'assignments',
          filter: `student_id=eq.${userProfile.id}`,
        }, async () => {
          try {
            const [assignments, rAssignments] = await Promise.all([
              getMyAssignments(),
              getUnifiedReadingAssignments({ role: 'student', studentId: userProfile.id }),
            ]);
            setData(prev => ({ ...prev, assignments: [...assignments, ...(rAssignments || [])] }));
          } catch (err) {
            console.error('Realtime assignment reload error:', err);
          }
        })
        .subscribe();

      const readingAssignmentSub = supabase
        .channel('student-reading-assignments')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'reading_test_assignments',
          filter: `student_id=eq.${userProfile.id}`,
        }, async () => {
          try {
            const [assignments, rAssignments] = await Promise.all([
              getMyAssignments(),
              getUnifiedReadingAssignments({ role: 'student', studentId: userProfile.id }),
            ]);
            setData(prev => ({ ...prev, assignments: [...assignments, ...(rAssignments || [])] }));
          } catch (err) {
            console.error('Realtime reading assignment reload error:', err);
          }
        })
        .subscribe();

      subscriptionsRef.current = [assignmentSub, readingAssignmentSub];
    }
  }, []);

  // ── Auth state listener ────────────────────
  useEffect(() => {
    let mounted = true;

    // Check initial session
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (initialSession?.user) {
          setSession(initialSession);
          try {
            let prof = null;
            try {
              prof = await getProfile(initialSession.user.id);
            } catch (fetchErr) {
              console.warn('Initial getProfile attempt failed, retrying...', fetchErr);
              await new Promise(r => setTimeout(r, 400));
              prof = await getProfile(initialSession.user.id);
            }

            if (!mounted) return;
            if (prof) {
              setProfile(prof);
              await loadData(prof);
              setupRealtime(prof);
            } else {
              throw new Error('Profile is null');
            }
          } catch (err) {
            console.warn('Profile load error in initAuth, applying metadata fallback:', err);
            // Construct safe fallback profile from auth user metadata to avoid logging user out on refresh
            const meta = initialSession.user.user_metadata || {};
            const email = initialSession.user.email || '';
            const fallbackRole = meta.role || (email.toLowerCase().includes('teacher') ? 'teacher' : 'student');
            const fallbackProf = {
              id: initialSession.user.id,
              first_name: meta.first_name || (fallbackRole === 'teacher' ? 'Teacher' : 'Student'),
              last_name: meta.last_name || '',
              email,
              role: fallbackRole,
              is_active: true,
            };
            if (!mounted) return;
            setProfile(fallbackProf);
            try {
              await loadData(fallbackProf);
              setupRealtime(fallbackProf);
            } catch (ldErr) {
              console.warn('Failed loading data with fallback profile:', ldErr);
            }
          }
        }
      } catch (err) {
        console.error('Init auth error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession?.user) {
        setSession(newSession);
        try {
          let prof = null;
          try {
            prof = await getProfile(newSession.user.id);
          } catch {
            await new Promise(r => setTimeout(r, 400));
            prof = await getProfile(newSession.user.id);
          }
          if (!mounted) return;
          if (prof) {
            setProfile(prof);
            await loadData(prof);
            setupRealtime(prof);
          }
        } catch (err) {
          console.warn('Auth change profile error, using fallback:', err);
          const meta = newSession.user.user_metadata || {};
          const email = newSession.user.email || '';
          const fallbackRole = meta.role || (email.toLowerCase().includes('teacher') ? 'teacher' : 'student');
          const fallbackProf = {
            id: newSession.user.id,
            first_name: meta.first_name || (fallbackRole === 'teacher' ? 'Teacher' : 'Student'),
            last_name: meta.last_name || '',
            email,
            role: fallbackRole,
            is_active: true,
          };
          if (!mounted) return;
          setProfile(fallbackProf);
          try {
            await loadData(fallbackProf);
            setupRealtime(fallbackProf);
          } catch (ldErr) {
            console.warn('Failed loading data with fallback profile on auth change:', ldErr);
          }
        } finally {
          if (mounted) setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setData({ users: [], templates: [], assignments: [], submissions: [] });
        subscriptionsRef.current.forEach(sub => {
          try { sub?.unsubscribe?.(); } catch {}
        });
        subscriptionsRef.current = [];
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      subscriptionsRef.current.forEach(sub => {
        try { sub?.unsubscribe?.(); } catch {}
      });
    };
  }, [loadData, setupRealtime]);

  // ── Refresh data helper ────────────────────
  const refreshData = useCallback(async () => {
    if (profile) {
      await loadData(profile);
    }
  }, [profile, loadData]);

  // ── Refresh user profile & session helper ──
  const refreshProfile = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        setSession(currentSession);
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const prof = await getProfile(user.id);
        if (prof) {
          setProfile(prof);
          await loadData(prof);
        }
      }
    } catch (err) {
      console.error('Refresh profile error:', err);
    }
  }, [loadData]);

  // ── High-level login with credentials that loads profile and data before resolving ──
  const signInWithCredentials = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      if (!authData?.user) throw new Error('No user returned from login');

      setSession(authData.session);
      let prof = null;
      try {
        prof = await getProfile(authData.user.id);
      } catch (pErr) {
        console.warn('Initial profile get failed during sign in, retrying...', pErr);
        await new Promise(r => setTimeout(r, 400));
        prof = await getProfile(authData.user.id);
      }

      if (!prof) {
        const meta = authData.user.user_metadata || {};
        const fallbackRole = meta.role || (email.toLowerCase().includes('teacher') ? 'teacher' : 'student');
        prof = {
          id: authData.user.id,
          first_name: meta.first_name || (fallbackRole === 'teacher' ? 'Teacher' : 'Student'),
          last_name: meta.last_name || '',
          email: authData.user.email,
          role: fallbackRole,
          is_active: true,
        };
      }

      setProfile(prof);
      await loadData(prof);
      setupRealtime(prof);
      setLoading(false);
      return prof.role === 'teacher' ? 'TEACHER' : 'STUDENT';
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, [loadData, setupRealtime]);

  // ── Login / Logout ─────────────────────────
  const login = (role, user) => {
    const sess = { role, user };
    setSession(sess);
  };

  const logout = async () => {
    try {
      subscriptionsRef.current.forEach(sub => sub.unsubscribe());
      subscriptionsRef.current = [];
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setSession(null);
    setProfile(null);
    setData({ users: [], templates: [], assignments: [], submissions: [] });
  };

  // ── Build session object compatible with existing components ──
  const sessionCompat = session && profile ? {
    role: profile.role === 'teacher' ? 'TEACHER' : 'STUDENT',
    user: transformProfile(profile),
  } : null;

  return (
    <DataContext.Provider value={{
      data,
      setData,
      session: sessionCompat,
      login,
      signInWithCredentials,
      logout,
      loading,
      profile,
      refreshData,
      refreshProfile,
      handleError,
      supabaseSession: session,
    }}>
      <ToastContext.Provider value={addToast}>
        <AppBackground />
        <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
          {children}
        </div>
        <Toasts toasts={toasts} />
      </ToastContext.Provider>
    </DataContext.Provider>
  );
};
