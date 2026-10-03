import React from 'react';
import AuthShowcase from './AuthShowcase';

export default function AuthLayout({ role = 'teacher', children }) {
  return (
    <div className="auth-wrapper">
      {/* Decorative ambient background accents */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        {/* Soft background grid pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(99, 102, 241, 0.12) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.6,
        }} />

        {/* Ambient Gradient Orbs */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          left: '10%',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(168,85,247,0.08) 50%, transparent 70%)',
          filter: 'blur(50px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20%',
          right: '5%',
          width: '45vw',
          height: '45vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.14) 0%, rgba(99,102,241,0.1) 50%, transparent 70%)',
          filter: 'blur(60px)',
        }} />
      </div>

      {/* Main Split Grid */}
      <div className="auth-split-grid" style={{ position: 'relative', zIndex: 1 }}>
        {/* Desktop Showcase Side */}
        <div className="hidden md:block" style={{ display: 'none' }}>
          {/* Note: Handled via media query / flex below */}
        </div>
        <div className="auth-showcase-column" style={{ display: 'flex' }}>
          <AuthShowcase activeRole={role} />
        </div>

        {/* Auth Form Card Column */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div key={role} className="g-page-transition" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            {children}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 959px) {
          .auth-showcase-column {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
