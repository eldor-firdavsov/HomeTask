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
  CheckCircle2,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';
import { signIn } from '../../lib/supabase/auth.js';
import { useToast } from '../../context/DataContext';

export default function AuthCard({ initialRole = 'teacher' }) {
  const navigate = useNavigate();
  const toast = useToast();

  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [showDemoOptions, setShowDemoOptions] = useState(false);

  // Sync role when initialRole prop changes
  useEffect(() => {
    setRole(initialRole);
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

  // Monitor Caps Lock key
  const handleKeyDetection = (e) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  };

  const handleRoleSwitch = (newRole) => {
    if (newRole === role) return;
    setRole(newRole);
    setError('');
    navigate(newRole === 'teacher' ? '/teacher/login' : '/student/login', { replace: true });
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

      await signIn(email.trim(), password);
      toast(`Signed in as ${role === 'teacher' ? 'Teacher' : 'Student'} successfully`);

      if (role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      const msg = err?.message || 'Login failed';
      if (msg.includes('Invalid login credentials')) {
        triggerErrorShake(
          role === 'teacher'
            ? 'Invalid email or password. Please verify your credentials.'
            : 'Invalid student credentials. Please check the email and password provided by your teacher.'
        );
      } else if (msg.includes('Email not confirmed')) {
        triggerErrorShake('Account email has not been activated. Please check your confirmation link.');
      } else {
        triggerErrorShake(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (demoEmail, demoRole) => {
    if (demoRole !== role) {
      handleRoleSwitch(demoRole);
    }
    setEmail(demoEmail);
    setPassword('password123'); // Standard demo seed password
    setError('');
  };

  return (
    <div className={`auth-card-panel ${shake ? 'auth-shake' : ''}`}>
      <div
        className="glass-4"
        style={{
          borderRadius: 'var(--r-xl)',
          padding: '36px 32px 30px',
          boxShadow: '0 24px 60px rgba(30, 40, 100, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
          position: 'relative',
        }}
      >
        {/* Segmented Role Switcher Tab */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          padding: 4,
          background: 'rgba(235, 238, 250, 0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: 'var(--r-md)',
          border: '1px solid rgba(255, 255, 255, 0.7)',
          marginBottom: 28,
          gap: 4,
        }}>
          <button
            type="button"
            onClick={() => handleRoleSwitch('teacher')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '9px 12px',
              borderRadius: 'calc(var(--r-md) - 3px)',
              fontSize: 13,
              fontWeight: role === 'teacher' ? 700 : 500,
              color: role === 'teacher' ? '#4f46e5' : 'var(--txt-secondary)',
              background: role === 'teacher' ? '#ffffff' : 'transparent',
              border: role === 'teacher' ? '1px solid rgba(255,255,255,0.9)' : 'none',
              boxShadow: role === 'teacher' ? '0 2px 8px rgba(99,102,241,0.12)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              fontFamily: 'inherit',
            }}
          >
            <GraduationCap size={16} strokeWidth={role === 'teacher' ? 2.5 : 2} />
            Teacher
          </button>
          <button
            type="button"
            onClick={() => handleRoleSwitch('student')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '9px 12px',
              borderRadius: 'calc(var(--r-md) - 3px)',
              fontSize: 13,
              fontWeight: role === 'student' ? 700 : 500,
              color: role === 'student' ? '#4f46e5' : 'var(--txt-secondary)',
              background: role === 'student' ? '#ffffff' : 'transparent',
              border: role === 'student' ? '1px solid rgba(255,255,255,0.9)' : 'none',
              boxShadow: role === 'student' ? '0 2px 8px rgba(99,102,241,0.12)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              fontFamily: 'inherit',
            }}
          >
            <BookOpen size={15} strokeWidth={role === 'student' ? 2.5 : 2} />
            Student
          </button>
        </div>

        {/* Portal Greeting */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: 8,
              background: 'rgba(99, 102, 241, 0.12)',
              color: '#4f46e5',
            }}>
              {role === 'teacher' ? <GraduationCap size={14} /> : <Sparkles size={14} />}
            </span>
            <span style={{
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--accent-text)',
            }}>
              {role === 'teacher' ? 'Educator Sign In' : 'Student Portal'}
            </span>
          </div>

          <h1 style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--txt-primary)',
            letterSpacing: '-0.02em',
            margin: '0 0 6px',
          }}>
            {role === 'teacher' ? 'Welcome back, Teacher' : 'Welcome back, Student'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--txt-secondary)', margin: 0, lineHeight: 1.5 }}>
            {role === 'teacher'
              ? 'Access your assignment manager, student submissions & grading analytics.'
              : 'Log in with credentials from your teacher to view assignments & start sprints.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email field */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                color: 'var(--txt-secondary)',
              }}>
                Email address
              </label>
              <span style={{ fontSize: 11, color: 'var(--txt-tertiary)' }}>
                {role === 'teacher' ? 'School or personal' : 'Student email'}
              </span>
            </div>

            <div className="auth-input-container">
              <span className="auth-input-icon">
                <Mail size={16} />
              </span>
              <input
                type="text"
                inputMode="email"
                autoCapitalize="none"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={role === 'teacher' ? 'teacher@school.edu' : 'student@school.edu'}
                className="auth-input"
                autoComplete="username email"
                disabled={loading}
              />
              {email && (
                <button
                  type="button"
                  onClick={() => setEmail('')}
                  className="auth-action-btn"
                  title="Clear email"
                  tabIndex={-1}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Password field */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                color: 'var(--txt-secondary)',
              }}>
                Password
              </label>
              <Link
                to={role === 'teacher' ? '/teacher/forgot-password' : '/student/forgot-password'}
                style={{
                  fontSize: 12,
                  color: 'var(--accent-text)',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Forgot password?
              </Link>
            </div>

            <div className="auth-input-container">
              <span className="auth-input-icon">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDetection}
                onKeyUp={handleKeyDetection}
                placeholder="••••••••••••"
                className="auth-input"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="auth-action-btn"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Caps Lock indicator */}
            {capsLockActive && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11.5,
                color: '#b45309',
                marginTop: 6,
                fontWeight: 500,
              }}>
                <span style={{ fontSize: 13 }}>⚠️</span> Caps Lock is ON
              </div>
            )}
          </div>

          {/* Remember me checkbox */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}>
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              userSelect: 'none',
              fontSize: 12.5,
              color: 'var(--txt-secondary)',
              fontWeight: 500,
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{
                  accentColor: 'var(--accent)',
                  width: 15,
                  height: 15,
                  cursor: 'pointer',
                }}
              />
              Remember my email
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '11px 14px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.28)',
              borderRadius: 'var(--r-sm)',
              fontSize: 12.5,
              color: '#991b1b',
              marginBottom: 18,
              lineHeight: 1.45,
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1, color: '#dc2626' }} />
              <div>{error}</div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="g-btn g-btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.01em',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
              opacity: loading ? 0.75 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span className="auth-spinner" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                Signing in…
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Sign in to {role === 'teacher' ? 'Dashboard' : 'Portal'}
                <ArrowRight size={15} />
              </span>
            )}
          </button>
        </form>

        {/* Demo Fast-Fill Drawer */}
        <div style={{ marginTop: 22, borderTop: '1px solid rgba(255,255,255,0.5)', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11.5, color: 'var(--txt-tertiary)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Zap size={12} color="#f59e0b" /> Fast Test Logins
            </span>
            <button
              type="button"
              onClick={() => setShowDemoOptions(!showDemoOptions)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-text)',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '2px 4px',
              }}
            >
              {showDemoOptions ? 'Hide' : 'Quick Fill'}
            </button>
          </div>

          {showDemoOptions && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              marginTop: 10,
              padding: 10,
              background: 'rgba(255,255,255,0.4)',
              borderRadius: 'var(--r-sm)',
              border: '1px solid rgba(255,255,255,0.6)',
            }}>
              <button
                type="button"
                onClick={() => quickFill('teacher@example.com', 'teacher')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  background: 'rgba(255,255,255,0.65)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 6,
                  fontSize: 12,
                  color: 'var(--txt-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span><strong>Teacher:</strong> Sarah Mitchell</span>
                <span style={{ fontSize: 10.5, color: 'var(--accent-text)', fontWeight: 600 }}>Fill →</span>
              </button>

              <button
                type="button"
                onClick={() => quickFill('student@example.com', 'student')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  background: 'rgba(255,255,255,0.65)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 6,
                  fontSize: 12,
                  color: 'var(--txt-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span><strong>Student:</strong> Ahmadjon Karimov</span>
                <span style={{ fontSize: 10.5, color: 'var(--accent-text)', fontWeight: 600 }}>Fill →</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginTop: 18,
          fontSize: 11,
          color: 'var(--txt-tertiary)',
        }}>
          <CheckCircle2 size={12} color="#10b981" />
          <span>Encrypted authentication · Supabase Protected</span>
        </div>
      </div>
    </div>
  );
}
