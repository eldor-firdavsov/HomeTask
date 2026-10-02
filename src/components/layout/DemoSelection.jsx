import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../hooks/useAppState';
import { BookOpen } from 'lucide-react';

export default function DemoSelection() {
  const navigate = useNavigate();
  const { setRole } = useAppState();

  const handleSelect = (r) => {
    setRole(r);
    navigate(r === 'teacher' ? '/teacher/dashboard' : '/student/tasks');
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <BookOpen size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
        <h1 style={{ marginBottom: '0.5rem' }}>ClassFlow</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>English Class Task Tracker</p>
        
        <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Frontend prototype<br/>Data is stored locally
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={() => handleSelect('teacher')}>
            Teacher Demo
          </button>
          <button className="btn btn-glass" onClick={() => handleSelect('student')}>
            Student Demo
          </button>
        </div>
      </div>
    </div>
  );
}