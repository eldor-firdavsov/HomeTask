import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  KeyRound,
  ExternalLink,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { resetPassword } from '../../lib/supabase/auth.js';
import AuthLayout from '../../components/auth/AuthLayout';

export default function ForgotPassword({ role = 'teacher' }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const loginPath = role === 'teacher' ? '/teacher/login' : '/student/login';

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const triggerShake = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email.trim()) {
      triggerShake('Please enter your email address.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      triggerShake('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword(email.trim());
      setSent(true);
      setCooldown(60);
    } catch (err) {
      triggerShake(err?.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (cooldown > 0 || loading) return;
    handleSubmit();
  };

  return (
    <AuthLayout role={role}>
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
          {/* Back link */}
          <Link
            to={loginPath}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--txt-secondary)',
              textDecoration: 'none',
              marginBottom: 20,
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--txt-secondary)'}
          >
            <ArrowLeft size={14} />
            Back to {role === 'teacher' ? 'Teacher' : 'Student'} Sign In
          </Link>

          {/* Header */}
          <div style={{ marginBottom: 26 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.2) 100%)',
              border: '1px solid rgba(99,102,241,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
              boxShadow: '0 4px 14px rgba(99,102,241,0.15)',
            }}>
              <KeyRound size={22} color="#4f46e5" />
            </div>

            <h1 style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--txt-primary)',
              letterSpacing: '-0.02em',
              margin: '0 0 6px',
            }}>
              Reset Password
            </h1>
            <p style={{ fontSize: 13, color: 'var(--txt-secondary)', margin: 0, lineHeight: 1.55 }}>
              {role === 'teacher'
                ? 'Enter your registered educator email address and we’ll send you a recovery link to create a new password.'
                : 'Enter your student email address to receive password reset instructions.'}
            </p>
          </div>

          {sent ? (
            <div>
              {/* Success Card */}
              <div style={{
                padding: '20px',
                background: 'rgba(52, 211, 153, 0.12)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                borderRadius: 'var(--r-md)',
                marginBottom: 22,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#10b981',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <CheckCircle2 size={16} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--clr-done-txt)' }}>
                    Reset Email Dispatched
                  </span>
                </div>

                <p style={{ fontSize: 13, color: 'var(--txt-primary)', margin: 0, lineHeight: 1.5 }}>
                  We’ve sent a password reset link to <strong style={{ wordBreak: 'break-all' }}>{email}</strong>. Please check your inbox and spam folders.
                </p>
              </div>

              {/* Resend Cooldown Action */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.4)',
                borderRadius: 'var(--r-sm)',
                border: '1px solid rgba(255, 255, 255, 0.65)',
                marginBottom: 20,
              }}>
                <span style={{ fontSize: 12, color: 'var(--txt-secondary)' }}>
                  Didn't receive the email?
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: cooldown > 0 ? 'var(--txt-tertiary)' : 'var(--accent-text)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: cooldown > 0 ? 'default' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <RefreshCw size={12} className={loading ? 'auth-spinner' : ''} />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend now'}
                </button>
              </div>

              {/* Direct Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link
                  to={loginPath}
                  className="g-btn g-btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    padding: '12px',
                    fontSize: 13.5,
                    fontWeight: 700,
                  }}
                >
                  Return to Sign In
                </Link>

                <a
                  href={`mailto:${email}`}
                  className="g-btn g-btn-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    padding: '11px',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <ExternalLink size={14} />
                  Open Email Client
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 18 }}>
                <label style={{
                  display: 'block',
                  fontSize: 11.5,
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  color: 'var(--txt-secondary)',
                  marginBottom: 6,
                }}>
                  Your email address
                </label>
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
                    autoComplete="email"
                    autoFocus
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Error Alert */}
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

              {/* Helper note for students */}
              {role === 'student' && (
                <div style={{
                  padding: '10px 12px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  borderRadius: 'var(--r-sm)',
                  border: '1px solid rgba(99, 102, 241, 0.18)',
                  fontSize: 11.5,
                  color: 'var(--txt-secondary)',
                  marginBottom: 18,
                  lineHeight: 1.5,
                }}>
                  💡 <strong>Tip for students:</strong> If your teacher created your account without external email access, you can also ask your teacher to reset your password in their Settings.
                </div>
              )}

              {/* Submit button */}
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
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
                  opacity: loading ? 0.75 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: 16,
                }}
              >
                {loading ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span className="auth-spinner" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                    Sending link…
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    Send Recovery Link
                    <ArrowRight size={15} />
                  </span>
                )}
              </button>

              <div style={{ textAlign: 'center' }}>
                <Link
                  to={loginPath}
                  style={{
                    fontSize: 12.5,
                    color: 'var(--txt-secondary)',
                    textDecoration: 'none',
                    fontWeight: 500,
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={e => e.target.style.color = 'var(--txt-primary)'}
                  onMouseLeave={e => e.target.style.color = 'var(--txt-secondary)'}
                >
                  ← Never mind, return to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
