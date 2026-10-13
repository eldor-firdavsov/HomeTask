import React from 'react';

export default function LoadingScreen({ message = 'Loading…' }) {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: 'rgba(99,102,241,0.14)',
        border: '1px solid rgba(99,102,241,0.24)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'pulse 1.5s ease-in-out infinite',
        boxShadow: '0 4px 16px rgba(99,102,241,0.15)',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      </div>
      <div style={{ fontSize: 13.5, color: 'var(--txt-secondary)', fontWeight: 600, letterSpacing: '0.01em' }}>
        {message}
      </div>
    </div>
  );
}
