import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData, useToast } from '../../context/DataContext';
import { ArrowLeft, Plus, ClipboardList } from 'lucide-react';
import {
  calcAverageGrade, gradeColor, StatusBadge, TypeChip,
  formatDateTime, isOverdue, uid,
} from '../../utils/helpers.jsx';

const TABS = ['All','Pending','In Progress','Submitted','Review','Needs Revision','Done','Overdue'];
const STATUS_MAP = {
  'Pending':'PENDING','In Progress':'IN_PROGRESS','Submitted':'SUBMITTED',
  'Review':'UNDER_REVIEW','Needs Revision':'NEEDS_REVISION','Done':'DONE',
};

/* ── Assign Modal ──────────────────────────── */
function AssignModal({ studentId, onClose }) {
  const { data, setData } = useData();
  const toast = useToast();
  const [templateId, setTemplateId] = useState('');
  const [deadline,   setDeadline]   = useState('');
  const [err,        setErr]        = useState('');

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
    borderRadius: 'var(--r-sm)', padding: '10px 12px', fontSize: 13.5,
    color: 'var(--txt-primary)', fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', transition: 'all 0.15s',
    boxShadow: '0 2px 8px rgba(30,40,100,0.04), inset 0 1px 0 rgba(255,255,255,0.55)',
  };
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
    textTransform: 'uppercase', color: 'var(--txt-secondary)', marginBottom: 7,
  };

  const handleSend = () => {
    if (!templateId) return setErr('Please select a task template.');
    if (!deadline)   return setErr('Please set a deadline.');
    const tpl = data.templates.find(t => t.id === templateId);
    const exists = data.assignments.find(a => a.templateId === templateId && a.studentId === studentId && a.status !== 'DONE');
    if (exists && !confirm('This template is already active for this student. Assign again?')) return;

    const assignment = {
      id: uid('a'), templateId, teacherId: tpl.teacherId, studentId,
      title: tpl.title, type: tpl.type, instructions: tpl.instructions,
      submissionTypes: tpl.submissionTypes,
      attachments: tpl.attachments || [],
      deadline,
      status: 'PENDING',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setData({ ...data, assignments: [...data.assignments, assignment] });
    toast('Task assigned');
    onClose();
  };

  return (
    <div className="g-overlay" onClick={onClose}>
      <div className="glass-4 g-modal" onClick={e => e.stopPropagation()} style={{ padding: '30px 28px' }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--txt-primary)', margin: '0 0 22px' }}>
          Assign Task
        </h2>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Task template</label>
          <select style={inputStyle} value={templateId} onChange={e => setTemplateId(e.target.value)} onFocus={onFocus} onBlur={onBlur}>
            <option value="">— Select a template —</option>
            {data.templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: err ? 12 : 22 }}>
          <label style={labelStyle}>Deadline</label>
          <input type="datetime-local" style={inputStyle} value={deadline} onChange={e => setDeadline(e.target.value)} onFocus={onFocus} onBlur={onBlur} />
        </div>

        {err && (
          <div style={{
            padding: '10px 14px', background: 'var(--clr-overdue)', border: '1px solid var(--clr-overdue-bd)',
            borderRadius: 'var(--r-sm)', fontSize: 12, color: 'var(--clr-overdue-txt)', marginBottom: 16,
          }}>{err}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} className="g-btn g-btn-ghost">Cancel</button>
          <button onClick={handleSend} className="g-btn g-btn-primary">Send task</button>
        </div>
      </div>
    </div>
  );
}

/* ── Student Detail ────────────────────────── */
export default function StudentDetail() {
  const { studentId } = useParams();
  const { data } = useData();
  const [tab,        setTab]        = useState('All');
  const [showAssign, setShowAssign] = useState(false);

  const student     = data.users.find(u => u.id === studentId);
  const assignments = useMemo(() => data.assignments.filter(a => a.studentId === studentId), [data.assignments, studentId]);

  const filtered = useMemo(() => {
    if (tab === 'All')     return assignments;
    if (tab === 'Overdue') return assignments.filter(a => isOverdue(a));
    return assignments.filter(a => a.status === STATUS_MAP[tab]);
  }, [assignments, tab]);

  const avg = calcAverageGrade(studentId, data.assignments);

  const getSubmission = (assignmentId) =>
    data.submissions.find(s => s.assignedTaskId === assignmentId);

  if (!student) return (
    <div className="g-page" style={{ textAlign: 'center', padding: 80 }}>
      <p style={{ color: 'var(--txt-secondary)' }}>Student not found.</p>
      <Link to="/teacher/dashboard" className="g-btn g-btn-primary" style={{ marginTop: 16 }}>Back to dashboard</Link>
    </div>
  );

  return (
    <div className="g-page">
      {/* Back */}
      <Link to="/teacher/dashboard"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--txt-secondary)', textDecoration: 'none', marginBottom: 24, transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--txt-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--txt-secondary)'}
      >
        <ArrowLeft size={13} /> Dashboard
      </Link>

      {/* Header glass panel */}
      <div className="glass-1" style={{ borderRadius: 'var(--r-xl)', padding: '26px 30px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {/* Avatar */}
            <div style={{
              width: 52, height: 52, borderRadius: 15, flexShrink: 0,
              background: 'rgba(99,102,241,0.14)', border: '1px solid rgba(99,102,241,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: 'var(--accent-text)',
            }}>
              {student.firstName?.[0]}{student.lastName?.[0]}
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--txt-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                {student.firstName} {student.lastName}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--txt-secondary)', margin: '3px 0 0' }}>{student.email}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {/* Average grade pill */}
            <div style={{
              padding: '10px 18px', borderRadius: 'var(--r-md)',
              background: 'rgba(255,255,255,0.40)', border: '1px solid rgba(255,255,255,0.60)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-secondary)', marginBottom: 3 }}>
                Avg. Grade
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: avg != null ? gradeColor(avg) : 'var(--txt-tertiary)' }}>
                {avg != null ? avg : '—'}
              </div>
            </div>
            <button onClick={() => setShowAssign(true)} className="g-btn g-btn-primary">
              <Plus size={14} /> Assign task
            </button>
          </div>
        </div>
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
            <h3>No tasks</h3>
            <p>No tasks match the selected filter.</p>
          </div>
        </div>
      ) : (
        <div className="glass-section" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
          {filtered.map((a, i) => {
            const sub      = getSubmission(a.id);
            const canReview = sub && ['SUBMITTED','UNDER_REVIEW'].includes(sub.status);
            const overdueA = isOverdue(a);
            return (
              <div key={a.id} className="glass-row" style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '15px 22px',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.40)' : 'none',
                borderLeft: `3px solid ${overdueA ? 'rgba(248,113,113,0.60)' : 'transparent'}`,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt-primary)' }}>{a.title}</span>
                    <TypeChip type={a.type} />
                  </div>
                  <div style={{ fontSize: 12, color: overdueA ? 'var(--clr-overdue-txt)' : 'var(--txt-secondary)' }}>
                    {a.deadline
                      ? (overdueA ? 'Overdue — ' : 'Due ') + new Date(a.deadline).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) + ', ' + new Date(a.deadline).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })
                      : 'No deadline'
                    }
                    {typeof a.grade === 'number' && (
                      <span style={{ marginLeft: 10, fontWeight: 700, color: gradeColor(a.grade) }}>
                        Grade: {a.grade}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <StatusBadge assignment={a} />
                  {canReview && (
                    <Link to={`/teacher/submissions/${sub.id}`} className="g-btn g-btn-primary" style={{ fontSize: 12, padding: '6px 13px' }}>
                      Review
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAssign && <AssignModal studentId={studentId} onClose={() => setShowAssign(false)} />}
    </div>
  );
}
