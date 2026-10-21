import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData, useToast } from '../../context/DataContext';
import {
  ArrowLeft, Plus, ClipboardList, Trash2, KeyRound, Eye, EyeOff,
  Copy, Check, RefreshCw, Send, Calendar, Clock, CheckCircle2,
  AlertCircle, ChevronRight, User, Mail
} from 'lucide-react';
import {
  calcAverageGrade, gradeColor, StatusBadge, TypeChip,
  formatDateTime, isOverdue,
} from '../../utils/helpers.jsx';
import AssignStudentsModal from '../../components/tasks/AssignStudentsModal';
import EditPasswordModal from '../../components/teacher/EditPasswordModal';
import { deactivateStudent } from '../../lib/supabase/students.js';
import { deleteAssignment } from '../../lib/supabase/assignments.js';
import { getStudentPassword, formatStudentInvite } from '../../utils/credentialsVault';

const TABS = ['All', 'In Progress', 'Submitted', 'Review', 'Done', 'Overdue'];
const STATUS_MAP = {
  'In Progress': 'IN_PROGRESS',
  'Submitted': 'SUBMITTED',
  'Review': 'REVIEW',
  'Done': 'DONE',
};

export default function StudentDetail() {
  const { studentId } = useParams();
  const { data, setData, refreshData } = useData();
  const navigate = useNavigate();
  const toast = useToast();

  const [tab, setTab] = useState('All');
  const [showAssign, setShowAssign] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPw, setCopiedPw] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const student = (data?.users || []).find(u => u.id === studentId);
  const assignments = useMemo(() => {
    return (data?.assignments || []).filter(a => a.studentId === studentId);
  }, [data?.assignments, studentId]);

  const password = student ? getStudentPassword(student) : '';

  const filtered = useMemo(() => {
    if (tab === 'All') return assignments;
    if (tab === 'Overdue') return assignments.filter(a => isOverdue(a));
    if (tab === 'In Progress') return assignments.filter(a => ['IN_PROGRESS', 'PENDING'].includes(a.status));
    if (tab === 'Review') return assignments.filter(a => ['REVIEW', 'UNDER_REVIEW', 'NEEDS_REVISION'].includes(a.status));
    return assignments.filter(a => a.status === STATUS_MAP[tab]);
  }, [assignments, tab]);

  const avg = calcAverageGrade(studentId, data?.assignments || []);

  const getSubmission = (assignmentId) =>
    (data?.submissions || []).find(s => s.assignedTaskId === assignmentId);

  const handleCopyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopiedPw(true);
    toast('Password copied to clipboard!');
    setTimeout(() => setCopiedPw(false), 2000);
  };

  const handleCopyInvite = () => {
    if (!student) return;
    const invite = formatStudentInvite(student, password);
    navigator.clipboard.writeText(invite);
    setCopiedInvite(true);
    toast('Student login invite copied to clipboard!');
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const handleDeleteAssignment = async (assignmentId, taskTitle) => {
    if (!confirm(`Delete this assigned task "${taskTitle}" for ${student?.firstName || 'this student'}? This cannot be undone.`)) return;
    try {
      await deleteAssignment(assignmentId);
      setData(prev => ({
        ...prev,
        assignments: prev.assignments.filter(a => a.id !== assignmentId),
      }));
      toast('Assigned task deleted');
      if (refreshData) await refreshData();
    } catch (err) {
      console.error('Delete assignment error:', err);
      toast(err.message || 'Failed to delete assigned task', 'error');
    }
  };

  const handleDeactivate = async () => {
    if (!student) return;
    if (!confirm(`Are you sure you want to deactivate ${student.firstName} ${student.lastName}? They will be removed from your active student roster.`)) return;
    setDeactivating(true);
    try {
      await deactivateStudent(studentId);
      toast('Student removed from active roster');
      if (refreshData) await refreshData();
      navigate('/teacher/dashboard');
    } catch (err) {
      console.error('Failed to deactivate student:', err);
      toast(err.message || 'Failed to deactivate student', 'error');
    } finally {
      setDeactivating(false);
    }
  };

  if (!student) {
    return (
      <div className="g-page" style={{ textAlign: 'center', padding: 80 }}>
        <p style={{ color: 'var(--txt-secondary)' }}>Student not found.</p>
        <Link to="/teacher/dashboard" className="g-btn g-btn-primary" style={{ marginTop: 16 }}>Back to dashboard</Link>
      </div>
    );
  }

  const inProgressCount = assignments.filter(a => ['IN_PROGRESS', 'PENDING'].includes(a.status)).length;
  const reviewCount = assignments.filter(a => ['REVIEW', 'UNDER_REVIEW', 'NEEDS_REVISION', 'SUBMITTED'].includes(a.status)).length;
  const doneCount = assignments.filter(a => a.status === 'DONE').length;
  const overdueCount = assignments.filter(a => isOverdue(a)).length;

  return (
    <div className="g-page">
      {/* Back button */}
      <Link
        to="/teacher/dashboard"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13,
          color: 'var(--txt-secondary)', textDecoration: 'none', marginBottom: 20,
          transition: 'color 0.15s', fontWeight: 500
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--txt-secondary)'}
      >
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      {/* Hero header panel */}
      <div className="glass-1" style={{ borderRadius: 'var(--r-xl)', padding: '26px 30px', marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 18 }}>
          {/* Student Info */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{
              width: 58, height: 58, borderRadius: 16, flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(168,85,247,0.22) 100%)',
              border: '1px solid rgba(99,102,241,0.30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: 'var(--accent-text)',
            }}>
              {student.firstName?.[0]}{student.lastName?.[0]}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--txt-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                  {student.firstName} {student.lastName}
                </h1>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                  background: 'rgba(52,211,153,0.14)', color: 'var(--clr-done-txt)',
                  border: '1px solid rgba(52,211,153,0.28)'
                }}>
                  Active Student
                </span>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--txt-secondary)', margin: '4px 0 0' }}>{student.email}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Avg Grade */}
            <div style={{
              padding: '8px 18px', borderRadius: 'var(--r-md)',
              background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.65)',
              textAlign: 'center', minWidth: 90
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-secondary)', marginBottom: 2 }}>
                Avg. Grade
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: avg != null ? gradeColor(avg) : 'var(--txt-tertiary)', lineHeight: 1.1 }}>
                {avg != null ? `${avg}%` : '—'}
              </div>
            </div>

            {/* Easy Assign Button */}
            <button
              onClick={() => setShowAssign(true)}
              className="g-btn g-btn-primary"
              style={{ padding: '9px 16px', fontSize: 13, gap: 6 }}
            >
              <Plus size={15} /> Assign new task
            </button>

            {/* Delete/Deactivate */}
            <button
              onClick={handleDeactivate}
              className="g-btn g-btn-ghost"
              style={{ color: 'var(--clr-overdue-txt)', border: '1px solid rgba(239,68,68,0.22)', padding: '9px 12px' }}
              disabled={deactivating}
              title="Remove student from roster"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Student Credentials Card (Always Visible & Manageable) ── */}
      <div
        className="glass-2"
        style={{
          borderRadius: 'var(--r-lg)',
          padding: '20px 24px',
          marginBottom: 24,
          border: '1px solid rgba(99, 102, 241, 0.25)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.52) 0%, rgba(243,244,255,0.52) 100%)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(99,102,241,0.14)', border: '1px solid rgba(99,102,241,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent-text)'
            }}>
              <KeyRound size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt-primary)', margin: 0 }}>
                Student Login Credentials
              </h3>
              <div style={{ fontSize: 11.5, color: 'var(--txt-secondary)' }}>
                View, share, or reset credentials so this student can sign in to their homework portal
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={handleCopyInvite}
              className="g-btn g-btn-secondary"
              style={{ fontSize: 12, padding: '6px 12px', gap: 5 }}
            >
              {copiedInvite ? <Check size={13} /> : <Copy size={13} />}
              {copiedInvite ? 'Copied invite!' : 'Copy invite text'}
            </button>
            <button
              type="button"
              onClick={() => setShowEditPassword(true)}
              className="g-btn g-btn-ghost"
              style={{ fontSize: 12, padding: '6px 12px', gap: 5 }}
            >
              <RefreshCw size={13} /> Change password
            </button>
          </div>
        </div>

        {/* Credentials Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {/* Email Block */}
          <div style={{
            background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.65)',
            borderRadius: 'var(--r-sm)', padding: '12px 14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--txt-secondary)', letterSpacing: '0.04em' }}>
                Student Login Email
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt-primary)', marginTop: 2 }}>
                {student.email}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(student.email);
                toast('Email copied!');
              }}
              className="g-btn g-btn-ghost"
              style={{ padding: '5px 7px', color: 'var(--txt-secondary)' }}
              title="Copy email"
            >
              <Copy size={13} />
            </button>
          </div>

          {/* Password Block */}
          <div style={{
            background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(99,102,241,0.22)',
            borderRadius: 'var(--r-sm)', padding: '12px 14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--txt-secondary)', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
                <KeyRound size={11} style={{ color: 'var(--accent-text)' }} /> Student Password
              </div>
              <div style={{
                fontSize: 15, fontWeight: 700, fontFamily: 'monospace', color: 'var(--txt-primary)',
                letterSpacing: showPassword ? '0.03em' : '0.18em', marginTop: 2
              }}>
                {showPassword ? password : '••••••••'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="g-btn g-btn-ghost"
                style={{ padding: '5px 7px', color: 'var(--txt-secondary)' }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                type="button"
                onClick={handleCopyPassword}
                className="g-btn g-btn-ghost"
                style={{ padding: '5px 7px', color: copiedPw ? 'var(--clr-done-txt)' : 'var(--accent-text)' }}
                title="Copy password"
              >
                {copiedPw ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Task Summary Badges */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 20
      }}>
        {[
          { label: 'Total Tasks', value: assignments.length, color: 'var(--txt-primary)' },
          { label: 'In Progress', value: inProgressCount, color: 'var(--clr-progress-txt)' },
          { label: 'In Review', value: reviewCount, color: 'var(--clr-submitted-txt)' },
          { label: 'Completed', value: doneCount, color: 'var(--clr-done-txt)' },
          { label: 'Overdue', value: overdueCount, color: 'var(--clr-overdue-txt)' },
        ].map(st => (
          <div key={st.label} className="glass-card" style={{ padding: '12px 14px', cursor: 'default' }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase' }}>
              {st.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: st.color, marginTop: 4 }}>
              {st.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.45)', marginBottom: 20,
        overflowX: 'auto', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none'
      }}>
        {TABS.map(t => (
          <button key={t} className={`g-tab-underline${tab === t ? ' active' : ''}`} onClick={() => setTab(t)} style={{ fontSize: 12.5 }}>
            {t}
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="glass-section" style={{ borderRadius: 'var(--r-xl)' }}>
          <div className="g-empty">
            <div className="g-empty-icon"><ClipboardList size={20} strokeWidth={1.8} /></div>
            <h3>No tasks found</h3>
            <p>No tasks match the selected filter.</p>
            <button onClick={() => setShowAssign(true)} className="g-btn g-btn-primary" style={{ marginTop: 8 }}>
              + Assign a task
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-section" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
          {filtered.map((a, i) => {
            const sub = getSubmission(a.id);
            const canReview = sub && ['SUBMITTED', 'UNDER_REVIEW', 'DONE', 'NEEDS_REVISION'].includes(a.status);
            const overdueA = isOverdue(a);

            return (
              <div
                key={a.id}
                className="glass-row"
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '16px 22px',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.40)' : 'none',
                  borderLeft: `3px solid ${overdueA ? 'rgba(248,113,113,0.70)' : 'transparent'}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--txt-primary)', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                      {a.title}
                    </span>
                    <TypeChip type={a.type} />
                  </div>
                  <div style={{ fontSize: 12, color: overdueA ? 'var(--clr-overdue-txt)' : 'var(--txt-secondary)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span>
                      {a.deadline
                        ? (overdueA ? '⚠️ Overdue · Due ' : 'Due ') + new Date(a.deadline).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) + ', ' + new Date(a.deadline).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })
                        : 'No deadline'
                      }
                    </span>
                    {typeof a.grade === 'number' && (
                      <span style={{ fontWeight: 700, color: gradeColor(a.grade) }}>
                        · Grade: {a.grade}/100
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <StatusBadge assignment={a} />
                  {canReview && (
                    <Link to={`/teacher/submissions/${sub.id}`} className="g-btn g-btn-primary" style={{ fontSize: 12, padding: '6px 13px' }}>
                      {a.status === 'DONE' ? 'View Review' : 'Review'}
                    </Link>
                  )}
                  <button
                    onClick={() => handleDeleteAssignment(a.id, a.title)}
                    className="g-btn g-btn-ghost"
                    style={{ color: 'var(--clr-overdue-txt)', padding: '6px 8px' }}
                    title="Delete assigned task"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upgraded Universal Assign Modal */}
      {showAssign && (
        <AssignStudentsModal
          preselectedStudentId={studentId}
          onClose={() => setShowAssign(false)}
        />
      )}

      {/* Edit Password Modal */}
      {showEditPassword && (
        <EditPasswordModal
          student={student}
          onClose={() => setShowEditPassword(false)}
          onUpdated={() => {}}
        />
      )}
    </div>
  );
}
