import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData, useToast } from '../../context/DataContext';
import { Search, UserPlus, ChevronRight, ClipboardList, BookOpen, Plus, UserCheck, Copy, Check, RefreshCw, X } from 'lucide-react';
import {
  calcAverageGrade, gradeColor, studentTaskCounts,
  StatusBadge, formatDateTime, formatDate, TypeChip, uid,
} from '../../utils/helpers.jsx';
import AssignStudentsModal from '../../components/tasks/AssignStudentsModal';
import { createStudent } from '../../lib/supabase/students.js';

/* ── Shared inline styles ──────────────────── */
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.05em', textTransform: 'uppercase',
  color: 'var(--txt-secondary)', marginBottom: 6,
};
const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.40)', backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.60)',
  borderRadius: 'var(--r-sm)', padding: '10px 12px', fontSize: 13.5,
  color: 'var(--txt-primary)', fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box', transition: 'all 0.15s',
  boxShadow: '0 2px 8px rgba(30,40,100,0.04), inset 0 1px 0 rgba(255,255,255,0.55)',
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
  const { data, refreshData } = useData();
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
    e.target.style.borderColor = 'rgba(99,102,241,0.50)';
    e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.10), 0 2px 8px rgba(30,40,100,0.04)';
    e.target.style.background = 'rgba(255,255,255,0.62)';
  };
  const handleBlur = e => {
    e.target.style.borderColor = 'rgba(255,255,255,0.60)';
    e.target.style.boxShadow = '0 2px 8px rgba(30,40,100,0.04), inset 0 1px 0 rgba(255,255,255,0.55)';
    e.target.style.background = 'rgba(255,255,255,0.40)';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password.trim()) {
      return setErr('All fields are required.');
    }
    if (!/^[^\s@]+@[^\s@]+$/.test(form.email)) {
      return setErr('Enter a valid email address (e.g. name@school or student@example.com).');
    }
    if (form.password.length < 6) {
      return setErr('Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      await createStudent({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password.trim(),
      });
      setCreatedStudent({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password.trim(),
      });
      toast('Student created successfully!');
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
    const text = `Homework Platform Student Credentials:\nEmail: ${createdStudent.email}\nTemporary Password: ${createdStudent.password}\nLogin URL: ${window.location.origin}/student/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast('Credentials copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="g-overlay" onClick={onClose}>
      <div className="glass-4 g-modal" onClick={e => e.stopPropagation()} style={{ padding: '32px 30px', maxWidth: 460 }}>
        {!createdStudent ? (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt-primary)', margin: '0 0 20px' }}>
              Add Student
            </h2>
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
                  placeholder="student@school or student@example.com"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  disabled={loading}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...labelStyle, margin: 0 }}>Initial Password</label>
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
                  style={inputStyle} value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Password"
                  onFocus={handleFocus} onBlur={handleBlur}
                  disabled={loading}
                />
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
                Copy the credentials below and provide them to <strong>{createdStudent.firstName}</strong>.
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
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase' }}>Temporary Password</div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-text)', marginTop: 2 }}>{createdStudent.password}</div>
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
                {copied ? 'Copied to clipboard!' : 'Copy credentials'}
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

/* ── Student Card ───────────────────────────── */
function StudentCard({ student, assignments }) {
  const avg    = calcAverageGrade(student.id, assignments);
  const counts = studentTaskCounts(student.id, assignments);
  const initials = `${student.firstName?.[0] ?? ''}${student.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <Link to={`/teacher/students/${student.id}`} className="glass-card" style={{ padding: '22px 22px 18px' }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: 'var(--accent-text)',
        }}>{initials}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--txt-primary)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {student.firstName} {student.lastName}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--txt-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {student.email}
          </div>
        </div>
      </div>

      {/* Average grade */}
      <div style={{
        padding: '12px 14px', borderRadius: 'var(--r-sm)', marginBottom: 16,
        background: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.55)',
      }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          Average grade
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: avg != null ? gradeColor(avg) : 'var(--txt-tertiary)', lineHeight: 1 }}>
          {avg != null ? avg : '—'}
          {avg != null && <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--txt-tertiary)', marginLeft: 2 }}>/100</span>}
        </div>
      </div>

      {/* Counts */}
      <div style={{
        display: 'flex',
        borderTop: '1px solid rgba(255,255,255,0.50)',
        paddingTop: 14,
        flexWrap: 'wrap', gap: 10,
      }}>
        {counts.total === 0 ? (
          <span style={{ fontSize: 12, color: 'var(--txt-tertiary)' }}>No tasks yet</span>
        ) : (
          <>
            {counts.pending > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt-primary)' }}>{counts.pending}</div>
                <div style={{ fontSize: 10, color: 'var(--txt-secondary)' }}>pending</div>
              </div>
            )}
            {counts.review > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--clr-submitted-txt)' }}>{counts.review}</div>
                <div style={{ fontSize: 10, color: 'var(--txt-secondary)' }}>review</div>
              </div>
            )}
            {counts.done > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--clr-done-txt)' }}>{counts.done}</div>
                <div style={{ fontSize: 10, color: 'var(--txt-secondary)' }}>done</div>
              </div>
            )}
            {counts.overdue > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--clr-overdue-txt)' }}>{counts.overdue}</div>
                <div style={{ fontSize: 10, color: 'var(--txt-secondary)' }}>overdue</div>
              </div>
            )}
          </>
        )}
      </div>
    </Link>
  );
}

/* ── Review Queue ───────────────────────────── */
function ReviewQueue({ submissions, assignments, users }) {
  const toReview = submissions.filter(s => {
    const assignment = assignments.find(a => a.id === s.assignedTaskId);
    return assignment && ['SUBMITTED', 'UNDER_REVIEW'].includes(assignment.status);
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
        const student    = users.find(u => u.id === sub.studentId);
        if (!assignment || !student) return null;
        return (
          <div
            key={sub.id}
            className="glass-row"
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '15px 22px',
              borderBottom: i < toReview.length - 1 ? '1px solid rgba(255,255,255,0.40)' : 'none',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt-primary)', marginBottom: 3 }}>
                {student.firstName} {student.lastName}
              </div>
              <div style={{ fontSize: 12, color: 'var(--txt-secondary)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{assignment.title}</span>
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
                Review
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Dashboard ──────────────────────────────── */
export default function Dashboard() {
  const { data } = useData();
  const [search,            setSearch]            = useState('');
  const [tab,               setTab]               = useState('students');
  const [showAdd,           setShowAdd]           = useState(false);
  const [taskStatusFilter,  setTaskStatusFilter]  = useState('all');
  const [taskTypeFilter,    setTaskTypeFilter]    = useState('All Types');
  const [taskSortBy,        setTaskSortBy]        = useState('newest');

  const students = useMemo(() => data.users.filter(u => u.role === 'STUDENT'), [data.users]);

  const assignmentCountMap = useMemo(() => {
    const map = {};
    (data.assignments || []).forEach(a => {
      if (a.templateId) map[a.templateId] = (map[a.templateId] || 0) + 1;
    });
    return map;
  }, [data.assignments]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? students.filter(s =>
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q)  ||
          s.email.toLowerCase().includes(q)
        )
      : students;
  }, [students, search]);

  const filteredTasks = useMemo(() => {
    let list = [...(data.templates || [])];
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
  }, [data.templates, search, taskStatusFilter, taskTypeFilter, taskSortBy, assignmentCountMap]);

  return (
    <div className="g-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--txt-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: 'var(--txt-secondary)', margin: '4px 0 0' }}>
            Manage your students and track their progress
          </p>
        </div>
        <Link to="/teacher/tasks/new" className="g-btn g-btn-primary">
          + New task
        </Link>
      </div>

      {/* Tabs bar */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid rgba(255,255,255,0.45)',
        marginBottom: 24,
        overflowX: 'auto', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
      }}>
        {['students','tasks','review'].map(t => (
          <button
            key={t}
            className={`g-tab-underline${tab === t ? ' active' : ''}`}
            onClick={() => { setTab(t); setSearch(''); }}
          >
            {t === 'students' ? 'Students' : t === 'tasks' ? 'Tasks' : 'Review'}
          </button>
        ))}
      </div>

      {tab === 'students' && (
        <>
          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div className="g-search-wrap">
              <span className="g-search-icon"><Search size={13} /></span>
              <input
                className="g-search"
                placeholder="Search students…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button onClick={() => setShowAdd(true)} className="g-btn g-btn-secondary">
              <UserPlus size={14} /> Add student
            </button>
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="g-student-grid">
              {filtered.map(s => (
                <StudentCard key={s.id} student={s} assignments={data.assignments} />
              ))}
            </div>
          ) : (
            <div className="glass-section" style={{ borderRadius: 'var(--r-xl)' }}>
              <div className="g-empty">
                <div className="g-empty-icon"><UserPlus size={20} strokeWidth={1.8} /></div>
                <h3>{search ? 'No students found' : 'No students yet'}</h3>
                <p>{search ? 'Try a different name or email.' : 'Add your first student to get started.'}</p>
                {!search && (
                  <button onClick={() => setShowAdd(true)} className="g-btn g-btn-primary">
                    + Add student
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'tasks' && (
        <>
          {/* Controls toolbar */}
          <div className="glass-2" style={{ borderRadius: 'var(--r-lg)', padding: '14px 18px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
              <div className="g-tabs" style={{ gap: 4 }}>
                {[
                  { id: 'all', label: `All Tasks (${(data.templates || []).length})` },
                  { id: 'assigned', label: `Assigned (${(data.templates || []).filter(t => (assignmentCountMap[t.id] || 0) > 0).length})` },
                  { id: 'unassigned', label: `Unassigned (${(data.templates || []).filter(t => !assignmentCountMap[t.id]).length})` },
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
                <Link to="/teacher/tasks/new" className="g-btn g-btn-primary" style={{ fontSize: 12, padding: '6px 12px' }}>
                  <Plus size={14} /> New task
                </Link>
              </div>
            </div>

            {/* Filter inputs row */}
            <div style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap',
              borderTop: '1px solid rgba(255,255,255,0.40)',
              paddingTop: 10,
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
                  <X size={12} />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Grid / List of Tasks */}
          {filteredTasks.length > 0 ? (
            <div className="glass-section" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
              {filteredTasks.map((tpl, i) => {
                const assignedCount = data.assignments.filter(a => a.templateId === tpl.id).length;
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
                      <div style={{ fontSize: 12.5, color: 'var(--txt-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 500 }}>
                        {(tpl.instructions || '').slice(0, 100)}{tpl.instructions?.length > 100 ? '…' : ''}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--txt-tertiary)', marginTop: 4 }}>
                        {assignedCount} {assignedCount === 1 ? 'student' : 'students'} assigned · Created {formatDate(tpl.createdAt)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => setAssigningTemplate(tpl)}
                        className="g-btn g-btn-primary"
                        style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                        title="Assign to one or several students"
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
                <Link to="/teacher/tasks/new" className="g-btn g-btn-primary" style={{ marginTop: 8 }}>
                  + Create task
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'review' && (
        <ReviewQueue
          submissions={data.submissions}
          assignments={data.assignments}
          users={data.users}
        />
      )}

      {showAdd && <AddStudentModal onClose={() => setShowAdd(false)} />}

      {assigningTemplate && (
        <AssignStudentsModal
          template={assigningTemplate}
          onClose={() => setAssigningTemplate(null)}
        />
      )}
    </div>
  );
}
