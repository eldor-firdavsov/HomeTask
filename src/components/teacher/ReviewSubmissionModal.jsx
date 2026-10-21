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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        style={{
          padding: '0',
          width: '100%',
          maxWidth: '900px',
          background: 'var(--color-surface, #FFFFFF)',
          border: '1px solid var(--color-border, #DDE3DC)',
          borderRadius: 'var(--radius-lg, 14px)',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          overflow: 'hidden',
          maxHeight: '90vh',
        }}
      >
        
        {/* Left Side: Submission */}
        <div style={{ flex: 1, padding: '2rem', borderRight: '1px solid var(--color-border, #DDE3DC)', overflowY: 'auto', background: '#ffffff' }}>
          <h2 id="review-modal-title" style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', color: 'var(--color-text, #202923)' }}>{student?.name}'s Submission</h2>
          <p style={{ color: 'var(--color-text-secondary, #5D685F)', marginBottom: '1.75rem', fontSize: 13 }}>Submitted: {new Date(assignment.submittedAt).toLocaleString()}</p>
          
          {assignment.submission?.textAnswer && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase', color: 'var(--color-text-secondary, #5D685F)', marginBottom: '0.5rem' }}>Answer Text:</div>
              <div style={{ background: 'var(--color-surface-muted, #F0F3EE)', padding: '1rem', borderRadius: 'var(--radius-sm, 6px)', border: '1px solid var(--color-border, #DDE3DC)', whiteSpace: 'pre-wrap', color: 'var(--color-text, #202923)', fontSize: 13.5, lineHeight: 1.6 }}>
                {assignment.submission.textAnswer}
              </div>
            </div>
          )}

          {assignment.submission?.linkUrl && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase', color: 'var(--color-text-secondary, #5D685F)', marginBottom: '0.5rem' }}>Link:</div>
              <a href={assignment.submission.linkUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary, #244A3A)', fontWeight: 600, wordBreak: 'break-all' }}>
                {assignment.submission.linkUrl}
              </a>
            </div>
          )}

          {assignment.submission?.fileName && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase', color: 'var(--color-text-secondary, #5D685F)', marginBottom: '0.5rem' }}>Attached File:</div>
              <div style={{ color: 'var(--color-primary, #244A3A)', fontWeight: 600 }}>📎 {assignment.submission.fileName}</div>
            </div>
          )}
        </div>

        {/* Right Side: Grading */}
        <div style={{ width: '350px', padding: '2rem', background: 'var(--color-surface-muted, #F0F3EE)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', color: 'var(--color-text, #202923)' }}>Grade & Feedback</h3>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase', color: 'var(--color-text-secondary, #5D685F)', marginBottom: '0.4rem' }}>Score (Max {task.maxScore})</label>
            <input 
              type="number" 
              value={score} 
              onChange={e => setScore(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm, 6px)', border: '1px solid var(--color-border, #DDE3DC)', background: '#ffffff', color: 'var(--color-text, #202923)', boxSizing: 'border-box' }}
              max={task.maxScore}
            />
          </div>

          <div style={{ marginBottom: '1.5rem', flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase', color: 'var(--color-text-secondary, #5D685F)', marginBottom: '0.4rem' }}>Teacher Feedback</label>
            <textarea 
              value={feedback} 
              onChange={e => setFeedback(e.target.value)}
              placeholder="Leave constructive academic feedback for the student..."
              style={{ width: '100%', minHeight: '130px', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm, 6px)', border: '1px solid var(--color-border, #DDE3DC)', background: '#ffffff', color: 'var(--color-text, #202923)', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Button variant="primary" onClick={() => handleReview('reviewed')}>Mark Reviewed</Button>
            <Button variant="secondary" onClick={() => handleReview('needs_revision')} style={{ color: 'var(--color-warning, #956515)' }}>Request Revision</Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </div>

      </div>
    </div>
  );
}
