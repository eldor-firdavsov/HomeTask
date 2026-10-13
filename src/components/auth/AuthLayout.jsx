import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, ArrowRight } from 'lucide-react';
import AuthShowcase from './AuthShowcase';

export default function AuthLayout({ role = 'student', children }) {
  return (
    <div className="auth-wrapper" style={{ flexDirection: 'column', justifyContent: 'flex-start', minHeight: '100vh', padding: '20px 24px 36px' }}>
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

      {/* Top Header Navigation Bar with Link to Teacher/Student Auth */}
      <header
        style={{
          width: '100%',
          maxWidth: 1080,
          margin: '0 auto 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 10,
          boxSizing: 'border-box',
          padding: '6px 0',
        }}
      >
        {/* Logo / Brand */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
          }}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
          }}>
            <BookOpen size={18} strokeWidth={2.3} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--txt-primary)', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
              Homework
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-secondary)', fontWeight: 500 }}>
              {role === 'teacher' ? 'Educator Space' : 'Student Portal'}
            </div>
          </div>
        </Link>

        {/* Header Action Button: Link to Teacher or Student Auth Page */}
        <div>
          {role === 'student' ? (
            <Link
              to="/teacher/login"
              className="g-btn glass-2"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 'var(--r-md)',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 700,
                color: '#4f46e5',
                background: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.10)',
                transition: 'all 0.2s ease',
              }}
              title="Go to Teacher Authentication"
            >
              <GraduationCap size={16} strokeWidth={2.3} />
              <span>Teacher Portal</span>
              <ArrowRight size={14} strokeWidth={2.2} />
            </Link>
          ) : (
            <Link
              to="/student/login"
              className="g-btn glass-2"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 'var(--r-md)',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 700,
                color: '#4f46e5',
                background: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.10)',
                transition: 'all 0.2s ease',
              }}
              title="Go to Student Login"
            >
              <BookOpen size={15} strokeWidth={2.3} />
              <span>Student Login</span>
              <ArrowRight size={14} strokeWidth={2.2} />
            </Link>
          )}
        </div>
      </header>

      {/* Main Split Grid */}
      <div className="auth-split-grid" style={{ position: 'relative', zIndex: 1, margin: 'auto 0' }}>
        <div className="auth-showcase-column" style={{ display: 'flex' }}>
          <AuthShowcase activeRole={role} />
        </div>

        {/* Auth Form Card Column */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          {children}
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
