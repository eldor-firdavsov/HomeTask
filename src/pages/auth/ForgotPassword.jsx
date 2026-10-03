import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../../lib/supabase/auth.js';

export default function ForgotPassword({ role = 'teacher' }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = 'rgba(99,102,241,0.50)';
    e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.10), 0 2px 8px rgba(30,40,100,0.04)';
    e.target.style.background = 'rgba(255,255,255,0.62)';
  };
  const handleBlur = (e) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.60)';
    e.target.style.boxShadow = '0 2px 8px rgba(30,40,100,0.04), inset 0 1px 0 rgba(255,255,255,0.55)';
    e.target.style.background = 'rgba(255,255,255,0.40)';
  };

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.40)', backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.60)',
    borderRadius: 'var(--r-sm)', padding: '11px 14px', fontSize: 14,
    color: 'var(--txt-primary)', fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', transition: 'all 0.15s',
    boxShadow: '0 2px 8px rgba(30,40,100,0.04), inset 0 1px 0 rgba(255,255,255,0.55)',
  };

  const loginPath = role === 'teacher' ? '/teacher/login' : '/student/login';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div
        className="glass-4"
        style={{
          width: '100%',
          maxWidth: 380,
          borderRadius: 'var(--r-xl)',
          padding: '40px 36px 32px',
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(99,102,241,0.14)',
            border: '1px solid rgba(99,102,241,0.24)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--txt-primary)', margin: 0 }}>
            Reset Password
          </h1>
          <p style={{ fontSize: 13, color: 'var(--txt-secondary)', margin: '6px 0 0', lineHeight: 1.5 }}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {sent ? (
          <div>
            <div style={{
              padding: '16px 18px',
              background: 'rgba(52,211,153,0.14)',
              border: '1px solid rgba(52,211,153,0.30)',
              borderRadius: 'var(--r-md)',
              marginBottom: 20,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--clr-done-txt)', marginBottom: 4 }}>
                ✓ Check your email
              </div>
              <p style={{ fontSize: 13, color: 'var(--txt-primary)', margin: 0, lineHeight: 1.5 }}>
                We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions.
              </p>
            </div>
            <Link
              to={loginPath}
              className="g-btn g-btn-secondary"
              style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', display: 'flex' }}
            >
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--txt-secondary)', marginBottom: 7 }}>
                Email address
              </label>
              <input
                type="text"
                inputMode="email"
                autoCapitalize="none"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@school or you@email.com"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', background: 'var(--clr-overdue)', border: '1px solid var(--clr-overdue-bd)',
                borderRadius: 'var(--r-sm)', fontSize: 12.5, color: 'var(--clr-overdue-txt)', marginBottom: 16,
              }}>{error}</div>
            )}

            <button
              type="submit"
              className="g-btn g-btn-primary"
              disabled={loading}
              style={{
                width: '100%', justifyContent: 'center', padding: '12px 20px',
                fontSize: 14, fontWeight: 600, opacity: loading ? 0.7 : 1,
                marginBottom: 12,
              }}
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>

            <Link
              to={loginPath}
              style={{
                display: 'block', textAlign: 'center',
                fontSize: 12.5, color: 'var(--txt-secondary)', textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.target.style.color = 'var(--txt-primary)'}
              onMouseLeave={e => e.target.style.color = 'var(--txt-secondary)'}
            >
              ← Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
