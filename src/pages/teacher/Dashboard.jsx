import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData, useToast } from '../../context/DataContext';
import {
  Search, UserPlus, ChevronRight, ClipboardList, BookOpen, Plus,
  UserCheck, Copy, Check, RefreshCw, X, Eye, EyeOff, KeyRound,
  Download, LayoutGrid, Table as TableIcon, Send, Users, Sparkles, Share2
} from 'lucide-react';
import {
  calcAverageGrade, gradeColor, studentTaskCounts,
  StatusBadge, formatDateTime, formatDate, TypeChip,
} from '../../utils/helpers.jsx';
import ActionMenu from '../../components/common/ActionMenu';
import AssignStudentsModal from '../../components/tasks/AssignStudentsModal';
import EditPasswordModal from '../../components/teacher/EditPasswordModal';
import StudentCredentialsModal from '../../components/teacher/StudentCredentialsModal';
import { createStudent } from '../../lib/supabase/students.js';
import {
  getStudentPassword, saveStudentPassword, formatStudentInvite,
  formatAllStudentsRoster, downloadCredentialsCsv
} from '../../utils/credentialsVault';

/* ── Shared inline styles ──────────────────── */
const labelStyle = {
  display: 'block', fontSize: 11.5, fontWeight: 600,
  letterSpacing: '0.04em', textTransform: 'uppercase',
  color: 'var(--color-text-secondary)', marginBottom: 6,
};
const inputStyle = {
  width: '100%', background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: 13.5,
  color: 'var(--color-text)', fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
};

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  let pw = '';
  for (let i = 0; i < 8; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pw;
};

/* ── Add Student Modal ──────────────────────── */
function AddStudentModal({ onClose }) {
  const { refreshData } = useData();
  const toast = useToast();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: generatePassword(),
  });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdStudent, setCreatedStudent] = useState(null);
  const [copied, setCopied] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFocus = e => {
    e.target.style.borderColor = 'var(--color-primary)';
    e.target.style.boxShadow = '0 0 0 3px var(--color-primary-soft)';
    e.target.style.background = 'var(--color-surface)';
  };
  const handleBlur = e => {
    e.target.style.borderColor = 'var(--color-border)';
    e.target.style.boxShadow = 'none';
    e.target.style.background = 'var(--color-surface)';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password.trim()) {
      return setErr('All fields are required.');
    }
    if (!/^[^\s@]+@[^\s@]+$/.test(form.email)) {
      return setErr('Enter a valid email address.');
    }
    if (form.password.length < 6) {
      return setErr('Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      const studentResult = await createStudent({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password.trim(),
      });

      const studentObj = {
        id: studentResult?.id,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
      };

      // Persist to credentials vault so teacher can always see and copy it
      saveStudentPassword(studentObj, form.password.trim());

      setCreatedStudent({
        ...studentObj,
        password: form.password.trim(),
      });

      toast('Student created and password saved!');
      if (refreshData) await refreshData();
    } catch (err) {
      console.error('Error creating student:', err);
      setErr(err.message || 'Failed to create student account.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdStudent) return;
    const text = formatStudentInvite(createdStudent, createdStudent.password);
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast('Credentials copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="g-overlay" onClick={onClose} style={{ zIndex: 120 }}>
      <div className="glass-4 g-modal" onClick={e => e.stopPropagation()} style={{ padding: '32px 30px', maxWidth: 460 }}>
        {!createdStudent ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt-primary)', margin: 0 }}>
                Add New Student
              </h2>
              <button onClick={onClose} className="g-btn g-btn-ghost" style={{ padding: '6px 8px' }}>
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                {['firstName', 'lastName'].map(k => (
                  <div key={k} style={{ flex: 1 }}>
                    <label style={labelStyle}>{k === 'firstName' ? 'First name' : 'Last name'}</label>
                    <input
                      style={inputStyle} value={form[k]}
                      onChange={e => set(k, e.target.value)}
                      placeholder={k === 'firstName' ? 'Ahmadjon' : 'Karimov'}
                      onFocus={handleFocus} onBlur={handleBlur}
                      disabled={loading}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Email address</label>
                <input
                  style={inputStyle}
                  type="text"
                  inputMode="email"
                  autoCapitalize="none"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="student@example.com"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  disabled={loading}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...labelStyle, margin: 0 }}>Student Password</label>
                  <button
                    type="button"
                    onClick={() => set('password', generatePassword())}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 11, color: 'var(--accent-text)', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 4, padding: 0
                    }}
                  >
                    <RefreshCw size={11} /> Generate random
                  </button>
                </div>
                <input
                  style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: 600, fontSize: 14 }}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Password"
                  onFocus={handleFocus} onBlur={handleBlur}
                  disabled={loading}
                />
                <div style={{ fontSize: 11, color: 'var(--txt-secondary)', marginTop: 4 }}>
                  You will be able to see, copy, or reset this password at any time.
                </div>
              </div>
              {err && (
                <div style={{
                  padding: '10px 14px', background: 'var(--clr-overdue)', border: '1px solid var(--clr-overdue-bd)',
                  borderRadius: 'var(--r-sm)', fontSize: 12, color: 'var(--clr-overdue-txt)', marginBottom: 16,
                }}>{err}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
                <button type="button" onClick={onClose} className="g-btn g-btn-ghost" disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="g-btn g-btn-primary" disabled={loading}>
                  {loading ? 'Creating student…' : 'Add student'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 22,
                background: 'rgba(52,211,153,0.18)', border: '1px solid rgba(52,211,153,0.3)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--clr-done-txt)', marginBottom: 12
              }}>
                <Check size={22} strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt-primary)', margin: '0 0 6px' }}>
                Student Created!
              </h2>
              <p style={{ fontSize: 13, color: 'var(--txt-secondary)', margin: 0 }}>
                Credentials saved. You can always view or change this password.
              </p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.65)',
              borderRadius: 'var(--r-sm)', padding: '14px 16px', marginBottom: 20
            }}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase' }}>Student Email</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt-primary)', marginTop: 2 }}>{createdStudent.email}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase' }}>Student Password</div>
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-text)', marginTop: 2 }}>{createdStudent.password}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="g-btn g-btn-primary"
                style={{ width: '100%', justifyContent: 'center', gap: 8 }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied to clipboard!' : 'Copy invite credentials'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="g-btn g-btn-ghost"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Student Card (Grid View) ────────────────── */
function StudentCard({ student, assignments, onAssign, onEditPassword, onViewCredentials }) {
  const navigate = useNavigate();
  const avg = calcAverageGrade(student.id, assignments);
  const counts = studentTaskCounts(student.id, assignments);
  const initials = `${student.firstName?.[0] ?? ''}${student.lastName?.[0] ?? ''}`.toUpperCase();
  const toast = useToast();

  const password = getStudentPassword(student);

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password);
    toast(`Password copied for ${student.firstName}`);
  };

  const handleCopyInvite = () => {
    const invite = formatStudentInvite(student, password);
    navigator.clipboard.writeText(invite);
    toast(`Credentials invite copied for ${student.firstName}`);
  };

  return (
    <div
      className="glass-card"
      style={{
        padding: '20px 20px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
    >
      <div>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 'var(--radius-md)', flexShrink: 0,
              background: 'var(--color-primary-soft)',
              border: '1px solid rgba(24, 106, 68, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: 'var(--color-primary)',
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <Link
                to={`/teacher/students/${student.id}`}
                style={{
                  fontSize: 15, fontWeight: 600, color: 'var(--color-text)',
                  textDecoration: 'none', display: 'block',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.target.style.color = 'var(--color-primary)'}
                onMouseLeave={e => e.target.style.color = 'var(--color-text)'}
              >
                {student.firstName} {student.lastName}
              </Link>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {student.email}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {/* Average grade pill */}
            <div style={{
              padding: '4px 8px', borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)',
              textAlign: 'center', minWidth: 40
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.04em' }}>
                Avg
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: avg != null ? gradeColor(avg) : 'var(--color-text-muted)' }}>
                {avg != null ? avg : '—'}
              </div>
            </div>

            {/* Contextual Actions Menu */}
            <ActionMenu
              ariaLabel={`Actions for ${student.firstName}`}
              items={[
                {
                  label: 'View Login Credentials',
                  icon: KeyRound,
                  onClick: () => onViewCredentials && onViewCredentials(student),
                },
                {
                  label: 'Copy Login Invite',
                  icon: Share2,
                  onClick: handleCopyInvite,
                },
                {
                  label: 'Copy Password',
                  icon: Copy,
                  onClick: handleCopyPassword,
                },
                {
                  label: 'Reset / Edit Password',
                  icon: RefreshCw,
                  onClick: () => onEditPassword(student),
                },
                {
                  separator: true,
                },
                {
                  label: 'View Student Details',
                  icon: ChevronRight,
                  onClick: () => navigate(`/teacher/students/${student.id}`),
                },
              ]}
            />
          </div>
        </div>

        {/* Task Counts summary */}
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16,
          padding: '8px 12px', background: 'var(--color-surface-muted)',
          borderRadius: 'var(--radius-sm)', fontSize: 12,
        }}>
          {counts.total === 0 ? (
            <span style={{ color: 'var(--color-text-muted)' }}>No active tasks</span>
          ) : (
            <>
              {counts.inProgress > 0 && (
                <span style={{ color: 'var(--color-info)', fontWeight: 600 }}>
                  {counts.inProgress} active
                </span>
              )}
              {counts.review > 0 && (
                <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  · {counts.review} in review
                </span>
              )}
              {counts.done > 0 && (
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                  · {counts.done} done
                </span>
              )}
              {counts.overdue > 0 && (
                <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                  · {counts.overdue} overdue
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action buttons bottom */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        borderTop: '1px solid var(--color-border)',
        paddingTop: 12,
      }}>
        {/* Primary Action: Assign Task */}
        <button
          type="button"
          onClick={() => onAssign(student)}
          className="g-btn g-btn-primary"
          style={{ flex: 1, padding: '7px 12px', fontSize: 12.5, justifyContent: 'center', gap: 6 }}
          title={`Assign a task to ${student.firstName}`}
        >
          <Send size={13} /> Assign Task
        </button>

        {/* Secondary Action: Details */}
        <Link
          to={`/teacher/students/${student.id}`}
          className="g-btn g-btn-secondary"
          style={{ padding: '7px 12px', fontSize: 12.5 }}
          title="View student profile & assignments"
        >
          Details
        </Link>
      </div>
    </div>
  );
}

/* ── Student Table View ──────────────────────── */
function StudentTableView({ students, assignments, onAssign, onEditPassword, onViewCredentials }) {
  const toast = useToast();

  const handleCopyPassword = (student) => {
    const pw = getStudentPassword(student);
    navigator.clipboard.writeText(pw);
    toast(`Password copied for ${student.firstName}`);
  };

  const handleCopyInvite = (student) => {
    const invite = formatStudentInvite(student);
    navigator.clipboard.writeText(invite);
    toast(`Invite credentials copied for ${student.firstName}`);
  };

  return (
    <div className="glass-section" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{
              background: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              <th style={{ padding: '12px 18px' }}>Student</th>
              <th style={{ padding: '12px 14px' }}>Email</th>
              <th style={{ padding: '12px 14px', textAlign: 'center' }}>Avg Grade</th>
              <th style={{ padding: '12px 14px', textAlign: 'center' }}>Tasks</th>
              <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => {
              const avg = calcAverageGrade(student.id, assignments);
              const counts = studentTaskCounts(student.id, assignments);
              const initials = `${student.firstName?.[0] ?? ''}${student.lastName?.[0] ?? ''}`.toUpperCase();

              return (
                <tr
                  key={student.id}
                  className="glass-row"
                  style={{
                    borderBottom: idx < students.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                    transition: 'background 0.12s',
                  }}
                >
                  {/* Name */}
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'var(--color-primary-soft)', border: '1px solid var(--color-border-subtle)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11.5, fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0
                      }}>
                        {initials}
                      </div>
                      <Link
                        to={`/teacher/students/${student.id}`}
                        style={{
                          fontWeight: 600, color: 'var(--color-text)',
                          textDecoration: 'none', whiteSpace: 'nowrap'
                        }}
                      >
                        {student.firstName} {student.lastName}
                      </Link>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding: '14px 14px', color: 'var(--color-text-secondary)' }}>
                    {student.email}
                  </td>

                  {/* Avg Grade */}
                  <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                    <span style={{
                      fontWeight: 700, fontSize: 13.5,
                      color: avg != null ? gradeColor(avg) : 'var(--color-text-muted)'
                    }}>
                      {avg != null ? `${avg}%` : '—'}
                    </span>
                  </td>

                  {/* Tasks count */}
                  <td style={{ padding: '14px 14px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    {counts.total === 0 ? (
                      <span style={{ color: 'var(--color-text-muted)' }}>0</span>
                    ) : (
                      <div style={{ display: 'inline-flex', gap: 6, fontSize: 12 }}>
                        {counts.inProgress > 0 && <span style={{ color: 'var(--color-info)', fontWeight: 600 }}>{counts.inProgress} active</span>}
                        {counts.review > 0 && <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{counts.review} review</span>}
                        {counts.done > 0 && <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{counts.done} done</span>}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => onAssign(student)}
                        className="g-btn g-btn-primary"
                        style={{ padding: '5px 12px', fontSize: 12, gap: 5 }}
                        title="Assign task"
                      >
                        <Send size={12} /> Assign
                      </button>
                      <Link
                        to={`/teacher/students/${student.id}`}
                        className="g-btn g-btn-secondary"
                        style={{ padding: '5px 12px', fontSize: 12 }}
                      >
                        Details
                      </Link>
                      <ActionMenu
                        align="right"
                        items={[
                          {
                            label: 'View Login Credentials',
                            icon: KeyRound,
                            onClick: () => onViewCredentials && onViewCredentials(student),
                          },
                          {
                            label: 'Copy Login Invite',
                            icon: Share2,
                            onClick: () => handleCopyInvite(student),
                          },
                          {
                            label: 'Copy Password',
                            icon: Copy,
                            onClick: () => handleCopyPassword(student),
                          },
                          {
                            label: 'Reset Password',
                            icon: KeyRound,
                            onClick: () => onEditPassword(student),
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Review Queue ───────────────────────────── */
function ReviewQueue({ submissions, assignments, users }) {
  const toReview = submissions.filter(s => {
    const assignment = assignments.find(a => a.id === s.assignedTaskId);
    return assignment && ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_REVISION', 'REVIEW'].includes(assignment.status);
  });

  if (!toReview.length) {
    return (
      <div className="glass-section" style={{ borderRadius: 'var(--r-xl)' }}>
        <div className="g-empty">
          <div className="g-empty-icon"><ClipboardList size={20} strokeWidth={1.8} /></div>
          <h3>No submissions to review</h3>
          <p>Submitted work will appear here when students send in their answers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-section" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
      {toReview.map((sub, i) => {
        const assignment = assignments.find(a => a.id === sub.assignedTaskId);
        const student = users.find(u => u.id === sub.studentId);
        if (!assignment || !student) return null;
        return (
          <div
            key={sub.id}
            className="glass-row"
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '16px 22px',
              borderBottom: i < toReview.length - 1 ? '1px solid rgba(255,255,255,0.40)' : 'none',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--txt-primary)', marginBottom: 3 }}>
                {student.firstName} {student.lastName}
              </div>
              <div style={{ fontSize: 12, color: 'var(--txt-secondary)', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>{assignment.title}</span>
                <span>·</span>
                <span style={{ textTransform: 'capitalize' }}>
                  {assignment.type?.toLowerCase()}
                </span>
                <span>·</span>
                <span>Submitted {formatDateTime(sub.submittedAt)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <StatusBadge assignment={assignment} />
              <Link to={`/teacher/submissions/${sub.id}`} className="g-btn g-btn-primary" style={{ fontSize: 12, padding: '7px 14px' }}>
                Review Work
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Dashboard Main ──────────────────────────── */
export default function Dashboard() {
  const { data } = useData();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('students');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [showAdd, setShowAdd] = useState(false);
  const [editingPasswordStudent, setEditingPasswordStudent] = useState(null);
  const [viewingCredentialsStudent, setViewingCredentialsStudent] = useState(null);

  // Assignment Modal states
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningTemplate, setAssigningTemplate] = useState(null);
  const [assigningStudent, setAssigningStudent] = useState(null);

  // Filters for tasks
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [taskTypeFilter, setTaskTypeFilter] = useState('All Types');
  const [taskSortBy, setTaskSortBy] = useState('newest');

  const students = useMemo(() => {
    return (data?.users || []).filter(u => u.role === 'STUDENT' && u.isActive !== false);
  }, [data?.users]);

  const assignmentCountMap = useMemo(() => {
    const map = {};
    (data?.assignments || []).forEach(a => {
      if (a.templateId) map[a.templateId] = (map[a.templateId] || 0) + 1;
    });
    return map;
  }, [data?.assignments]);

  const reviewQueueCount = useMemo(() => {
    return (data?.submissions || []).filter(s => {
      const a = (data?.assignments || []).find(a => a.id === s.assignedTaskId);
      return a && ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_REVISION', 'REVIEW'].includes(a.status);
    }).length;
  }, [data?.submissions, data?.assignments]);

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q
      ? students.filter(s =>
          (s.firstName || '').toLowerCase().includes(q) ||
          (s.lastName || '').toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q)
        )
      : students;
  }, [students, search]);

  const filteredTasks = useMemo(() => {
    let list = [...(data?.templates || [])];
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.instructions || '').toLowerCase().includes(q)
      );
    }
    if (taskStatusFilter === 'assigned') {
      list = list.filter(t => (assignmentCountMap[t.id] || 0) > 0);
    } else if (taskStatusFilter === 'unassigned') {
      list = list.filter(t => !assignmentCountMap[t.id]);
    }
    if (taskTypeFilter !== 'All Types') {
      list = list.filter(t => t.type?.toUpperCase() === taskTypeFilter.toUpperCase());
    }
    return list.sort((a, b) => {
      if (taskSortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (taskSortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (taskSortBy === 'most_assigned') return (assignmentCountMap[b.id] || 0) - (assignmentCountMap[a.id] || 0);
      if (taskSortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });
  }, [data?.templates, search, taskStatusFilter, taskTypeFilter, taskSortBy, assignmentCountMap]);

  // Handle direct assign from a student card
  const handleAssignToStudent = (student) => {
    setAssigningStudent(student);
    setAssigningTemplate(null);
    setAssignModalOpen(true);
  };

  // Handle direct assign from a template card
  const handleAssignTemplate = (template) => {
    setAssigningTemplate(template);
    setAssigningStudent(null);
    setAssignModalOpen(true);
  };

  // Handle general bulk assign
  const handleOpenGeneralAssign = () => {
    setAssigningStudent(null);
    setAssigningTemplate(null);
    setAssignModalOpen(true);
  };

  // Copy full student roster with passwords
  const handleCopyAllRoster = () => {
    if (!students.length) return toast('No students to copy.', 'error');
    const text = formatAllStudentsRoster(students);
    navigator.clipboard.writeText(text);
    toast(`Copied roster & passwords for all ${students.length} students!`);
  };

  // Download CSV of passwords
  const handleExportCsv = () => {
    if (!students.length) return toast('No students to export.', 'error');
    downloadCredentialsCsv(students);
    toast('Student passwords CSV downloaded!');
  };

  return (
    <div className="g-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--txt-primary)', margin: 0, letterSpacing: '-0.025em' }}>
            Teacher Dashboard
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--txt-secondary)', margin: '4px 0 0' }}>
            Manage student logins, assign tasks easily, and review submissions
          </p>
        </div>

        {/* Top quick action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleOpenGeneralAssign}
            className="g-btn g-btn-primary"
            style={{ padding: '8px 14px', fontSize: 13, gap: 6 }}
            title="Fast multi-student task assign"
          >
            <Send size={14} /> Quick assign task
          </button>
          <Link to="/teacher/tasks?mode=create" className="g-btn g-btn-secondary" style={{ padding: '8px 14px', fontSize: 13, gap: 6 }}>
            <Plus size={14} /> New template
          </Link>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        {[
          {
            label: 'Total Students',
            value: students.length,
            accent: 'var(--color-primary)',
            desc: 'Active learners enrolled',
          },
          {
            label: 'Awaiting Review',
            value: reviewQueueCount,
            accent: 'var(--color-warning)',
            desc: 'Submissions in queue',
          },
          {
            label: 'In-Flight Tasks',
            value: (data?.assignments || []).filter(a => a.status !== 'DONE').length,
            accent: 'var(--color-info)',
            desc: 'Assignments active',
          },
          {
            label: 'Task Templates',
            value: (data?.templates || []).length,
            accent: 'var(--color-success)',
            desc: 'Library assignments',
          },
        ].map(stat => (
          <div
            key={stat.label}
            className="glass-card"
            style={{
              padding: '18px 20px',
              cursor: 'default',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderTop: `3px solid ${stat.accent}`,
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>
                {stat.value}
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginTop: 10 }}>
              {stat.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs bar */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid rgba(255,255,255,0.45)',
        marginBottom: 24,
        overflowX: 'auto', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
      }}>
        {[
          { id: 'students', label: `Students (${students.length})` },
          { id: 'tasks', label: `Task Templates (${(data?.templates || []).length})` },
          { id: 'review', label: `Review Queue (${reviewQueueCount})` },
        ].map(t => (
          <button
            key={t.id}
            className={`g-tab-underline${tab === t.id ? ' active' : ''}`}
            onClick={() => { setTab(t.id); setSearch(''); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: STUDENTS */}
      {tab === 'students' && (
        <>
          {/* Controls toolbar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 20, flexWrap: 'wrap', gap: 12
          }}>
            {/* Search */}
            <div className="g-search-wrap" style={{ minWidth: 240, flex: 1, maxWidth: 360 }}>
              <span className="g-search-icon"><Search size={14} /></span>
              <input
                className="g-search"
                placeholder="Search students by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-tertiary)' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* View Mode & Roster Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {/* View Switcher: Grid vs Table */}
              <div style={{
                display: 'inline-flex', background: 'rgba(255,255,255,0.45)',
                border: '1px solid rgba(255,255,255,0.65)', borderRadius: 'var(--r-sm)', padding: 3, gap: 2
              }}>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: viewMode === 'grid' ? 'var(--accent)' : 'transparent',
                    color: viewMode === 'grid' ? '#fff' : 'var(--txt-secondary)',
                    display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600,
                  }}
                  title="Grid card view"
                >
                  <LayoutGrid size={13} /> Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  style={{
                    padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: viewMode === 'table' ? 'var(--accent)' : 'transparent',
                    color: viewMode === 'table' ? '#fff' : 'var(--txt-secondary)',
                    display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600,
                  }}
                  title="Table roster view"
                >
                  <TableIcon size={13} /> Roster
                </button>
              </div>

              {/* Roster tools menu */}
              <ActionMenu
                align="right"
                ariaLabel="Roster tools and export"
                trigger={
                  <span
                    className="g-btn g-btn-secondary"
                    style={{ fontSize: 12, padding: '6px 11px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    title="Roster credentials and export options"
                  >
                    <Download size={13} /> Roster Tools
                  </span>
                }
                items={[
                  {
                    label: 'Copy all credentials',
                    icon: Copy,
                    onClick: handleCopyAllRoster,
                  },
                  {
                    label: 'Export credentials CSV',
                    icon: Download,
                    onClick: handleExportCsv,
                  },
                ]}
              />

              {/* Add Student button (Primary Action) */}
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="g-btn g-btn-primary"
                style={{ fontSize: 12.5, padding: '7px 14px', gap: 6 }}
              >
                <UserPlus size={14} /> Add student
              </button>
            </div>
          </div>

          {/* Student Grid / Table Render */}
          {filteredStudents.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="g-student-grid">
                {filteredStudents.map(s => (
                  <StudentCard
                    key={s.id}
                    student={s}
                    assignments={data.assignments || []}
                    onAssign={handleAssignToStudent}
                    onEditPassword={setEditingPasswordStudent}
                    onViewCredentials={setViewingCredentialsStudent}
                  />
                ))}
              </div>
            ) : (
              <StudentTableView
                students={filteredStudents}
                assignments={data.assignments || []}
                onAssign={handleAssignToStudent}
                onEditPassword={setEditingPasswordStudent}
                onViewCredentials={setViewingCredentialsStudent}
              />
            )
          ) : (
            <div className="glass-section" style={{ borderRadius: 'var(--r-xl)' }}>
              <div className="g-empty">
                <div className="g-empty-icon"><UserPlus size={20} strokeWidth={1.8} /></div>
                <h3>{search ? 'No students found' : 'No students yet'}</h3>
                <p>{search ? 'Try a different name or email.' : 'Add your first student to get started.'}</p>
                {!search && (
                  <button onClick={() => setShowAdd(true)} className="g-btn g-btn-primary" style={{ marginTop: 8 }}>
                    + Add student
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: TASKS */}
      {tab === 'tasks' && (
        <>
          {/* Controls toolbar */}
          <div className="glass-2" style={{ borderRadius: 'var(--r-lg)', padding: '14px 18px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
              <div className="g-tabs" style={{ gap: 4 }}>
                {[
                  { id: 'all', label: `All Tasks (${(data?.templates || []).length})` },
                  { id: 'assigned', label: `Assigned (${(data?.templates || []).filter(t => (assignmentCountMap[t.id] || 0) > 0).length})` },
                  { id: 'unassigned', label: `Unassigned (${(data?.templates || []).filter(t => !assignmentCountMap[t.id]).length})` },
                ].map(item => (
                  <button
                    key={item.id}
                    className={`g-tab${taskStatusFilter === item.id ? ' active' : ''}`}
                    onClick={() => setTaskStatusFilter(item.id)}
                    style={{ fontSize: 12, padding: '5px 11px' }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Link to="/teacher/tasks" className="g-btn g-btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>
                  Task Library <ChevronRight size={13} />
                </Link>
                <Link to="/teacher/tasks?mode=create" className="g-btn g-btn-primary" style={{ fontSize: 12, padding: '6px 12px', gap: 5 }}>
                  <Plus size={14} /> New task
                </Link>
              </div>
            </div>

            {/* Filter inputs row */}
            <div style={{
              display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
              borderTop: '1px solid rgba(255,255,255,0.40)', paddingTop: 10,
            }}>
              <div className="g-search-wrap" style={{ minWidth: 200, flex: 1, maxWidth: 320 }}>
                <span className="g-search-icon"><Search size={13} /></span>
                <input
                  className="g-search"
                  placeholder="Search tasks…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ padding: '6px 10px 6px 30px', fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--txt-secondary)' }}>Type:</span>
                <select
                  value={taskTypeFilter}
                  onChange={e => setTaskTypeFilter(e.target.value)}
                  className="g-select"
                  style={{ fontSize: 11.5, padding: '4px 8px' }}
                >
                  {['All Types', 'Vocabulary', 'Writing', 'Reading', 'Listening', 'Speaking', 'Grammar', 'Keyword', 'Summary', 'Other'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--txt-secondary)' }}>Sort:</span>
                <select
                  value={taskSortBy}
                  onChange={e => setTaskSortBy(e.target.value)}
                  className="g-select"
                  style={{ fontSize: 11.5, padding: '4px 8px' }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="most_assigned">Most Assigned</option>
                  <option value="title">Title (A-Z)</option>
                </select>
              </div>

              {(search || taskStatusFilter !== 'all' || taskTypeFilter !== 'All Types' || taskSortBy !== 'newest') && (
                <button
                  onClick={() => {
                    setSearch('');
                    setTaskStatusFilter('all');
                    setTaskTypeFilter('All Types');
                    setTaskSortBy('newest');
                  }}
                  className="g-btn g-btn-ghost"
                  style={{ fontSize: 11, padding: '4px 8px', color: 'var(--accent-text)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}
                >
                  <X size={12} /> Reset
                </button>
              )}
            </div>
          </div>

          {/* Task Template List */}
          {filteredTasks.length > 0 ? (
            <div className="glass-section" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
              {filteredTasks.map((tpl, i) => {
                const assignedCount = (data?.assignments || []).filter(a => a.templateId === tpl.id).length;
                return (
                  <div
                    key={tpl.id}
                    className="glass-row"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px',
                      borderBottom: i < filteredTasks.length - 1 ? '1px solid rgba(255,255,255,0.40)' : 'none',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Link
                          to={`/teacher/tasks/${tpl.id}`}
                          style={{
                            fontSize: 14.5, fontWeight: 600, color: 'var(--txt-primary)',
                            textDecoration: 'none', transition: 'color 0.15s',
                          }}
                          onMouseEnter={e => e.target.style.color = 'var(--accent-text)'}
                          onMouseLeave={e => e.target.style.color = 'var(--txt-primary)'}
                        >
                          {tpl.title}
                        </Link>
                        <TypeChip type={tpl.type} />
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--txt-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 520 }}>
                        {(tpl.instructions || '').slice(0, 110)}{tpl.instructions?.length > 110 ? '…' : ''}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--txt-tertiary)', marginTop: 4 }}>
                        {assignedCount} {assignedCount === 1 ? 'student' : 'students'} assigned · Created {formatDate(tpl.createdAt)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {/* One-click Assign button */}
                      <button
                        onClick={() => handleAssignTemplate(tpl)}
                        className="g-btn g-btn-primary"
                        style={{ padding: '6px 13px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
                        title="Assign to students"
                      >
                        <UserCheck size={13} /> Assign
                      </button>
                      <Link
                        to={`/teacher/tasks/${tpl.id}`}
                        className="g-btn g-btn-ghost"
                        style={{ padding: '7px 11px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}
                      >
                        View <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-section" style={{ borderRadius: 'var(--r-xl)' }}>
              <div className="g-empty">
                <div className="g-empty-icon"><BookOpen size={20} strokeWidth={1.8} /></div>
                <h3>{search ? 'No tasks found' : 'No tasks yet'}</h3>
                <p>{search ? 'Try a different search keyword.' : 'Create your first task template to start assigning homework.'}</p>
                <Link to="/teacher/tasks?mode=create" className="g-btn g-btn-primary" style={{ marginTop: 8 }}>
                  + Create task
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 3: REVIEW */}
      {tab === 'review' && (
        <ReviewQueue
          submissions={data?.submissions || []}
          assignments={data?.assignments || []}
          users={data?.users || []}
        />
      )}

      {/* Add Student Modal */}
      {showAdd && <AddStudentModal onClose={() => setShowAdd(false)} />}

      {/* Edit / View Student Password Modal */}
      {editingPasswordStudent && (
        <EditPasswordModal
          student={editingPasswordStudent}
          onClose={() => setEditingPasswordStudent(null)}
          onUpdated={() => {}}
        />
      )}

      {/* Student Credentials Modal */}
      {viewingCredentialsStudent && (
        <StudentCredentialsModal
          student={viewingCredentialsStudent}
          onClose={() => setViewingCredentialsStudent(null)}
          onChangePassword={() => {
            const st = viewingCredentialsStudent;
            setViewingCredentialsStudent(null);
            setEditingPasswordStudent(st);
          }}
        />
      )}

      {/* Universal Task Assign Modal */}
      {assignModalOpen && (
        <AssignStudentsModal
          template={assigningTemplate}
          preselectedStudentId={assigningStudent?.id}
          onClose={() => {
            setAssignModalOpen(false);
            setAssigningTemplate(null);
            setAssigningStudent(null);
          }}
        />
      )}
    </div>
  );
}
