import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { 
  LayoutDashboard, BookOpen, Plus, LogOut, ClipboardList, 
  Menu, X, User, Settings, Award, ChevronRight 
} from 'lucide-react';
import LoadingScreen from '../common/LoadingScreen';
import BrandLogo from '../common/BrandLogo';

export default function Layout() {
  const { session, logout, loading } = useData();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const mainContentRef = useRef(null);

  // Scroll to top on route change
  useEffect(() => {
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Handle Escape key to close mobile drawer
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading) return <LoadingScreen message="Loading workspace…" />;
  
  if (!session) {
    const isTeacherPath = location.pathname.startsWith('/teacher');
    return <Navigate to={isTeacherPath ? "/teacher/login" : "/student/login"} replace />;
  }

  // Role routing guards
  if (session.role === 'TEACHER' && location.pathname.startsWith('/student')) {
    return <Navigate to="/teacher/dashboard" replace />;
  }
  if (session.role === 'STUDENT' && location.pathname.startsWith('/teacher')) {
    return <Navigate to="/student/dashboard" replace />;
  }

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const user = session?.user || {};
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'U';

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate(session.role === 'TEACHER' ? '/teacher/login' : '/student/login');
  };

  const navItem = (to, Icon, label) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        className={`g-nav-link${active ? ' active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        style={{
          position: 'relative',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          fontSize: 13.5,
          fontWeight: active ? 600 : 500,
          color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          background: active ? 'var(--color-primary-soft)' : 'transparent',
          border: '1px solid transparent',
          borderColor: active ? 'rgba(36, 74, 58, 0.12)' : 'transparent',
          textDecoration: 'none',
          transition: 'all var(--t-fast)',
        }}
      >
        {active && (
          <span style={{
            position: 'absolute',
            left: 0,
            top: '20%',
            bottom: '20%',
            width: 3.5,
            borderRadius: '0 4px 4px 0',
            background: 'var(--color-primary)',
          }} />
        )}
        <Icon size={17} strokeWidth={active ? 2.2 : 1.9} color={active ? 'var(--color-primary)' : 'var(--color-text-secondary)'} />
        <span style={{ flex: 1 }}>{label}</span>
        {active && <ChevronRight size={14} style={{ opacity: 0.6 }} />}
      </Link>
    );
  };

  return (
    <div className="g-layout-container" style={{ display: 'flex', height: '100%', overflow: 'hidden', backgroundColor: 'var(--color-page)' }}>
      {/* ── Mobile Top Bar (visible <= 768px) ── */}
      <header className="g-mobile-top-bar">
        <BrandLogo
          variant="horizontal"
          size={30}
          subtitle={session.role === 'TEACHER' ? 'Faculty Portal' : 'Student Portal'}
          linkTo={session.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard'}
        />

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="g-btn g-btn-ghost"
          style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* ── Mobile Drawer Overlay ── */}
      {mobileMenuOpen && (
        <div
          className="g-overlay"
          onClick={() => setMobileMenuOpen(false)}
          style={{ zIndex: 300 }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="g-modal"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 340,
              background: 'var(--color-surface)',
              borderRadius: '20px 20px 0 0',
              padding: '24px 20px 32px',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary-soft)', border: '1px solid rgba(36,74,58,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: 'var(--color-primary)',
                }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>
                    {user.firstName} {user.lastName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {user.email}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="g-btn g-btn-ghost"
                style={{ padding: '6px 8px' }}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Links in Drawer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 24 }}>
              {session.role === 'TEACHER' ? (
                <>
                  {navItem('/teacher/dashboard',     LayoutDashboard, 'Dashboard')}
                  {navItem('/teacher/tasks',         BookOpen,        'Tasks & Library')}
                  {navItem('/teacher/reading-tests', Award,           'IELTS Reading')}
                  {navItem('/teacher/settings',      Settings,        'Settings')}
                </>
              ) : (
                <>
                  {navItem('/student/dashboard', LayoutDashboard, 'Dashboard')}
                  {navItem('/student/tasks',     ClipboardList,   'My Tasks')}
                </>
              )}
            </div>

            {/* Logout button in Drawer */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="g-btn g-btn-danger"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '11px 16px',
                  fontWeight: 600,
                  fontSize: 13.5,
                  opacity: loggingOut ? 0.6 : 1,
                }}
              >
                <LogOut size={16} />
                {loggingOut ? 'Logging out…' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stable Academic Sidebar (Desktop) ── */}
      <aside
        className="g-sidebar"
        style={{
          width: 248,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px 20px',
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        {/* Brand Crest & Header */}
        <div style={{ padding: '4px 8px', marginBottom: 28 }}>
          <BrandLogo
            variant="horizontal"
            size={38}
            subtitle={session.role === 'TEACHER' ? 'Faculty Portal' : 'Student Portal'}
            linkTo={session.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard'}
          />
        </div>

        {/* Section Heading */}
        <div style={{ 
          fontSize: 11, 
          fontWeight: 700, 
          textTransform: 'uppercase', 
          letterSpacing: '0.06em', 
          color: 'var(--color-text-muted)', 
          padding: '0 12px 10px' 
        }}>
          {session.role === 'TEACHER' ? 'Teaching Workspace' : 'Student Learning'}
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {session.role === 'TEACHER' ? (
            <>
              {navItem('/teacher/dashboard',     LayoutDashboard, 'Dashboard')}
              {navItem('/teacher/tasks',         BookOpen,        'Tasks & Library')}
              {navItem('/teacher/reading-tests', Award,           'IELTS Reading')}
              {navItem('/teacher/settings',      Settings,        'Account Settings')}
            </>
          ) : (
            <>
              {navItem('/student/dashboard', LayoutDashboard, 'Overview')}
              {navItem('/student/tasks',     ClipboardList,   'Assignments')}
            </>
          )}
        </nav>

        {/* User Identity & Logout Panel */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
          <div style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: 11,
            padding: '8px 10px', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: 6,
            background: 'var(--color-surface-muted)',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{
              width: 32, 
              height: 32, 
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-primary-soft)',
              border: '1px solid rgba(36, 74, 58, 0.2)',
              color: 'var(--color-primary)',
              fontSize: 11.5, 
              fontWeight: 700,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ 
                fontSize: 13, 
                fontWeight: 600, 
                color: 'var(--color-text)', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap' 
              }}>
                {user.firstName} {user.lastName}
              </div>
              <div style={{ 
                fontSize: 11, 
                color: 'var(--color-text-muted)', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap' 
              }}>
                {user.email}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="g-btn g-btn-ghost"
            style={{ 
              width: '100%', 
              justifyContent: 'flex-start',
              padding: '8px 10px',
              color: 'var(--color-text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer', 
              opacity: loggingOut ? 0.6 : 1 
            }}
          >
            <LogOut size={15} strokeWidth={1.9} />
            <span>{loggingOut ? 'Signing out…' : 'Sign out'}</span>
          </button>
        </div>
      </aside>

      {/* ── Main content canvas ── */}
      <main
        ref={mainContentRef}
        className="g-main-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '36px 40px',
          minWidth: 0,
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>

      {/* ── Mobile Bottom Navigation Bar (visible <= 768px) ── */}
      <nav className="g-mobile-bottom-bar" aria-label="Mobile navigation">
        {session.role === 'TEACHER' ? (
          <>
            <Link
              to="/teacher/dashboard"
              className={`g-mobile-nav-btn${location.pathname === '/teacher/dashboard' ? ' active' : ''}`}
            >
              <LayoutDashboard size={19} />
              <span>Overview</span>
            </Link>

            <Link
              to="/teacher/tasks"
              className={`g-mobile-nav-btn${isActive('/teacher/tasks') ? ' active' : ''}`}
            >
              <BookOpen size={19} />
              <span>Tasks</span>
            </Link>

            <Link
              to="/teacher/tasks/new"
              className="g-mobile-nav-btn"
              aria-label="Create Task"
            >
              <div className="g-mobile-nav-btn-highlight">
                <Plus size={20} strokeWidth={2.5} />
              </div>
              <span>Add</span>
            </Link>

            <Link
              to="/teacher/reading-tests"
              className={`g-mobile-nav-btn${location.pathname.startsWith('/teacher/reading-tests') ? ' active' : ''}`}
            >
              <Award size={19} />
              <span>IELTS</span>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="g-mobile-nav-btn"
              aria-label="Account Menu"
            >
              <User size={19} />
              <span>Menu</span>
            </button>
          </>
        ) : (
          <>
            <Link
              to="/student/dashboard"
              className={`g-mobile-nav-btn${location.pathname === '/student/dashboard' ? ' active' : ''}`}
            >
              <LayoutDashboard size={19} />
              <span>Overview</span>
            </Link>

            <Link
              to="/student/tasks"
              className={`g-mobile-nav-btn${location.pathname.startsWith('/student/tasks') ? ' active' : ''}`}
            >
              <ClipboardList size={19} />
              <span>Tasks</span>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="g-mobile-nav-btn"
              aria-label="Account Menu"
            >
              <User size={19} />
              <span>Menu</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
}
