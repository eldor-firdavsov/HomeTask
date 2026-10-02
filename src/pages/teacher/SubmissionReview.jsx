import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData, useToast } from '../../context/DataContext';
import { ArrowLeft, Save, RotateCcw, CheckCircle } from 'lucide-react';
import { TypeChip, StatusBadge, formatDateTime, gradeColor } from '../../utils/helpers.jsx';

export default function SubmissionReview() {
  const { submissionId } = useParams();
  const { data, setData } = useData();
  const navigate = useNavigate();
  const toast    = useToast();

  const submission = data.submissions.find(s => s.id === submissionId);
  const assignment = submission ? data.assignments.find(a => a.id === submission.assignedTaskId) : null;
  const student    = assignment  ? data.users.find(u => u.id === assignment.studentId) : null;
  const teacher    = data.users.find(u => u.role === 'TEACHER');

  const [grade,    setGrade]    = useState(typeof assignment?.grade === 'number' ? String(assignment.grade) : '');
  const [feedback, setFeedback] = useState(assignment?.feedback || '');
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

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.40)', backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.60)',
    borderRadius: 'var(--r-sm)', padding: '10px 13px', fontSize: 14,
    color: 'var(--txt-primary)', fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', transition: 'all 0.15s',
    boxShadow: '0 2px 8px rgba(30,40,100,0.04), inset 0 1px 0 rgba(255,255,255,0.55)',
  };
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
    textTransform: 'uppercase', color: 'var(--txt-secondary)', marginBottom: 7,
  };

  if (!submission || !assignment || !student) {
    return (
      <div className="g-page" style={{ textAlign: 'center', padding: 80 }}>
        <p style={{ color: 'var(--txt-secondary)' }}>Submission not found.</p>
        <Link to="/teacher/dashboard" className="g-btn g-btn-primary" style={{ marginTop: 16 }}>Back to dashboard</Link>
      </div>
    );
  }

  const gradeNum   = parseInt(grade, 10);
  const gradeValid = !isNaN(gradeNum) && gradeNum >= 0 && gradeNum <= 100;

  const applyChange = ({ newAssignStatus, newSubStatus, requireGrade }) => {
    if (requireGrade && !gradeValid) {
      toast('Please enter a valid grade between 0 and 100.', 'error');
      return false;
    }
    setBusy(true);

    const updatedSubs = data.submissions.map(s =>
      s.id === submissionId
        ? { ...s, status: newSubStatus, reviewedAt: new Date().toISOString(), reviewedBy: teacher?.id }
        : s
    );
    const updatedAssignments = data.assignments.map(a =>
      a.id === assignment.id
        ? {
            ...a, status: newAssignStatus,
            grade:    requireGrade ? gradeNum : a.grade,
            feedback: feedback || a.feedback,
            updatedAt: new Date().toISOString(),
          }
        : a
    );
    setData({ ...data, submissions: updatedSubs, assignments: updatedAssignments });
    setBusy(false);
    return true;
  };

  const handleSaveDraft = () => {
    if (applyChange({ newAssignStatus: assignment.status, newSubStatus: 'UNDER_REVIEW', requireGrade: false })) {
      toast('Draft saved');
    }
  };

  const handleRevision = () => {
    if (!feedback.trim()) { toast('Please add feedback before requesting revision.', 'error'); return; }
    if (applyChange({ newAssignStatus: 'NEEDS_REVISION', newSubStatus: 'NEEDS_REVISION', requireGrade: false })) {
      toast('Revision requested — student can now resubmit');
      setTimeout(() => navigate('/teacher/dashboard'), 700);
    }
  };

  const handleDone = () => {
    if (!gradeValid) { toast('A valid grade (0–100) is required to mark as done.', 'error'); return; }
    if (applyChange({ newAssignStatus: 'DONE', newSubStatus: 'DONE', requireGrade: true })) {
      toast('Assignment marked as complete');
      setTimeout(() => navigate('/teacher/dashboard'), 700);
    }
  };

  return (
    <div className="g-page" style={{ paddingBottom: 40 }}>
      {/* Back */}
      <Link to="/teacher/dashboard"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--txt-secondary)', textDecoration: 'none', marginBottom: 24, transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--txt-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--txt-secondary)'}
      >
        <ArrowLeft size={13} /> Dashboard
      </Link>

      {/* Page header — glass banner */}
      <div className="glass-1" style={{ borderRadius: 'var(--r-xl)', padding: '22px 28px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--txt-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              {assignment.title}
            </h1>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
              <TypeChip type={assignment.type} />
              <span style={{ fontSize: 13, color: 'var(--txt-secondary)', fontWeight: 500 }}>
                {student.firstName} {student.lastName}
              </span>
              <span style={{ fontSize: 12, color: 'var(--txt-tertiary)' }}>
                · Submitted {formatDateTime(submission.submittedAt)}
              </span>
            </div>
          </div>
          <StatusBadge assignment={{ ...assignment, status: submission.status }} />
        </div>
      </div>

      {/* Two-column review layout */}
      <div className="g-review-grid">
        {/* LEFT — submission */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-secondary)', marginBottom: 12 }}>
            Student submission
          </div>

          {/* Submission content glass panel */}
          <div className="glass-2" style={{ borderRadius: 'var(--r-lg)', padding: '22px 24px', minHeight: 220, marginBottom: 20 }}>
            {submission.content ? (
              <p style={{ fontSize: 14.5, lineHeight: 1.75, color: 'var(--txt-primary)', whiteSpace: 'pre-wrap', margin: 0 }}>
                {submission.content}
              </p>
            ) : (
              <p style={{ color: 'var(--txt-tertiary)', fontSize: 13, fontStyle: 'italic', margin: 0 }}>No text submitted.</p>
            )}
          </div>

          {/* Instructions reference */}
          <div className="glass-2" style={{ borderRadius: 'var(--r-lg)', padding: '18px 22px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-secondary)', marginBottom: 10 }}>
              Task instructions
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--txt-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>
              {assignment.instructions}
            </p>
          </div>
        </div>

        {/* RIGHT — review panel */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-secondary)', marginBottom: 12 }}>
            Review panel
          </div>

          <div className="glass-4" style={{ borderRadius: 'var(--r-xl)', padding: '24px 22px', position: 'sticky', top: 0 }}>
            {/* Grade input */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Grade  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--txt-tertiary)', fontSize: 10 }}>(0–100)</span></label>
              <input
                type="number" min="0" max="100" step="1"
                placeholder="e.g. 87"
                value={grade}
                onChange={e => setGrade(e.target.value)}
                style={{ ...inputStyle, fontSize: 22, fontWeight: 700, padding: '12px 16px',
                  color: gradeValid ? gradeColor(gradeNum) : 'var(--txt-primary)' }}
                onFocus={onFocus} onBlur={onBlur}
              />
              {grade !== '' && !gradeValid && (
                <div style={{ fontSize: 11.5, color: 'var(--clr-overdue-txt)', marginTop: 5 }}>Grade must be 0–100.</div>
              )}
            </div>

            {/* Feedback */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Feedback</label>
              <textarea
                rows={6}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Write your feedback here…"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.50)', marginBottom: 16 }} />

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <button onClick={handleSaveDraft} className="g-btn g-btn-secondary" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
                <Save size={14} /> Save draft
              </button>
              <button onClick={handleRevision} className="g-btn g-btn-warning" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
                <RotateCcw size={14} /> Request revision
              </button>
              <button
                onClick={handleDone}
                className="g-btn g-btn-primary"
                disabled={busy || !gradeValid}
                style={{ width: '100%', justifyContent: 'center', opacity: gradeValid ? 1 : 0.45 }}
              >
                <CheckCircle size={14} /> Mark as done
              </button>
            </div>

            {!gradeValid && (
              <p style={{ fontSize: 11, color: 'var(--txt-tertiary)', textAlign: 'center', marginTop: 12, marginBottom: 0 }}>
                A valid grade is required to mark as done.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
