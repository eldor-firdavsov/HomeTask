import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';

const ACCOUNTS = [
  { email: 'teacher@example.com', label: 'Sarah Mitchell', role: 'Teacher', primary: true },
  { email: 'student@example.com', label: 'Ahmadjon Karimov', role: 'Student', primary: false },
];

export default function Login() {
  const { login, data, session } = useData();
  const navigate = useNavigate();

  if (session) {
    return <Navigate to={session.role === 'TEACHER' ? '/teacher/dashboard' : '/student/tasks'} replace />;
  }

  const handleLogin = (email) => {
    const user = data.users.find(u => u.email === email);
    if (!user) return;
    login(user.role, user);
    navigate(user.role === 'TEACHER' ? '/teacher/dashboard' : '/student/tasks');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      {/* Card */}
      <div
        className="glass-4"
        style={{
          width: '100%',
          maxWidth: 360,
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
            Choose a demo account to continue
          </p>
        </div>

        {/* Accounts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ACCOUNTS.map(acc => (
            <button
              key={acc.email}
              onClick={() => handleLogin(acc.email)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px',
                background: acc.primary
                  ? 'rgba(99,102,241,0.90)'
                  : 'rgba(255,255,255,0.45)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: acc.primary
                  ? '1px solid rgba(99,102,241,0.60)'
                  : '1px solid rgba(255,255,255,0.65)',
                borderRadius: 'var(--r-md)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                boxShadow: acc.primary
                  ? '0 4px 16px rgba(99,102,241,0.30), inset 0 1px 0 rgba(255,255,255,0.18)'
                  : '0 2px 10px rgba(30,40,100,0.04), inset 0 1px 0 rgba(255,255,255,0.60)',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = acc.primary
                  ? '0 8px 24px rgba(99,102,241,0.40), inset 0 1px 0 rgba(255,255,255,0.22)'
                  : '0 6px 20px rgba(30,40,100,0.08), inset 0 1px 0 rgba(255,255,255,0.72)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = acc.primary
                  ? '0 4px 16px rgba(99,102,241,0.30), inset 0 1px 0 rgba(255,255,255,0.18)'
                  : '0 2px 10px rgba(30,40,100,0.04), inset 0 1px 0 rgba(255,255,255,0.60)';
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: acc.primary ? 'rgba(255,255,255,0.20)' : 'rgba(99,102,241,0.12)',
                border: `1px solid ${acc.primary ? 'rgba(255,255,255,0.30)' : 'rgba(99,102,241,0.20)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                color: acc.primary ? 'rgba(255,255,255,0.90)' : 'var(--accent-text)',
              }}>
                {acc.label.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: acc.primary ? '#fff' : 'var(--txt-primary)' }}>
                  {acc.label}
                </div>
                <div style={{ fontSize: 11, color: acc.primary ? 'rgba(255,255,255,0.70)' : 'var(--txt-secondary)', marginTop: 1 }}>
                  {acc.role}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <p style={{ fontSize: 11, color: 'var(--txt-tertiary)', textAlign: 'center', marginTop: 24, marginBottom: 0, lineHeight: 1.6 }}>
          Demo only · Data stored in browser · No backend required
        </p>
      </div>
    </div>
  );
}
