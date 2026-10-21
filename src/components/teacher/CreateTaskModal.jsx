import React, { useState } from 'react';
import { useAppState } from '../../hooks/useAppState';
import Button from '../common/Button';

export default function CreateTaskModal({ onClose }) {
  const { tasks, setTasks, students, assignments, setAssignments } = useAppState();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Homework');
  const [desc, setDesc] = useState('');
  
  const handleSave = () => {
    const newId = Date.now().toString();
    const newTask = {
      id: newId,
      title, type, description: desc,
      deadline: new Date(Date.now() + 86400000).toISOString(),
      maxScore: 10,
      assignedStudentIds: students.map(s => s.id)
    };
    
    const newAssignments = students.map(s => ({
      id: `a_${Date.now()}_${s.id}`,
      taskId: newId,
      studentId: s.id,
      status: 'unseen',
      firstSeenAt: null, submittedAt: null, reviewedAt: null, score: null, teacherFeedback: '', submission: null
    }));

    setTasks([...tasks, newTask]);
    setAssignments([...assignments, ...newAssignments]);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-task-modal-title"
        style={{
          padding: '2rem',
          width: '100%',
          maxWidth: '500px',
          background: 'var(--color-surface, #FFFFFF)',
          border: '1px solid var(--color-border, #DDE3DC)',
          borderRadius: 'var(--radius-lg, 14px)',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        <h2 id="create-task-modal-title" style={{ margin: '0 0 1rem', fontSize: '1.25rem', color: 'var(--color-text, #202923)' }}>Create Task</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary, #5D685F)', textTransform: 'uppercase', marginBottom: 6 }}>
              Task Title
            </label>
            <input
              placeholder="e.g. Vocabulary & Essay Practice"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm, 6px)',
                background: '#ffffff',
                border: '1px solid var(--color-border, #DDE3DC)',
                color: 'var(--color-text, #202923)',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary, #5D685F)', textTransform: 'uppercase', marginBottom: 6 }}>
              Task Type
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm, 6px)',
                background: '#ffffff',
                border: '1px solid var(--color-border, #DDE3DC)',
                color: 'var(--color-text, #202923)',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            >
              <option>Homework</option><option>Writing</option><option>Quiz</option><option>Reading</option><option>Vocabulary</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary, #5D685F)', textTransform: 'uppercase', marginBottom: 6 }}>
              Instructions & Description
            </label>
            <textarea
              placeholder="Provide detailed instructions for your students..."
              value={desc}
              onChange={e => setDesc(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm, 6px)',
                background: '#ffffff',
                border: '1px solid var(--color-border, #DDE3DC)',
                color: 'var(--color-text, #202923)',
                boxSizing: 'border-box',
                minHeight: '100px',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Publish Task</Button>
          </div>
        </div>
      </div>
    </div>
  );
}