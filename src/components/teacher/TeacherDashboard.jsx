import React from 'react';
import { useAppState } from '../../hooks/useAppState';

export default function TeacherDashboard() {
  const { tasks, assignments } = useAppState();

  const pendingReviews = assignments.filter(a => a.status === 'submitted').length;
  const overdue = assignments.filter(a => a.status === 'overdue').length;

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '0.5rem' }}>Good morning, Ms. Nilufar</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>Here's what is happening in your class today.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Active Tasks</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{tasks.length}</div>
        </div>
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Pending Reviews</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning)' }}>{pendingReviews}</div>
        </div>
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Overdue</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger)' }}>{overdue}</div>
        </div>
      </div>
    </div>
  );
}