import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn } from '../../lib/supabase/auth.js';
import { useToast } from '../../context/DataContext';

export default function StudentLogin() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email.trim(), password);
      toast('Logged in successfully');
      navigate('/student/tasks');
    } catch (err) {
      const msg = err?.message || 'Login failed';
      if (msg.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check the credentials provided by your teacher.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Your account has not been activated. Please contact your teacher.');
      } else {
        setError(msg);
      }
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

  const labelStyle = {
    display: 'block', fontSize: 11.5, fontWeight: 600,
    letterSpacing: '0.04em', textTransform: 'uppercase',
    color: 'var(--txt-secondary)', marginBottom: 7,
  };

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
        <div style={{ marginBottom: 32 }}>
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
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--txt-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Homework
          </h1>
          <p style={{ fontSize: 13, color: 'var(--txt-secondary)', margin: '4px 0 0' }}>
            Student Portal · Sign in with credentials from your teacher
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email address</label>
            <input
              type="text"
              inputMode="email"
              autoCapitalize="none"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="student@school or student@email.com"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
              autoComplete="current-password"
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
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Links */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 20 }}>
          <Link
            to="/student/forgot-password"
            style={{ fontSize: 12.5, color: 'var(--accent-text)', textDecoration: 'none', transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.target.style.opacity = '0.75'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >
            Forgot password?
          </Link>
          <Link
            to="/teacher/login"
            style={{ fontSize: 12, color: 'var(--txt-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.target.style.color = 'var(--txt-primary)'}
            onMouseLeave={e => e.target.style.color = 'var(--txt-secondary)'}
          >
            Are you a teacher? Sign in here →
          </Link>
        </div>

        {/* Footer */}
        <p style={{ fontSize: 11, color: 'var(--txt-tertiary)', textAlign: 'center', marginTop: 24, marginBottom: 0, lineHeight: 1.6 }}>
          Powered by Supabase · Secure authentication
        </p>
      </div>
    </div>
  );
}
