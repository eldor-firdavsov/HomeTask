import React from 'react';


/* ── Status helpers ─────────────────────────── */
export function isOverdue(a) {
  if (!a.deadline) return false;
  if (a.status === 'DONE') return false;
  return new Date(a.deadline) < new Date();
}

export function effectiveStatus(a) {
  if (isOverdue(a)) return 'OVERDUE';
  return a.status;
}

const STATUS_META = {
  PENDING:        { label: 'Pending',        cls: 'g-badge g-badge-pending'   },
  IN_PROGRESS:    { label: 'In Progress',    cls: 'g-badge g-badge-progress'  },
  SUBMITTED:      { label: 'Submitted',      cls: 'g-badge g-badge-submitted' },
  UNDER_REVIEW:   { label: 'Under Review',   cls: 'g-badge g-badge-review'    },
  NEEDS_REVISION: { label: 'Needs Revision', cls: 'g-badge g-badge-revision'  },
  DONE:           { label: 'Done',           cls: 'g-badge g-badge-done'      },
  OVERDUE:        { label: 'Overdue',        cls: 'g-badge g-badge-overdue'   },
};

export function StatusBadge({ assignment }) {
  const status = effectiveStatus(assignment);
  const meta   = STATUS_META[status] || { label: status, cls: 'g-badge' };
  return <span className={meta.cls}>{meta.label}</span>;
}

/* ── Type chip ──────────────────────────────── */
export function TypeChip({ type }) {
  if (!type) return null;
  const label = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  return <span className="g-chip">{label}</span>;
}

/* ── Grade helpers ──────────────────────────── */
export function calcAverageGrade(studentId, assignments) {
  const graded = assignments.filter(
    a => a.studentId === studentId && a.status === 'DONE' && typeof a.grade === 'number'
  );
  if (!graded.length) return null;
  return Math.round(graded.reduce((s, a) => s + a.grade, 0) / graded.length);
}

export function gradeColor(g) {
  if (g == null) return 'var(--txt-secondary)';
  if (g >= 85)   return '#059669';
  if (g >= 70)   return '#2563eb';
  if (g >= 55)   return '#d97706';
  return '#dc2626';
}

/* ── Date helpers ───────────────────────────── */
export function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(str) {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
       + ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function deadlineLabel(str) {
  if (!str) return null;
  const diff = new Date(str) - new Date();
  if (diff < 0) return 'Overdue';
  if (diff < 86400000)  return 'Due today';
  if (diff < 172800000) return 'Due tomorrow';
  return 'Due ' + formatDate(str);
}

/* ── Student task counts ────────────────────── */
export function studentTaskCounts(studentId, assignments) {
  const mine = assignments.filter(a => a.studentId === studentId);
  const now  = new Date();
  return {
    total:   mine.length,
    pending: mine.filter(a => a.status === 'PENDING').length,
    review:  mine.filter(a => ['SUBMITTED','UNDER_REVIEW'].includes(a.status)).length,
    revision:mine.filter(a => a.status === 'NEEDS_REVISION').length,
    done:    mine.filter(a => a.status === 'DONE').length,
    overdue: mine.filter(a => a.status !== 'DONE' && a.deadline && new Date(a.deadline) < now).length,
  };
}

/* ── UID ────────────────────────────────────── */
export function uid(pfx = 'id') {
  return `${pfx}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
}
