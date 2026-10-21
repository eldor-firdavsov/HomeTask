import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  BookOpen,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { useToast, useData } from '../../context/DataContext';

export default function AuthCard({ initialRole = 'student' }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { signInWithCredentials, session, logout } = useData();

  const [role, setRole] = useState(initialRole);
  const isStudent = role === 'student';
  const storageKey = isStudent ? 'hw_remembered_student_email' : 'hw_remembered_teacher_email';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  // Sync role and load remembered email when initialRole changes
  useEffect(() => {
    setRole(initialRole);
    setError('');
    try {
      const key = initialRole === 'student' ? 'hw_remembered_student_email' : 'hw_remembered_teacher_email';
      const savedEmail = localStorage.getItem(key);
      if (savedEmail) {
        setEmail(savedEmail);
      } else {
        setEmail('');
      }
    } catch {
      setEmail('');
    }
  }, [initialRole]);

  const handleKeyDetection = (e) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  };

  const triggerErrorShake = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password) {
      triggerErrorShake('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (rememberMe) {
        localStorage.setItem(storageKey, email.trim());
      } else {
        localStorage.removeItem(storageKey);
      }

      const userRole = await signInWithCredentials(email.trim(), password);

      if (!isStudent && userRole === 'STUDENT') {
        toast('Signed in with a Student account. Redirecting to Student Dashboard…', 'info');
        navigate('/student/dashboard', { replace: true });
        return;
      }

      if (isStudent && userRole === 'TEACHER') {
        toast('Signed in with a Teacher account. Redirecting to Teacher Dashboard…', 'info');
        navigate('/teacher/dashboard', { replace: true });
        return;
      }

      toast(`Signed in as ${userRole === 'TEACHER' ? 'Teacher' : 'Student'} successfully`);

      if (userRole === 'TEACHER') {
        navigate('/teacher/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err?.message || 'Login failed';
      if (msg.includes('Invalid login credentials')) {
        triggerErrorShake(
          isStudent
            ? 'Invalid student credentials. Please verify your email and password (Demo: eldor@ilmla.uz / password123).'
            : 'Invalid teacher email or password. Please verify your credentials (Demo: teacher@ilmla.uz / password123).'
        );
      } else if (msg.includes('Email not confirmed')) {
        triggerErrorShake('Account email has not been confirmed yet. Please check your inbox.');
      } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.toLowerCase().includes('fetch')) {
        triggerErrorShake('Cannot reach the authentication server. Please check your connection or restore your database if paused.');
      } else {
        triggerErrorShake(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (targetRole) => {
    if (targetRole === 'student') {
      setEmail('eldor@ilmla.uz');
      setPassword('password123');
    } else {
      setEmail('teacher@ilmla.uz');
      setPassword('password123');
    }
    setError('');
  };

  const handleInstantSignIn = async (targetRole) => {
    const targetEmail = targetRole === 'student' ? 'eldor@ilmla.uz' : 'teacher@ilmla.uz';
    const targetPassword = 'password123';
    setEmail(targetEmail);
    setPassword(targetPassword);
    setError('');
    setLoading(true);

    try {
      const userRole = await signInWithCredentials(targetEmail, targetPassword);
      toast(`Signed in as ${userRole === 'TEACHER' ? 'Teacher' : 'Student'} successfully`);
      if (userRole === 'TEACHER') {
        navigate('/teacher/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err) {
      triggerErrorShake(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={shake ? 'auth-shake' : ''}
      style={{
        background: '#ffffff',
        borderRadius: 18,
        border: '1px solid rgba(226, 232, 240, 0.9)',
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.03)',
        padding: '36px 32px 32px',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      {/* Header section */}
      <div style={{ marginBottom: 28, textAlign: 'left' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'var(--color-primary-soft)',
            color: 'var(--color-primary)',
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          <img
            src="/assets/hometask-icon.png"
            alt=""
            style={{ width: 14, height: 14, objectFit: 'contain' }}
          />
          <span>{isStudent ? 'HomeTask Student Portal' : 'HomeTask Educator Space'}</span>
        </div>

        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: '#0f172a',
            margin: '0 0 6px',
            lineHeight: 1.25,
          }}
        >
          {isStudent ? 'Student Login' : 'Teacher Login'}
        </h1>
        <p
          style={{
            fontSize: 13.5,
            color: '#64748b',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {isStudent
            ? 'Sign in to access your assigned homework, submit work, and check feedback.'
            : 'Sign in to manage classes, create homework tasks, and review submissions.'}
        </p>
      </div>

      {/* Active Session Notice Banner if user is logged into the opposite role */}
      {session && session.role !== (isStudent ? 'STUDENT' : 'TEACHER') && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '12px 14px',
            background: 'var(--color-primary-soft)',
            border: '1px solid rgba(36, 74, 58, 0.2)',
            borderRadius: 10,
            fontSize: 12.5,
            color: 'var(--color-primary)',
            marginBottom: 20,
            lineHeight: 1.45,
          }}
        >
          <div>
            Signed in as <strong>{session.user?.firstName || 'User'}</strong> ({session.role === 'TEACHER' ? 'Teacher' : 'Student'}).
            <div style={{ fontSize: 11.5, color: 'var(--color-text-secondary)' }}>Sign in below to switch, or continue to your dashboard.</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => navigate(session.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard')}
              style={{
                background: 'var(--color-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                padding: '5px 10px',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Dashboard →
            </button>
            <button
              type="button"
              onClick={async () => {
                await logout();
                toast('Signed out');
              }}
              style={{
                background: '#ffffff',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                padding: '5px 8px',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '12px 14px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 10,
            fontSize: 13,
            color: '#991b1b',
            marginBottom: 20,
            lineHeight: 1.45,
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2, color: '#dc2626' }} />
          <div>{error}</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div style={{ marginBottom: 18 }}>
          <label
            htmlFor="login-email"
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text)',
              marginBottom: 7,
            }}
          >
            Email address
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                position: 'absolute',
                left: 14,
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <Mail size={16} />
            </span>
            <input
              id="login-email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoComplete="username email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isStudent ? 'student@school.uz' : 'teacher@school.uz'}
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px 40px 11px 40px',
                fontSize: 14,
                color: 'var(--color-text)',
                background: '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                outline: 'none',
                transition: 'all 0.15s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 3px var(--color-primary-focus)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border)';
                e.target.style.boxShadow = 'none';
              }}
            />
            {email && !loading && (
              <button
                type="button"
                onClick={() => setEmail('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 4,
                }}
                title="Clear"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 7,
            }}
          >
            <label
              htmlFor="login-password"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-text)',
              }}
            >
              Password
            </label>
            <Link
              to={isStudent ? '/student/forgot-password' : '/teacher/forgot-password'}
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: 'var(--color-primary)',
                textDecoration: 'none',
              }}
            >
              Forgot password?
            </Link>
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                position: 'absolute',
                left: 14,
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <Lock size={16} />
            </span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDetection}
              onKeyUp={handleKeyDetection}
              placeholder="••••••••••••"
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px 40px 11px 40px',
                fontSize: 14,
                color: 'var(--color-text)',
                background: '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                outline: 'none',
                transition: 'all 0.15s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 3px var(--color-primary-focus)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 12,
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                borderRadius: 4,
              }}
              title={showPassword ? 'Hide password' : 'Show password'}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {capsLockActive && (
            <div
              style={{
                fontSize: 12,
                color: '#b45309',
                marginTop: 6,
                fontWeight: 500,
              }}
            >
              ⚠️ Caps Lock is turned on
            </div>
          )}
        </div>

        {/* Remember me */}
        <div style={{ marginBottom: 22 }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--color-text-secondary)',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                width: 16,
                height: 16,
                accentColor: 'var(--color-primary)',
                cursor: 'pointer',
                borderRadius: 4,
              }}
            />
            <span>Remember my email</span>
          </label>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="g-btn g-btn-primary"
          style={{
            width: '100%',
            padding: '12px 20px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 10,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.8 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {loading ? (
            <span>Signing in…</span>
          ) : (
            <>
              <span>Sign in as {isStudent ? 'Student' : 'Teacher'}</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      {/* Switch between Student and Teacher Auth */}
      <div
        style={{
          marginTop: 22,
          paddingTop: 18,
          borderTop: '1px solid var(--color-border)',
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--color-text-secondary)',
        }}
      >
        {isStudent ? (
          <div>
            <span>Are you a teacher? </span>
            <Link
              to="/teacher/login"
              style={{
                color: 'var(--color-primary)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Sign in to Teacher Portal →
            </Link>
          </div>
        ) : (
          <div>
            <span>Are you a student? </span>
            <Link
              to="/student/login"
              style={{
                color: 'var(--color-primary)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Sign in to Student Login →
            </Link>
          </div>
        )}
      </div>

      {/* Demo Credentials Section (Clearly Labeled & Subordinate to Main Form) */}
      <div
        style={{
          marginTop: 20,
          padding: '13px 16px',
          borderRadius: 12,
          background: 'var(--color-surface-muted)',
          border: '1px dashed var(--color-border-strong)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          textAlign: 'left',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--color-primary)',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Sparkles size={12} style={{ color: 'var(--color-primary)' }} />
            <span>Demo Test Credentials</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginTop: 2 }}>
            {isStudent ? 'eldor@ilmla.uz' : 'teacher@ilmla.uz'}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--color-text-secondary)', marginTop: 1 }}>
            Password:{' '}
            <code
              style={{
                background: '#ffffff',
                border: '1px solid var(--color-border)',
                padding: '1px 5px',
                borderRadius: 4,
                fontFamily: 'monospace',
                fontWeight: 600,
                color: 'var(--color-text)',
              }}
            >
              password123
            </code>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleQuickFill(isStudent ? 'student' : 'teacher')}
          disabled={loading}
          className="g-btn g-btn-secondary"
          style={{
            padding: '7px 12px',
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            gap: 5,
          }}
          title="Fill demo credentials into form"
        >
          <Sparkles size={12} style={{ color: 'var(--color-primary)' }} />
          <span>Fill Demo</span>
        </button>
      </div>
    </div>
  );
}
