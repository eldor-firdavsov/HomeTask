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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="glass" style={{ padding: '2rem', width: '100%', maxWidth: '500px', background: 'var(--bg-1)' }}>
        <h2>Create Task</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <input placeholder="Task Title" value={title} onChange={e => setTitle(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)' }} />
          <select value={type} onChange={e => setType(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
            <option>Homework</option><option>Writing</option><option>Quiz</option>
          </select>
          <textarea placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', minHeight: '100px' }} />
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Publish Task</Button>
          </div>
        </div>
      </div>
    </div>
  );
}