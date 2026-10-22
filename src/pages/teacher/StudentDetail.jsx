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
import StudentCredentialsModal from '../../components/teacher/StudentCredentialsModal';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import ActionMenu from '../../components/common/ActionMenu';
import { deactivateStudent } from '../../lib/supabase/students.js';
import { deleteAssignment } from '../../lib/supabase/assignments.js';
import { getStudentPassword, formatStudentInvite } from '../../utils/credentialsVault';
import {
  getStudentReadingAssignments,
  getTeacherReadingSubmissions,
  getReadingTests,
  deleteReadingAssignment
} from '../../lib/supabase/readingTests.js';
import { getBandColor, getBandLabel } from '../../lib/supabase/aiGrading.js';
import { BookOpen, Award, Sparkles } from 'lucide-react';

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
  const [showCredentials, setShowCredentials] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  // IELTS Reading Tests for this student
  const [readingAssignments, setReadingAssignments] = useState([]);
  const [readingSubmissions, setReadingSubmissions] = useState([]);
  const [readingTestsMap, setReadingTestsMap] = useState({});

  React.useEffect(() => {
    async function loadStudentReading() {
      try {
        const [rAssigns, rSubs, rTests] = await Promise.all([
          getStudentReadingAssignments(studentId),
          getTeacherReadingSubmissions(),
          getReadingTests(),
        ]);
        setReadingAssignments(rAssigns || []);
        setReadingSubmissions((rSubs || []).filter(s => s.studentId === studentId));
        const tMap = {};
        (rTests || []).forEach(t => { tMap[t.id] = t; });
        setReadingTestsMap(tMap);
      } catch (err) {
        console.warn('Could not load student reading data:', err);
      }
    }
    loadStudentReading();
  }, [studentId]);

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

  const handleDeleteAssignment = async (assignmentOrId, taskTitle) => {
    const assignmentId = typeof assignmentOrId === 'object' ? assignmentOrId.id : assignmentOrId;
    const isReading = typeof assignmentOrId === 'object' ? !!assignmentOrId.isReadingTest : false;
    const title = taskTitle || (typeof assignmentOrId === 'object' ? assignmentOrId.title : 'this task');

    if (!confirm(`Delete this assigned task "${title}" for ${student?.firstName || 'this student'}? This cannot be undone.`)) return;
    try {
      if (isReading) {
        await deleteReadingAssignment(assignmentId);
      } else {
        await deleteAssignment(assignmentId);
      }
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
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/teacher/dashboard' },
          { label: 'Students', to: '/teacher/dashboard' },
          { label: `${student.firstName} ${student.lastName}`, current: true },
        ]}
      />

      {/* Hero header panel */}
      <div className="glass-1" style={{ borderRadius: 'var(--radius-xl, 18px)', padding: '26px 30px', marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 18 }}>
          {/* Student Info */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, flexShrink: 0,
              background: 'var(--color-primary-soft, #E6EEE8)',
              border: '1px solid var(--color-border, #DDE3DC)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: 'var(--color-primary, #244A3A)',
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
              padding: '8px 16px', borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              textAlign: 'center', minWidth: 84
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)', marginBottom: 2 }}>
                Avg. Grade
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: avg != null ? gradeColor(avg) : 'var(--color-text-muted)', lineHeight: 1.1 }}>
                {avg != null ? `${avg}%` : '—'}
              </div>
            </div>

            {/* Primary Action: Assign Task */}
            <button
              type="button"
              onClick={() => setShowAssign(true)}
              className="g-btn g-btn-primary"
              style={{ padding: '8px 16px', fontSize: 13, gap: 6 }}
            >
              <Plus size={14} /> Assign Task
            </button>

            {/* Contextual Student Actions */}
            <ActionMenu
              align="right"
              ariaLabel="Student profile options"
              items={[
                {
                  label: 'View Login Credentials',
                  icon: KeyRound,
                  onClick: () => setShowCredentials(true),
                },
                {
                  label: 'Copy Login Invite',
                  icon: Copy,
                  onClick: handleCopyInvite,
                },
                {
                  label: 'Change Password',
                  icon: RefreshCw,
                  onClick: () => setShowEditPassword(true),
                },
                {
                  label: 'Remove from Roster',
                  icon: Trash2,
                  danger: true,
                  onClick: handleDeactivate,
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* ── IELTS Reading Exams & Band Scores Section ── */}
      <div
        className="g-card"
        style={{
          padding: '22px 24px',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', boxShadow: '0 2px 6px rgba(36,74,58,0.25)'
            }}>
              <Award size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                IELTS Reading Exams & Band Scores
              </h3>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                Exam performance, automated AI grading, and band evaluations for this student
              </div>
            </div>
          </div>

          <Link
            to="/teacher/reading-tests"
            className="g-btn g-btn-secondary"
            style={{ fontSize: 12, padding: '6px 12px', gap: 5, textDecoration: 'none' }}
          >
            <BookOpen size={13} /> Manage Reading Tests
          </Link>
        </div>

        {readingAssignments.length === 0 ? (
          <div style={{
            padding: '20px 16px', borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface-subtle)', border: '1px dashed var(--color-border)',
            textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13
          }}>
            No IELTS reading exams assigned to this student yet. Assign a test from the IELTS Reading Tests library.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {readingAssignments.map(assign => {
              const test = readingTestsMap[assign.readingTestId];
              const sub = readingSubmissions.find(s => s.assignmentId === assign.id);
              const isGraded = assign.status === 'graded' || Boolean(sub);
              const band = sub?.bandScore != null ? Number(sub.bandScore) : null;
              const bandColor = band ? getBandColor(band) : 'var(--color-primary)';
              const bandLabel = band ? getBandLabel(band) : '';

              return (
                <div
                  key={assign.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    flexWrap: 'wrap', gap: 10
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                      background: isGraded ? 'var(--color-success-soft)' : 'var(--color-primary-soft)',
                      color: isGraded ? 'var(--color-success)' : 'var(--color-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt-primary)' }}>
                        {test?.title || 'IELTS Reading Test'}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--txt-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>Assigned {new Date(assign.assignedAt).toLocaleDateString()}</span>
                        {assign.deadline && (
                          <span>· Due {new Date(assign.deadline).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {isGraded && band != null ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 999,
                            background: `${bandColor}18`, color: bandColor,
                            fontWeight: 700, fontSize: 12
                          }}>
                            Band {band.toFixed(1)} · {bandLabel}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--txt-secondary)', marginTop: 2 }}>
                            {sub.correctCount != null ? `${sub.correctCount}/${sub.totalQuestions || 40} correct (${sub.percentage}%)` : ''}
                          </div>
                        </div>
                        {sub?.id && (
                          <Link
                            to={`/teacher/reading-submissions/${sub.id}`}
                            className="g-btn g-btn-secondary"
                            style={{ fontSize: 12, padding: '6px 12px', textDecoration: 'none' }}
                          >
                            Review AI Feedback →
                          </Link>
                        )}
                      </div>
                    ) : (
                      <span style={{
                        fontSize: 12, padding: '4px 10px', borderRadius: 999,
                        background: 'rgba(245,158,11,0.1)', color: '#d97706', fontWeight: 600
                      }}>
                        Pending Completion
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
                    onClick={() => handleDeleteAssignment(a, a.title)}
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

      {/* View Login Credentials Modal */}
      {showCredentials && (
        <StudentCredentialsModal
          student={student}
          onClose={() => setShowCredentials(false)}
          onChangePassword={() => setShowEditPassword(true)}
        />
      )}

      {/* Edit Password Modal */}
      {showEditPassword && (
        <EditPasswordModal
          student={student}
          onClose={() => setShowEditPassword(false)}
          onUpdated={() => {
            if (refreshData) refreshData();
          }}
        />
      )}
    </div>
  );
}
