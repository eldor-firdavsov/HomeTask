import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AuthLayout({ role = 'student', children }) {
  const isStudent = role === 'student';

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
        position: 'relative',
        boxSizing: 'border-box',
        padding: '24px 20px',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Subtle background decoration (very soft & minimalist) */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '400px',
            background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.12) 0%, rgba(238, 242, 255, 0) 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* Top Header */}
      <header
        style={{
          width: '100%',
          maxWidth: 480,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 1,
          padding: '4px 0 16px',
        }}
      >
        {/* Brand */}
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
            }}
          >
            <BookOpen size={18} strokeWidth={2.4} />
          </div>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: '#0f172a',
            }}
          >
            Homework
          </span>
        </Link>

        {/* Role Switcher in Header */}
        <div>
          {isStudent ? (
            <Link
              to="/teacher/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                color: '#4338ca',
                background: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              title="Switch to Teacher Login"
            >
              <GraduationCap size={15} />
              <span>Teacher Login</span>
              <ArrowRight size={13} strokeWidth={2.4} />
            </Link>
          ) : (
            <Link
              to="/student/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                color: '#4338ca',
                background: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              title="Switch to Student Login"
            >
              <BookOpen size={14} />
              <span>Student Login</span>
              <ArrowRight size={13} strokeWidth={2.4} />
            </Link>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main
        style={{
          width: '100%',
          maxWidth: 440,
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </main>

      {/* Minimal Footer */}
      <footer
        style={{
          width: '100%',
          maxWidth: 440,
          margin: '16px auto 0',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          fontSize: 12,
          color: '#94a3b8',
        }}
      >
        <ShieldCheck size={14} color="#6366f1" />
        <span>Secure authentication · Homework Platform</span>
      </footer>
    </div>
  );
}
