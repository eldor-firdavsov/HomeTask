import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { LayoutDashboard, BookOpen, Plus, LogOut, ClipboardList, Menu, X, User, ChevronRight, Settings, Timer } from 'lucide-react';

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

  if (loading) return null;
  if (!session) return <Navigate to="/teacher/login" replace />;

  const isActive = (path) => {
    if (path === '/teacher/tasks') {
      return location.pathname.startsWith('/teacher/tasks') && location.pathname !== '/teacher/tasks/new';
    }
    return location.pathname.startsWith(path);
  };
  const user = session.user;
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate(session.role === 'TEACHER' ? '/teacher/login' : '/student/login');
  };

  const navItem = (to, Icon, label) => (
    <Link
      to={to}
      className={`g-nav-link${isActive(to) ? ' active' : ''}`}
      onClick={() => setMobileMenuOpen(false)}
    >
      <Icon size={15} strokeWidth={2} />
      {label}
    </Link>
  );

  return (
    <div className="g-layout-container" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Mobile Top Bar (visible <= 768px) ── */}
      <header className="g-mobile-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'var(--accent-text)',
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Homework
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--txt-secondary)', fontWeight: 500 }}>
              {session.role === 'TEACHER' ? 'Teacher Portal' : 'Student Portal'}
            </div>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="g-btn g-btn-ghost"
          style={{ padding: '8px 10px', borderRadius: 'var(--r-sm)' }}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* ── Mobile Drawer Overlay ── */}
      {mobileMenuOpen && (
        <div
          className="g-overlay"
          onClick={() => setMobileMenuOpen(false)}
          style={{ zIndex: 100 }}
        >
          <div
            className="glass-4"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 320,
              background: 'rgba(255, 255, 255, 0.90)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              borderRadius: '24px 24px 0 0',
              padding: '24px 20px 32px',
              border: '1px solid rgba(255, 255, 255, 0.80)',
              boxShadow: '0 -8px 32px rgba(30, 40, 100, 0.15)',
              animation: 'modalSlideUpSpring 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: 'var(--accent-text)',
                }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt-primary)' }}>
                    {user.firstName} {user.lastName}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--txt-secondary)' }}>
                    {user.email}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="g-btn g-btn-ghost"
                style={{ padding: '6px 8px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Links in Drawer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
              {session.role === 'TEACHER' ? (
                <>
                  {navItem('/teacher/dashboard', LayoutDashboard, 'Dashboard')}
                  {navItem('/teacher/tasks',     BookOpen,        'Task Library')}
                  {navItem('/teacher/tasks/new', Plus,            'Create New Task')}
                  {navItem('/teacher/settings',  Settings,        'Settings')}
                </>
              ) : (
                <>
                  {navItem('/student/dashboard', LayoutDashboard, 'Dashboard')}
                  {navItem('/student/tasks',     ClipboardList,   'My Tasks')}
                  {navItem('/student/pomodoro',  Timer,           'Pomodoro Focus')}
                </>
              )}
            </div>

            {/* Logout button */}
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 16 }}>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="g-btn g-btn-ghost"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  color: 'var(--clr-overdue-txt)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.20)',
                  padding: '10px 14px',
                  fontWeight: 600,
                  fontSize: 13,
                  opacity: loggingOut ? 0.6 : 1,
                }}
              >
                <LogOut size={15} style={{ marginRight: 6 }} />
                {loggingOut ? 'Logging out…' : 'Log out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Glass Sidebar (Desktop) ── */}
      <aside
        className="g-sidebar glass-1"
        style={{
          width: 224,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '28px 16px 24px',
          borderRadius: '0 0 0 0',
          borderTop: 'none',
          borderLeft: 'none',
          borderBottom: 'none',
          borderRight: '1px solid rgba(255,255,255,0.55)',
        }}
      >
        {/* Logo */}
        <div style={{ paddingLeft: 4, marginBottom: 36 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt-primary)', letterSpacing: '-0.02em' }}>
            Homework
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-tertiary)', marginTop: 2, fontWeight: 500 }}>
            {session.role === 'TEACHER' ? 'Teacher portal' : 'Student portal'}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {session.role === 'TEACHER' ? (
            <>
              {navItem('/teacher/dashboard', LayoutDashboard, 'Dashboard')}
              {navItem('/teacher/tasks',     BookOpen,        'Tasks')}
              {navItem('/teacher/tasks/new', Plus,            'Add Task')}
              {navItem('/teacher/settings',  Settings,        'Settings')}
            </>
          ) : (
            <>
              {navItem('/student/dashboard', LayoutDashboard, 'Dashboard')}
              {navItem('/student/tasks',     ClipboardList,   'My Tasks')}
              {navItem('/student/pomodoro',  Timer,           'Pomodoro')}
            </>
          )}
        </nav>

        {/* User */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.45)', paddingTop: 16 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 'var(--r-sm)', marginBottom: 4,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.25)',
              color: 'var(--accent-text)',
              fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>{initials}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.firstName} {user.lastName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="g-nav-link"
            style={{ width: '100%', background: 'none', border: '1px solid transparent', color: 'var(--txt-secondary)', cursor: 'pointer', opacity: loggingOut ? 0.6 : 1 }}
          >
            <LogOut size={14} strokeWidth={2} />
            {loggingOut ? 'Logging out…' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main
        ref={mainContentRef}
        className="g-main-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '44px 52px',
          minWidth: 0,
        }}
      >
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div key={location.pathname} className="g-page-transition">
            <Outlet />
          </div>
        </div>
      </main>

      {/* ── Mobile Bottom Navigation Bar (visible <= 768px) ── */}
      <nav className="g-mobile-bottom-bar">
        {session.role === 'TEACHER' ? (
          <>
            <Link
              to="/teacher/dashboard"
              className={`g-mobile-nav-btn${location.pathname === '/teacher/dashboard' ? ' active' : ''}`}
            >
              <LayoutDashboard size={19} />
              <span>Dashboard</span>
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
            >
              <div className="g-mobile-nav-btn-highlight">
                <Plus size={20} strokeWidth={2.5} />
              </div>
              <span>Add</span>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="g-mobile-nav-btn"
            >
              <User size={19} />
              <span>Profile</span>
            </button>
          </>
        ) : (
          <>
            <Link
              to="/student/dashboard"
              className={`g-mobile-nav-btn${location.pathname === '/student/dashboard' ? ' active' : ''}`}
            >
              <LayoutDashboard size={19} />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/student/tasks"
              className={`g-mobile-nav-btn${location.pathname.startsWith('/student/tasks') ? ' active' : ''}`}
            >
              <ClipboardList size={19} />
              <span>Tasks</span>
            </Link>

            <Link
              to="/student/pomodoro"
              className={`g-mobile-nav-btn${location.pathname === '/student/pomodoro' ? ' active' : ''}`}
            >
              <Timer size={19} />
              <span>Pomodoro</span>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="g-mobile-nav-btn"
            >
              <User size={19} />
              <span>Profile</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
}
