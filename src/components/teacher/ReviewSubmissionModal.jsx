import React, { useState } from 'react';
import { useAppState } from '../../hooks/useAppState';
import Button from '../common/Button';

export default function ReviewSubmissionModal({ assignment, task, onClose }) {
  const { assignments, setAssignments, students } = useAppState();
  const student = students.find(s => s.id === assignment.studentId);
  const [score, setScore] = useState(assignment.score || '');
  const [feedback, setFeedback] = useState(assignment.teacherFeedback || '');

  const handleReview = (status) => {
    setAssignments(assignments.map(a => 
      a.id === assignment.id 
        ? { ...a, status, score: Number(score), teacherFeedback: feedback, reviewedAt: new Date().toISOString() } 
        : a
    ));
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="glass" style={{ padding: '0', width: '100%', maxWidth: '900px', background: 'var(--bg-1)', display: 'flex', overflow: 'hidden', maxHeight: '90vh' }}>
        
        {/* Left Side: Submission */}
        <div style={{ flex: 1, padding: '2rem', borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
          <h2>{student?.name}'s Submission</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>Submitted: {new Date(assignment.submittedAt).toLocaleString()}</p>
          
          {assignment.submission?.textAnswer && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Answer Text:</div>
              <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>
                {assignment.submission.textAnswer}
              </div>
            </div>
          )}

          {assignment.submission?.linkUrl && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Link:</div>
              <a href={assignment.submission.linkUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
                {assignment.submission.linkUrl}
              </a>
            </div>
          )}

          {assignment.submission?.fileName && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Attached File:</div>
              <div style={{ color: 'var(--primary)' }}>📎 {assignment.submission.fileName}</div>
            </div>
          )}
        </div>

        {/* Right Side: Grading */}
        <div style={{ width: '350px', padding: '2rem', background: 'var(--surface-hover)', display: 'flex', flexDirection: 'column' }}>
          <h3>Review</h3>
          <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>Score (Max {task.maxScore})</label>
            <input 
              type="number" 
              value={score} 
              onChange={e => setScore(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text)' }}
              max={task.maxScore}
            />
          </div>

          <div style={{ marginBottom: '2rem', flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>Feedback</label>
            <textarea 
              value={feedback} 
              onChange={e => setFeedback(e.target.value)}
              style={{ width: '100%', minHeight: '150px', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text)', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Button variant="primary" onClick={() => handleReview('reviewed')}>Mark Reviewed</Button>
            <Button variant="glass" onClick={() => handleReview('needs_revision')} style={{ color: 'var(--warning)' }}>Request Revision</Button>
            <Button variant="glass" onClick={onClose}>Cancel</Button>
          </div>
        </div>

      </div>
    </div>
  );
}
