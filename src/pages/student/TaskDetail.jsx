import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData, useToast } from '../../context/DataContext';
import {
  ArrowLeft, CheckCircle2, AlertCircle, Clock, Send,
  Link as LinkIcon, FileText, Image as ImageIcon, ExternalLink, Download, X
} from 'lucide-react';
import { TypeChip, StatusBadge, formatDateTime, isOverdue, uid } from '../../utils/helpers.jsx';

export default function StudentTaskDetail() {
  const { assignmentId } = useParams();
  const { data, setData, session } = useData();
  const navigate = useNavigate();
  const toast    = useToast();
  const [zoomImage, setZoomImage] = useState(null);

  const assignment = data.assignments.find(a => a.id === assignmentId);
  const teacher    = data.users.find(u => u.role === 'TEACHER');

  const submission = useMemo(() =>
    data.submissions
      .filter(s => s.assignedTaskId === assignmentId)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0],
    [data.submissions, assignmentId]
  );

  const [content,  setContent]  = useState(submission?.content || '');
  const [busy,     setBusy]     = useState(false);

  const onFocus = e => {
    e.target.style.borderColor = 'rgba(99,102,241,0.50)';
    e.target.style.boxShadow   = '0 0 0 4px rgba(99,102,241,0.10)';
    e.target.style.background  = 'rgba(255,255,255,0.62)';
  };
  const onBlur = e => {
    e.target.style.borderColor = 'rgba(255,255,255,0.60)';
    e.target.style.boxShadow   = '0 2px 8px rgba(30,40,100,0.04), inset 0 1px 0 rgba(255,255,255,0.55)';
    e.target.style.background  = 'rgba(255,255,255,0.40)';
  };

  if (!assignment) return (
    <div className="g-page" style={{ textAlign: 'center', padding: 80 }}>
      <p style={{ color: 'var(--txt-secondary)' }}>Task not found.</p>
      <Link to="/student/tasks" className="g-btn g-btn-primary" style={{ marginTop: 16 }}>Back to tasks</Link>
    </div>
  );

  const canSubmit = !['SUBMITTED','UNDER_REVIEW','DONE'].includes(assignment.status);
  const overdueA  = isOverdue(assignment);
  const dlDate    = assignment.deadline ? new Date(assignment.deadline) : null;
  const dlStr     = dlDate ? dlDate.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) + ', ' + dlDate.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : null;

  const handleSaveDraft = () => {
    setData({
      ...data,
      assignments: data.assignments.map(a =>
        a.id === assignmentId ? { ...a, status: 'IN_PROGRESS', updatedAt: new Date().toISOString() } : a
      ),
    });
    toast('Draft saved');
  };

  const handleSubmit = () => {
    if (!content.trim()) { toast('Your submission cannot be empty.', 'error'); return; }
    setBusy(true);
    const newSub = {
      id: uid('sub'), assignedTaskId: assignmentId, studentId: session.user.id,
      content: content.trim(), status: 'SUBMITTED',
      submittedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
    };
    const updatedAssignments = data.assignments.map(a =>
      a.id === assignmentId ? { ...a, status: 'SUBMITTED', updatedAt: new Date().toISOString() } : a
    );
    setData({ ...data, submissions: [...data.submissions, newSub], assignments: updatedAssignments });
    setBusy(false);
    toast('Task submitted successfully');
    setTimeout(() => navigate('/student/tasks'), 600);
  };

  const textareaStyle = {
    width: '100%', background: 'rgba(255,255,255,0.40)', backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.60)',
    borderRadius: 'var(--r-md)', padding: '14px 16px', fontSize: 14.5,
    color: 'var(--txt-primary)', fontFamily: 'inherit', outline: 'none',
    resize: 'vertical', lineHeight: 1.65, boxSizing: 'border-box',
    boxShadow: '0 2px 8px rgba(30,40,100,0.04), inset 0 1px 0 rgba(255,255,255,0.55)',
    transition: 'all 0.15s',
    minHeight: 180,
  };

  return (
    <div className="g-page" style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 48 }}>
      {/* Back */}
      <Link to="/student/tasks"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--txt-secondary)', textDecoration: 'none', marginBottom: 24, transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color='var(--txt-primary)'}
        onMouseLeave={e => e.currentTarget.style.color='var(--txt-secondary)'}
      >
        <ArrowLeft size={13} /> My Tasks
      </Link>

      {/* Header glass banner */}
      <div className="glass-1" style={{ borderRadius: 'var(--r-xl)', padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--txt-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              {assignment.title}
            </h1>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
              <TypeChip type={assignment.type} />
              {teacher && (
                <span style={{ fontSize: 12.5, color: 'var(--txt-secondary)' }}>
                  from {teacher.firstName} {teacher.lastName}
                </span>
              )}
              {dlStr && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 12, fontWeight: 500,
                  color: overdueA ? 'var(--clr-overdue-txt)' : 'var(--txt-secondary)',
                }}>
                  <Clock size={11} />
                  {overdueA ? 'Overdue — was due ' : 'Due '}{dlStr}
                </span>
              )}
            </div>
          </div>
          <StatusBadge assignment={assignment} />
        </div>
      </div>

      {/* Grade & feedback (done) */}
      {assignment.status === 'DONE' && typeof assignment.grade === 'number' && (
        <div className="glass-2" style={{
          borderRadius: 'var(--r-lg)', padding: '20px 24px', marginBottom: 20,
          background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.28)',
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--clr-done-txt)', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--clr-done-txt)', marginBottom: 4 }}>
                Completed · Grade: {assignment.grade}/100
              </div>
              {assignment.feedback && (
                <p style={{ fontSize: 13.5, color: 'var(--txt-primary)', margin: 0, lineHeight: 1.65 }}>
                  {assignment.feedback}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Revision feedback */}
      {assignment.status === 'NEEDS_REVISION' && assignment.feedback && (
        <div className="glass-2" style={{
          borderRadius: 'var(--r-lg)', padding: '18px 22px', marginBottom: 20,
          background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.30)',
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <AlertCircle size={18} style={{ color: 'var(--clr-revision-txt)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--clr-revision-txt)', marginBottom: 6 }}>
                Revision requested
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--txt-primary)', margin: 0, lineHeight: 1.65 }}>
                {assignment.feedback}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="glass-2" style={{ borderRadius: 'var(--r-lg)', padding: '22px 26px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-secondary)', marginBottom: 12 }}>
          Instructions
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--txt-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>
          {assignment.instructions || 'No instructions provided.'}
        </p>
      </div>

      {/* Materials & Attachments provided by Teacher */}
      {assignment.attachments && assignment.attachments.length > 0 && (
        <div className="glass-2" style={{ borderRadius: 'var(--r-lg)', padding: '22px 26px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-secondary)', marginBottom: 14 }}>
            Reference Materials &amp; Attachments
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {assignment.attachments.map(att => (
              <div
                key={att.id}
                style={{
                  background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.65)',
                  borderRadius: 'var(--r-md)', padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                }}
              >
                {att.type === 'IMAGE' ? (
                  <div style={{ width: '100%', marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ImageIcon size={16} color="var(--accent-text)" />
                      {att.name || 'Task Image'}
                    </div>
                    <img
                      src={att.dataUrl}
                      alt={att.name || 'Task Material'}
                      onClick={() => setZoomImage(att.dataUrl)}
                      style={{
                        maxWidth: '100%', maxHeight: 340, borderRadius: 10,
                        border: '1px solid rgba(0,0,0,0.10)', cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
                      }}
                      title="Click to zoom image"
                    />
                  </div>
                ) : att.type === 'FILE' ? (
                  <>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--accent-text)', flexShrink: 0
                    }}>
                      <FileText size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--txt-primary)' }}>
                        {att.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--txt-secondary)', marginTop: 2 }}>
                        Document {att.size ? `· ${att.size}` : ''}
                      </div>
                    </div>
                    {att.dataUrl && (
                      <a
                        href={att.dataUrl}
                        download={att.name}
                        className="g-btn g-btn-secondary"
                        style={{ padding: '7px 14px', fontSize: 12 }}
                      >
                        <Download size={13} style={{ marginRight: 5 }} /> Download
                      </a>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--accent-text)', flexShrink: 0
                    }}>
                      <LinkIcon size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--txt-primary)' }}>
                        {att.title || att.url}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--txt-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {att.url}
                      </div>
                    </div>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="g-btn g-btn-secondary"
                      style={{ padding: '7px 14px', fontSize: 12 }}
                    >
                      <ExternalLink size={13} style={{ marginRight: 5 }} /> Open Link
                    </a>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Already submitted (read-only) */}
      {submission && !canSubmit && assignment.status !== 'NEEDS_REVISION' && (
        <div className="glass-2" style={{ borderRadius: 'var(--r-lg)', padding: '22px 26px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-secondary)', marginBottom: 12 }}>
            Your submission
          </div>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--txt-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>
            {submission.content}
          </p>
          <div style={{ fontSize: 11.5, color: 'var(--txt-tertiary)', marginTop: 14 }}>
            Submitted {formatDateTime(submission.submittedAt)} · awaiting review
          </div>
        </div>
      )}

      {/* Submission area */}
      {canSubmit && (
        <div className="glass-2" style={{ borderRadius: 'var(--r-lg)', padding: '22px 26px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-secondary)', marginBottom: 14 }}>
            {assignment.status === 'NEEDS_REVISION' ? 'Revised answer' : 'Your submission'}
          </div>
          <textarea
            rows={8}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Type your answer here…"
            style={textareaStyle}
            onFocus={onFocus} onBlur={onBlur}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button onClick={handleSaveDraft} className="g-btn g-btn-ghost" disabled={busy}>Save draft</button>
            <button onClick={handleSubmit} className="g-btn g-btn-primary" disabled={busy}>
              <Send size={13} />
              {assignment.status === 'NEEDS_REVISION' ? 'Resubmit' : 'Submit'}
            </button>
          </div>
        </div>
      )}

      {/* Image Zoom Lightbox */}
      {zoomImage && (
        <div className="g-overlay" onClick={() => setZoomImage(null)} style={{ zIndex: 120 }}>
          <div
            className="glass-4"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 720, width: '90%', padding: 12, borderRadius: 'var(--r-lg)',
              display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}
          >
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
              <button onClick={() => setZoomImage(null)} className="g-btn g-btn-ghost" style={{ padding: '6px 8px' }}>
                <X size={18} />
              </button>
            </div>
            <img src={zoomImage} alt="Task material" style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: 8, objectFit: 'contain' }} />
          </div>
        </div>
      )}
    </div>
  );
}
