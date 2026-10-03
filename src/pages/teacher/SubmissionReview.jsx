import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData, useToast } from '../../context/DataContext';
import { ArrowLeft, Save, RotateCcw, CheckCircle, FileText, Download } from 'lucide-react';
import { TypeChip, StatusBadge, formatDateTime, gradeColor } from '../../utils/helpers.jsx';
import { gradeSubmission, requestRevision, getSubmissionAttachments } from '../../lib/supabase/submissions.js';
import { updateAssignment } from '../../lib/supabase/assignments.js';
import { getSignedUrl, formatFileSize } from '../../lib/supabase/storage.js';

export default function SubmissionReview() {
  const { submissionId } = useParams();
  const { data, setData, session, profile, refreshData } = useData();
  const navigate = useNavigate();
  const toast    = useToast();

  const submission = (data?.submissions || []).find(s => s.id === submissionId);
  const assignment = submission ? (data?.assignments || []).find(a => a.id === submission.assignedTaskId) : null;
  const student    = assignment  ? (data?.users || []).find(u => u.id === assignment.studentId) : null;

  const [grade,    setGrade]    = useState(typeof assignment?.grade === 'number' ? String(assignment.grade) : '');
  const [feedback, setFeedback] = useState(assignment?.feedback || '');
  const [submissionAttachments, setSubmissionAttachments] = useState([]);
  const [busy,     setBusy]     = useState(false);

  useEffect(() => {
    if (submission?.id) {
      getSubmissionAttachments(submission.id)
        .then(async (atts) => {
          const withUrls = await Promise.all(atts.map(async (att) => {
            try {
              const url = await getSignedUrl('submission-files', att.storage_path);
              return { ...att, downloadUrl: url };
            } catch (err) {
              return att;
            }
          }));
          setSubmissionAttachments(withUrls);
        })
        .catch(console.error);
    }
  }, [submission?.id]);

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

  const handleSaveDraft = async () => {
    setBusy(true);
    try {
      await updateAssignment(assignment.id, {
        feedback: feedback.trim(),
        grade: gradeValid ? gradeNum : undefined,
      });
      toast('Draft feedback saved');
      if (refreshData) await refreshData();
    } catch (err) {
      console.error('Save draft error:', err);
      toast(err.message || 'Failed to save draft', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRevision = async () => {
    if (!feedback.trim()) {
      toast('Please add feedback before requesting revision.', 'error');
      return;
    }
    setBusy(true);
    try {
      const teacherId = session?.user?.id || profile?.id;
      await requestRevision({
        assignmentId: assignment.id,
        submissionId: submission.id,
        feedback: feedback.trim(),
        teacherId,
      });
      toast('Changes requested — student can now turn it in again');
      if (refreshData) await refreshData();
      navigate('/teacher/dashboard');
    } catch (err) {
      console.error('Request revision error:', err);
      toast(err.message || 'Failed to request changes', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDone = async () => {
    if (!gradeValid) {
      toast('A valid grade (0–100) is required to complete.', 'error');
      return;
    }
    setBusy(true);
    try {
      const teacherId = session?.user?.id || profile?.id;
      await gradeSubmission({
        assignmentId: assignment.id,
        submissionId: submission.id,
        grade: gradeNum,
        feedback: feedback.trim(),
        teacherId,
      });
      toast('Homework graded and marked as completed!');
      if (refreshData) await refreshData();
      navigate('/teacher/dashboard');
    } catch (err) {
      console.error('Grade error:', err);
      toast(err.message || 'Failed to grade submission', 'error');
    } finally {
      setBusy(false);
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
        <ArrowLeft size={13} /> Back to dashboard
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
                · Turned in {formatDateTime(submission.submittedAt)}
              </span>
            </div>
          </div>
          <StatusBadge assignment={assignment} />
        </div>
      </div>

      {/* Two-column review layout */}
      <div className="g-review-grid">
        {/* LEFT — submission */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-secondary)', marginBottom: 12 }}>
            Student's Work
          </div>

          {/* Submission content glass panel */}
          <div className="glass-2" style={{ borderRadius: 'var(--r-lg)', padding: '22px 24px', minHeight: 180, marginBottom: 20, minWidth: 0, overflow: 'hidden' }}>
            {submission.content ? (
              <p style={{ fontSize: 14.5, lineHeight: 1.75, color: 'var(--txt-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere', margin: 0 }}>
                {submission.content}
              </p>
            ) : (
              <p style={{ color: 'var(--txt-tertiary)', fontSize: 13, fontStyle: 'italic', margin: 0 }}>No text submitted.</p>
            )}

            {/* Student Attached Files */}
            {submissionAttachments.length > 0 && (
              <div style={{ marginTop: 18, borderTop: '1px solid rgba(255,255,255,0.40)', paddingTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', marginBottom: 10 }}>
                  Submitted Files
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {submissionAttachments.map(att => (
                    <div key={att.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', background: 'rgba(255,255,255,0.45)', borderRadius: 'var(--r-sm)',
                      border: '1px solid rgba(255,255,255,0.60)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <FileText size={16} color="var(--accent-text)" />
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {att.file_name}
                        </span>
                        {att.file_size && (
                          <span style={{ fontSize: 11, color: 'var(--txt-tertiary)' }}>({formatFileSize(att.file_size)})</span>
                        )}
                      </div>
                      {att.downloadUrl && (
                        <a href={att.downloadUrl} target="_blank" rel="noopener noreferrer" download={att.file_name} className="g-btn g-btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}>
                          <Download size={11} style={{ marginRight: 4 }} /> Download
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Instructions reference */}
          <div className="glass-2" style={{ borderRadius: 'var(--r-lg)', padding: '18px 22px', minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-secondary)', marginBottom: 10 }}>
              Homework instructions
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--txt-secondary)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              {assignment.instructions}
            </p>
          </div>
        </div>

        {/* RIGHT — review panel */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-secondary)', marginBottom: 12 }}>
            Grade &amp; Feedback
          </div>

          <div className="glass-4" style={{ borderRadius: 'var(--r-xl)', padding: '24px 22px', position: 'sticky', top: 0 }}>
            {/* Grade input */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Grade  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--txt-tertiary)', fontSize: 10 }}>(0–100)</span></label>
              <input
                type="number" min="0" max="100" step="1"
                placeholder="e.g. 85"
                value={grade}
                onChange={e => setGrade(e.target.value)}
                style={{ ...inputStyle, fontSize: 22, fontWeight: 700, padding: '12px 16px',
                  color: gradeValid ? gradeColor(gradeNum) : 'var(--txt-primary)' }}
                onFocus={onFocus} onBlur={onBlur}
              />
              {grade !== '' && !gradeValid && (
                <div style={{ fontSize: 11.5, color: 'var(--clr-overdue-txt)', marginTop: 5 }}>Grade must be between 0 and 100.</div>
              )}
            </div>

            {/* Feedback */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Teacher Feedback</label>
              <textarea
                rows={6}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Write helpful feedback for your student…"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.50)', marginBottom: 16 }} />

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <button onClick={handleSaveDraft} className="g-btn g-btn-secondary" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
                <Save size={14} /> Save draft feedback
              </button>
              <button onClick={handleRevision} className="g-btn g-btn-warning" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
                <RotateCcw size={14} /> Ask student for changes
              </button>
              <button
                onClick={handleDone}
                className="g-btn g-btn-primary"
                disabled={busy || !gradeValid}
                style={{ width: '100%', justifyContent: 'center', opacity: gradeValid ? 1 : 0.45 }}
              >
                <CheckCircle size={14} /> Give grade &amp; mark completed
              </button>
            </div>

            {!gradeValid && (
              <p style={{ fontSize: 11, color: 'var(--txt-tertiary)', textAlign: 'center', marginTop: 12, marginBottom: 0 }}>
                Enter a grade (0–100) to complete this homework.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
