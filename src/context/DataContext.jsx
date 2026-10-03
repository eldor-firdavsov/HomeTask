import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase/client.js';
import { getProfile, onAuthStateChange } from '../lib/supabase/auth.js';
import { getStudents } from '../lib/supabase/students.js';
import { getTaskTemplates } from '../lib/supabase/tasks.js';
import { getTeacherAssignments, getMyAssignments } from '../lib/supabase/assignments.js';
import { getTeacherSubmissions } from '../lib/supabase/submissions.js';
import { transformProfile, transformSubmission } from '../lib/supabase/transforms.js';

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
    addToast(msg, 'error');
  }, [addToast]);

  // ── Load data based on role ────────────────
  const loadData = useCallback(async (userProfile) => {
    try {
      if (userProfile.role === 'teacher') {
        const [students, templates, assignments, submissions] = await Promise.all([
          getStudents(),
          getTaskTemplates(),
          getTeacherAssignments(),
          getTeacherSubmissions(),
        ]);
        setData({
          users: [
            transformProfile(userProfile),
            ...students.map(transformProfile),
          ],
          templates,
          assignments,
          submissions,
        });
      } else {
        // Student: load only own assignments
        const assignments = await getMyAssignments();
        // Load submissions for each assignment
        const { data: subs } = await supabase
          .from('submissions')
          .select('*')
          .order('submitted_at', { ascending: false });

        setData({
          users: [transformProfile(userProfile)],
          templates: [],
          assignments,
          submissions: (subs || []).map(transformSubmission),
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
          // Reload assignments on any change
          try {
            const assignments = await getTeacherAssignments();
            setData(prev => ({ ...prev, assignments }));
          } catch (err) {
            console.error('Realtime assignment reload error:', err);
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
            const submissions = await getTeacherSubmissions();
            setData(prev => ({ ...prev, submissions }));
          } catch (err) {
            console.error('Realtime submission reload error:', err);
          }
        })
        .subscribe();

      subscriptionsRef.current = [assignmentSub, submissionSub];
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
            const assignments = await getMyAssignments();
            setData(prev => ({ ...prev, assignments }));
          } catch (err) {
            console.error('Realtime assignment reload error:', err);
          }
        })
        .subscribe();

      subscriptionsRef.current = [assignmentSub];
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
            const prof = await getProfile(initialSession.user.id);
            if (!mounted) return;
            setProfile(prof);
            await loadData(prof);
            setupRealtime(prof);
          } catch (err) {
            // Profile might not exist yet or user is invalid
            console.error('Failed to load profile:', err);
            setSession(null);
            setProfile(null);
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

      if (event === 'SIGNED_IN' && newSession?.user) {
        setSession(newSession);
        try {
          const prof = await getProfile(newSession.user.id);
          if (!mounted) return;
          setProfile(prof);
          await loadData(prof);
          setupRealtime(prof);
        } catch (err) {
          console.error('Auth change profile error:', err);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setData({ users: [], templates: [], assignments: [], submissions: [] });
        subscriptionsRef.current.forEach(sub => sub.unsubscribe());
        subscriptionsRef.current = [];
      } else if (event === 'TOKEN_REFRESHED') {
        setSession(newSession);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      subscriptionsRef.current.forEach(sub => sub.unsubscribe());
    };
  }, [loadData, setupRealtime]);

  // ── Refresh data helper ────────────────────
  const refreshData = useCallback(async () => {
    if (profile) {
      await loadData(profile);
    }
  }, [profile, loadData]);

  // ── Login / Logout ─────────────────────────
  const login = (role, user) => {
    // This is now handled by onAuthStateChange
    // But we keep a compatible interface for any components that still call it
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
      logout,
      loading,
      profile,
      refreshData,
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
