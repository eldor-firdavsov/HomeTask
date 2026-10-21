import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, ArrowRight, ShieldCheck } from 'lucide-react';
import BrandLogo from '../common/BrandLogo';

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
        background: 'var(--color-page, #F7F8F5)',
        position: 'relative',
        boxSizing: 'border-box',
        padding: '24px 20px',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Subtle background decoration (very soft & minimalist academic atmosphere) */}
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
            top: '-15%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '400px',
            background: 'radial-gradient(ellipse at center, rgba(36, 74, 58, 0.05) 0%, rgba(247, 248, 245, 0) 70%)',
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
        <BrandLogo
          variant="horizontal"
          size={38}
          subtitle="Academic Platform"
          linkTo="/"
        />

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
                color: 'var(--color-primary, #244A3A)',
                background: '#ffffff',
                border: '1px solid var(--color-border, #DDE3DC)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              title="Switch to Teacher Login"
            >
              <GraduationCap size={15} />
              <span>Teacher Portal</span>
              <ArrowRight size={13} strokeWidth={2.2} />
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
                color: 'var(--color-primary, #244A3A)',
                background: '#ffffff',
                border: '1px solid var(--color-border, #DDE3DC)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              title="Switch to Student Login"
            >
              <BookOpen size={14} />
              <span>Student Portal</span>
              <ArrowRight size={13} strokeWidth={2.2} />
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

      {/* Minimal Academic Footer */}
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
          color: 'var(--color-text-muted, #778078)',
        }}
      >
        <ShieldCheck size={14} color="var(--color-primary, #244A3A)" />
        <span>Secure Academic Authentication · HomeTask & IELTS Platform</span>
      </footer>
    </div>
  );
}

