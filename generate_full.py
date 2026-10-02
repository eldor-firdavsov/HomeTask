import os

files = {
    "src/utils/statistics.js": """
export const calculateCompletionRate = (studentId, assignments) => {
  const studentAssignments = assignments.filter(a => a.studentId === studentId);
  if (studentAssignments.length === 0) return 0;
  const completed = studentAssignments.filter(a => ['submitted', 'reviewed'].includes(a.status)).length;
  return Math.round((completed / studentAssignments.length) * 100);
};

export const calculateOnTimeRate = (studentId, assignments, tasks) => {
  const studentAssignments = assignments.filter(a => a.studentId === studentId && ['submitted', 'reviewed'].includes(a.status));
  if (studentAssignments.length === 0) return 0;
  
  const onTime = studentAssignments.filter(a => {
    const task = tasks.find(t => t.id === a.taskId);
    if (!task) return false;
    return new Date(a.submittedAt) <= new Date(task.deadline);
  }).length;
  
  return Math.round((onTime / studentAssignments.length) * 100);
};

export const calculateAverageScore = (studentId, assignments) => {
  const reviewed = assignments.filter(a => a.studentId === studentId && a.status === 'reviewed' && a.score !== null);
  if (reviewed.length === 0) return 0;
  const sum = reviewed.reduce((acc, a) => acc + a.score, 0);
  return (sum / reviewed.length).toFixed(1);
};
""",
    "src/utils/taskStatus.js": """
export const getTaskStatus = (assignment, task) => {
  if (!assignment) return 'unseen';
  if (assignment.status === 'reviewed') return 'reviewed';
  if (assignment.status === 'needs_revision') return 'needs_revision';
  if (assignment.status === 'submitted') {
    const isLate = new Date(assignment.submittedAt) > new Date(task.deadline);
    return isLate ? 'late_submitted' : 'on_time';
  }
  
  if (new Date() > new Date(task.deadline)) return 'overdue';
  return assignment.status; 
};
""",
    "src/components/common/Badge.jsx": """
import React from 'react';
export default function Badge({ type, children }) {
  return <span className={`badge badge-${type}`}>{children}</span>;
}
""",
    "src/components/common/Button.jsx": """
import React from 'react';
export default function Button({ variant = 'glass', children, onClick, style, ...props }) {
  return <button className={`btn btn-${variant}`} onClick={onClick} style={style} {...props}>{children}</button>;
}
""",
    "src/components/teacher/CreateTaskModal.jsx": """
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
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content.strip())

print("More files generated")
