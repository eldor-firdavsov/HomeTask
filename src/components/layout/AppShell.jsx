import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAppState } from '../../hooks/useAppState';
import { LayoutDashboard, ClipboardList, Users, Settings, User } from 'lucide-react';

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
      <div className="sidebar glass" style={{ margin: '1rem', borderRadius: 'var(--radius-lg)' }}>
        <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>CF</div>
          ClassFlow
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {role === 'teacher' ? (
            <>
              <button className="btn btn-glass" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/teacher/dashboard')}><LayoutDashboard size={18} /> Dashboard</button>
              <button className="btn btn-glass" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/teacher/tasks')}><ClipboardList size={18} /> Tasks</button>
              <button className="btn btn-glass" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/teacher/analytics')}><Users size={18} /> Analytics</button>
            </>
          ) : (
            <>
              <button className="btn btn-glass" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/student/tasks')}><ClipboardList size={18} /> Tasks</button>
            </>
          )}
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Demo Mode · {role === 'teacher' ? 'Teacher' : 'Student'}
          </div>
          <select 
            className="btn btn-glass" 
            style={{ width: '100%', appearance: 'none' }}
            value={role === 'teacher' ? 'teacher' : currentStudentId}
            onChange={switchDemo}
          >
            <option value="teacher">Teacher - Ms. Nilufar</option>
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