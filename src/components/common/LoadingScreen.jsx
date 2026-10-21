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
      backgroundColor: 'var(--color-page)',
    }}>
      <div style={{
        position: 'relative',
        width: 60,
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Subtle spinning ring */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '2.5px solid var(--color-primary-soft, #E6EEE8)',
          borderTopColor: 'var(--color-primary, #244A3A)',
          animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
        }} />
        {/* HomeTask Crest */}
        <img
          src="/assets/hometask-icon.png"
          alt="HomeTask"
          style={{ width: 34, height: 34, objectFit: 'contain' }}
        />
      </div>
      <div style={{ 
        fontSize: 14, 
        color: 'var(--color-text-secondary)', 
        fontWeight: 600, 
        letterSpacing: '0.01em',
        fontFamily: 'inherit'
      }}>
        {message}
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
