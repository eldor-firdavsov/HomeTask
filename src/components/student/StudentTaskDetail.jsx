import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '../../hooks/useAppState';
import { ArrowLeft, FileText, Link, Upload, CheckCircle2 } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { getDeadlineLabel } from '../../utils/dates';
import { getTaskStatus } from '../../utils/taskStatus';

export default function StudentTaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, assignments, currentStudentId, setAssignments } = useAppState();

  const [answer, setAnswer] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [fileName, setFileName] = useState('');

  const task = tasks.find(t => t.id === id);
  let assignment = assignments.find(a => a.taskId === id && a.studentId === currentStudentId);
  
  if (!assignment && task) {
    // If unseen, we should create a local assignment state when viewing.
    // For this prototype we assume assignments are created when the task is published.
  }

  if (!task || !assignment) return <div>Task not found</div>;

  const status = getTaskStatus(assignment, task);

  const handleStartWork = () => {
    setAssignments(assignments.map(a => 
      a.id === assignment.id ? { ...a, status: 'in_progress', firstSeenAt: a.firstSeenAt || new Date().toISOString() } : a
    ));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = () => {
    setAssignments(assignments.map(a => 
      a.id === assignment.id 
        ? { 
            ...a, 
            status: 'submitted', 
            submittedAt: new Date().toISOString(),
            submission: { textAnswer: answer, linkUrl, fileName, createdAt: new Date().toISOString() }
          } 
        : a
    ));
    // Toast should go here ideally
    navigate('/student/tasks');
  };

  return (
    <div className="animate-fade-in">
      <Button variant="glass" style={{ marginBottom: '1.5rem' }} onClick={() => navigate('/student/tasks')}>
        <ArrowLeft size={18} /> Back
      </Button>

      <div className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>{task.title}</h1>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Badge type={task.type}>{task.type}</Badge>
              <Badge type={status}>{status.replace('_', ' ')}</Badge>
              <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{getDeadlineLabel(task.deadline)} ({new Date(task.deadline).toLocaleString()})</span>
            </div>
          </div>
        </div>
        <p style={{ marginTop: '1.5rem', lineHeight: '1.6' }}>{task.description}</p>
        
        {task.sourceUrl && (
          <div style={{ marginTop: '1.5rem' }}>
            <Button variant="glass" onClick={() => window.open(task.sourceUrl, '_blank')}>
              Open source ↗
            </Button>
          </div>
        )}
      </div>

      {(status === 'unseen' || status === 'seen') && (
        <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>
           <Button variant="primary" onClick={handleStartWork}>Start working</Button>
        </div>
      )}

      {(status === 'in_progress' || status === 'needs_revision') && (
        <div className="glass" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Submit your work</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 500 }}><FileText size={18} /> Your answer</label>
            <textarea 
              style={{ width: '100%', minHeight: '150px', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text)', fontFamily: 'inherit' }}
              placeholder="Write your answer here..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
              {answer.trim().split(/\s+/).filter(w => w).length} words
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
             <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 500 }}><Link size={18} /> Optional link</label>
             <input 
               type="url"
               value={linkUrl}
               onChange={e => setLinkUrl(e.target.value)}
               placeholder="https://"
               style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text)' }}
             />
          </div>

          <div style={{ marginBottom: '2rem' }}>
             <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 500 }}><Upload size={18} /> Upload file</label>
             <input type="file" onChange={handleFileChange} />
             {fileName && <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--primary)' }}>📎 {fileName}</div>}
          </div>

          <Button variant="primary" onClick={handleSubmit}>Submit Work</Button>
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--muted)' }}>Submitting after the deadline will be marked as late.</div>
        </div>
      )}

      {['submitted', 'late_submitted', 'on_time'].includes(status) && (
        <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>
          <CheckCircle2 size={48} style={{ color: 'var(--success)', margin: '0 auto 1rem auto' }} />
          <h3>Work Submitted</h3>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Submitted at: {new Date(assignment.submittedAt).toLocaleString()}</p>
        </div>
      )}

      {status === 'reviewed' && (
        <div className="glass" style={{ padding: '2rem', background: 'var(--surface-hover)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--success)' }}>Feedback from Teacher</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {assignment.score}
            </div>
            <div style={{ color: 'var(--muted)' }}>out of {task.maxScore}</div>
          </div>
          <div style={{ padding: '1.5rem', background: 'var(--bg-1)', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ fontStyle: 'italic', fontSize: '1.1rem' }}>"{assignment.teacherFeedback}"</p>
          </div>
          <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
             Submitted: {new Date(assignment.submittedAt).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}