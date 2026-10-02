import React, { useState } from 'react';
import { useAppState } from '../../hooks/useAppState';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import CreateTaskModal from './CreateTaskModal';

export default function TeacherTasks() {
  const { tasks } = useAppState();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Tasks</h1>
          <p style={{ color: 'var(--muted)' }}>Manage assignments and deadlines</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> New Task
        </button>
      </div>

      <div className="glass" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem' }}>Task</th>
              <th style={{ padding: '1rem' }}>Type</th>
              <th style={{ padding: '1rem' }}>Deadline</th>
              <th style={{ padding: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: '500' }}>{t.title}</td>
                <td style={{ padding: '1rem' }}><span className="badge badge-unseen">{t.type}</span></td>
                <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.875rem' }}>{new Date(t.deadline).toLocaleString()}</td>
                <td style={{ padding: '1rem' }}>
                  <button className="btn btn-glass" onClick={() => navigate(`/teacher/tasks/${t.id}`)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <CreateTaskModal onClose={() => setShowModal(false)} />}
    </div>
  );
}