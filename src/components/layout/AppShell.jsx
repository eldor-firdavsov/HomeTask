import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAppState } from '../../hooks/useAppState';
import { LayoutDashboard, ClipboardList, Users, Settings, User } from 'lucide-react';

import BrandLogo from '../common/BrandLogo';

export default function AppShell({ role }) {
  const navigate = useNavigate();
  const { currentStudentId, setCurrentStudentId, students, setRole } = useAppState();

  const switchDemo = (e) => {
    const val = e.target.value;
    if (val === 'teacher') {
      setRole('teacher');
      navigate('/teacher/dashboard');
    } else {
      setRole('student');
      setCurrentStudentId(val);
      navigate('/student/tasks');
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Desktop */}
      <div className="sidebar" style={{
        margin: '1rem',
        borderRadius: 'var(--radius-lg, 14px)',
        background: 'var(--color-surface, #FFFFFF)',
        border: '1px solid var(--color-border, #DDE3DC)',
        boxShadow: 'var(--shadow-card)',
        padding: '1.5rem',
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <BrandLogo variant="horizontal" size={34} subtitle="Academic Platform" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {role === 'teacher' ? (
            <>
              <button className="btn btn-glass" style={{ justifyContent: 'flex-start', color: 'var(--color-text, #202923)' }} onClick={() => navigate('/teacher/dashboard')}><LayoutDashboard size={18} /> Dashboard</button>
              <button className="btn btn-glass" style={{ justifyContent: 'flex-start', color: 'var(--color-text, #202923)' }} onClick={() => navigate('/teacher/tasks')}><ClipboardList size={18} /> Tasks</button>
              <button className="btn btn-glass" style={{ justifyContent: 'flex-start', color: 'var(--color-text, #202923)' }} onClick={() => navigate('/teacher/reading-tests')}><Users size={18} /> IELTS Reading</button>
            </>
          ) : (
            <>
              <button className="btn btn-glass" style={{ justifyContent: 'flex-start', color: 'var(--color-text, #202923)' }} onClick={() => navigate('/student/dashboard')}><LayoutDashboard size={18} /> Dashboard</button>
              <button className="btn btn-glass" style={{ justifyContent: 'flex-start', color: 'var(--color-text, #202923)' }} onClick={() => navigate('/student/tasks')}><ClipboardList size={18} /> Tasks</button>
            </>
          )}
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-secondary, #5D685F)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Demo Mode · {role === 'teacher' ? 'Teacher' : 'Student'}
          </div>
          <select 
            className="btn btn-glass" 
            style={{ width: '100%', appearance: 'none', background: 'var(--color-surface-muted, #F0F3EE)', border: '1px solid var(--color-border, #DDE3DC)', color: 'var(--color-text, #202923)' }}
            value={role === 'teacher' ? 'teacher' : currentStudentId}
            onChange={switchDemo}
          >
            <option value="teacher">Teacher Portal</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>Student - {s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}