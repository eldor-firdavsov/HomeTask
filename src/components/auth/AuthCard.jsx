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
  const { signInWithCredentials } = useData();

  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const isStudent = role === 'student';

  // Sync role when initialRole changes
  useEffect(() => {
    setRole(initialRole);
    setError('');
  }, [initialRole]);

  // Load remembered email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('hw_remembered_email');
      if (savedEmail) {
        setEmail(savedEmail);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

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
        localStorage.setItem('hw_remembered_email', email.trim());
      } else {
        localStorage.removeItem('hw_remembered_email');
      }

      const userRole = await signInWithCredentials(email.trim(), password);
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
            ? 'Invalid student credentials. Please check the email and password provided by your teacher.'
            : 'Invalid email or password. Please verify your credentials.'
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
            background: isStudent ? 'rgba(99, 102, 241, 0.08)' : 'rgba(79, 70, 229, 0.08)',
            color: '#4338ca',
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          {isStudent ? <BookOpen size={13} /> : <GraduationCap size={13} />}
          <span>{isStudent ? 'Student Portal' : 'Educator Space'}</span>
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
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: '#334155',
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
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <Mail size={16} />
            </span>
            <input
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
                color: '#0f172a',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 10,
                outline: 'none',
                transition: 'all 0.15s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.background = '#ffffff';
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.background = '#f8fafc';
                e.target.style.borderColor = '#cbd5e1';
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
                  color: '#94a3b8',
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
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
              }}
            >
              Password
            </label>
            <Link
              to={isStudent ? '/student/forgot-password' : '/teacher/forgot-password'}
              style={{
                fontSize: 12.5,
                fontWeight: 500,
                color: '#4f46e5',
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
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <Lock size={16} />
            </span>
            <input
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
                color: '#0f172a',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 10,
                outline: 'none',
                transition: 'all 0.15s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.background = '#ffffff';
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.background = '#f8fafc';
                e.target.style.borderColor = '#cbd5e1';
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
                color: '#94a3b8',
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
              color: '#475569',
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
                accentColor: '#4f46e5',
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
          style={{
            width: '100%',
            padding: '12px 20px',
            fontSize: 14,
            fontWeight: 600,
            color: '#ffffff',
            background: '#4f46e5',
            border: 'none',
            borderRadius: 10,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.8 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
            transition: 'background 0.15s ease, transform 0.05s ease',
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = '#4338ca';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.background = '#4f46e5';
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
          marginTop: 24,
          paddingTop: 20,
          borderTop: '1px solid #f1f5f9',
          textAlign: 'center',
          fontSize: 13,
          color: '#64748b',
        }}
      >
        {isStudent ? (
          <div>
            <span>Are you a teacher? </span>
            <Link
              to="/teacher/login"
              style={{
                color: '#4f46e5',
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
                color: '#4f46e5',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Sign in to Student Login →
            </Link>
          </div>
        )}
      </div>

      {/* Subtle Demo Quick-Fill */}
      <div
        style={{
          marginTop: 14,
          textAlign: 'center',
        }}
      >
        <button
          type="button"
          onClick={() => handleQuickFill(isStudent ? 'student' : 'teacher')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: 12,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 6,
            transition: 'color 0.15s ease',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#4f46e5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          Click to auto-fill {isStudent ? 'student demo credentials' : 'teacher demo credentials'}
        </button>
      </div>
    </div>
  );
}
