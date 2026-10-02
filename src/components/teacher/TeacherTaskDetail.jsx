import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '../../hooks/useAppState';
import { ArrowLeft } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import ReviewSubmissionModal from './ReviewSubmissionModal';
import { getTaskStatus } from '../../utils/taskStatus';

export default function TeacherTaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, assignments, students } = useAppState();
  const [reviewingAssignment, setReviewingAssignment] = useState(null);

  const task = tasks.find(t => t.id === id);
  const taskAssignments = assignments.filter(a => a.taskId === id);

  if (!task) return <div>Task not found</div>;

  return (
    <div className="animate-fade-in">
      <Button variant="glass" style={{ marginBottom: '1.5rem' }} onClick={() => navigate('/teacher/tasks')}>
        <ArrowLeft size={18} /> Back
      </Button>

      <div className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>{task.title}</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Badge type={task.type}>{task.type}</Badge>
          <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Due: {new Date(task.deadline).toLocaleString()}</span>
        </div>
        <p style={{ marginTop: '1rem' }}>{task.description}</p>
      </div>

      <h2>Submissions</h2>
      <div className="glass" style={{ marginTop: '1rem', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem' }}>Student</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Submitted At</th>
              <th style={{ padding: '1rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {taskAssignments.map(a => {
              const student = students.find(s => s.id === a.studentId);
              const status = getTaskStatus(a, task);
              return (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{student?.name}</td>
                  <td style={{ padding: '1rem' }}>
                    <Badge type={status}>{status.replace('_', ' ')}</Badge>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--muted)' }}>
                    {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : '-'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {(a.status === 'submitted' || a.status === 'reviewed') && (
                      <Button variant="primary" onClick={() => setReviewingAssignment(a)}>Review</Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {reviewingAssignment && (
        <ReviewSubmissionModal 
          assignment={reviewingAssignment} 
          task={task} 
          onClose={() => setReviewingAssignment(null)} 
        />
      )}
    </div>
  );
}