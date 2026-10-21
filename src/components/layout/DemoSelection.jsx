import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../hooks/useAppState';
import { GraduationCap } from 'lucide-react';

export default function DemoSelection() {
  const navigate = useNavigate();
  const { setRole } = useAppState();

  const handleSelect = (r) => {
    setRole(r);
    navigate(r === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--color-page, #F7F8F5)', padding: 20 }}>
      <div style={{
        padding: '3rem 2.5rem',
        textAlign: 'center',
        maxWidth: '420px',
        width: '100%',
        background: 'var(--color-surface, #FFFFFF)',
        border: '1px solid var(--color-border, #DDE3DC)',
        borderRadius: 'var(--radius-xl, 18px)',
        boxShadow: 'var(--shadow-modal)',
      }}>
        <div style={{
          width: 64, height: 64,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.25rem',
        }}>
          <img
            src="/assets/hometask-icon.png"
            alt="HomeTask"
            style={{ width: 64, height: 64, objectFit: 'contain' }}
          />
        </div>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', color: 'var(--color-text, #202923)' }}>HomeTask Academic</h1>
        <p style={{ color: 'var(--color-text-secondary, #5D685F)', margin: '0 0 1.75rem', fontSize: 13.5 }}>IELTS & Classroom Platform Demo</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <button
            onClick={() => handleSelect('teacher')}
            style={{
              padding: '12px 20px',
              borderRadius: 'var(--radius-sm, 6px)',
              background: 'var(--color-primary, #244A3A)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            Teacher Portal Demo
          </button>
          <button
            onClick={() => handleSelect('student')}
            style={{
              padding: '12px 20px',
              borderRadius: 'var(--radius-sm, 6px)',
              background: '#ffffff',
              color: 'var(--color-text, #202923)',
              border: '1px solid var(--color-border, #DDE3DC)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Student Portal Demo
          </button>
        </div>
      </div>
    </div>
  );
}