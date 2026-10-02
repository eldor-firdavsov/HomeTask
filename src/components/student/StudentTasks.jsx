import React from 'react';
import { useAppState } from '../../hooks/useAppState';
import { useNavigate } from 'react-router-dom';

export default function StudentTasks() {
  const { currentStudentId, tasks, assignments, students } = useAppState();
  const navigate = useNavigate();
  const student = students.find(s => s.id === currentStudentId);

  const studentAssignments = assignments.filter(a => a.studentId === currentStudentId);
  const getTask = (taskId) => tasks.find(t => t.id === taskId);

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '0.5rem' }}>Good morning, {student?.name.split(' ')[0]}</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>Ready to make progress today?</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {studentAssignments.map(a => {
          const task = getTask(a.taskId);
          if (!task) return null;
          return (
            <div key={a.id} className="glass" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate(`/student/tasks/${task.id}`)}>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge badge-unseen">{task.type}</span>
                  <span className={`badge badge-${a.status}`}>{a.status.replace('_', ' ')}</span>
                </div>
                <h3 style={{ marginBottom: '0.5rem' }}>{task.title}</h3>
                <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Due: {new Date(task.deadline).toLocaleString()}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}