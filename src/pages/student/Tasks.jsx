import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Search, ChevronRight, ClipboardList } from 'lucide-react';
import { StatusBadge, TypeChip, isOverdue } from '../../utils/helpers.jsx';

const FILTERS = ['All','Pending','In Progress','Submitted','Under Review','Needs Revision','Done','Overdue'];
const STATUS_MAP = {
  'Pending':'PENDING','In Progress':'IN_PROGRESS','Submitted':'SUBMITTED',
  'Under Review':'UNDER_REVIEW','Needs Revision':'NEEDS_REVISION','Done':'DONE',
};

export default function StudentTasks() {
  const { data, session } = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const mine = useMemo(
    () => (data?.assignments || []).filter(a => a.studentId === session?.user?.id),
    [data?.assignments, session?.user?.id]
  );

  const filtered = useMemo(() => {
    let list = mine;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(q));
    }
    if (filter !== 'All') {
      if (filter === 'Overdue') list = list.filter(isOverdue);
      else list = list.filter(a => a.status === STATUS_MAP[filter]);
    }
    return [...list].sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });
  }, [mine, search, filter]);

  return (
    <div className="g-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--txt-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            My Tasks
          </h1>
          <p style={{ fontSize: 13, color: 'var(--txt-secondary)', margin: '4px 0 0' }}>
            {mine.length} {mine.length === 1 ? 'task' : 'tasks'} assigned to you
          </p>
        </div>
        <div className="g-search-wrap">
          <span className="g-search-icon"><Search size={13} /></span>
          <input className="g-search" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="glass-2" style={{ borderRadius: 'var(--r-lg)', padding: '12px 16px', marginBottom: 20 }}>
        <div className="g-tabs">
          {FILTERS.map(f => (
            <button key={f} className={`g-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)} style={{ fontSize: 12.5 }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="glass-section" style={{ borderRadius: 'var(--r-xl)' }}>
          <div className="g-empty">
            <div className="g-empty-icon"><ClipboardList size={20} strokeWidth={1.8} /></div>
            <h3>{filter !== 'All' || search ? 'No matching tasks' : 'No tasks yet'}</h3>
            <p>Your teacher hasn't assigned any tasks, or none match your current filter.</p>
          </div>
        </div>
      ) : (
        <div className="glass-section" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
          {filtered.map((a, i) => {
            const overdueA = isOverdue(a);
            const dl = a.deadline ? new Date(a.deadline) : null;
            const dlStr = dl
              ? dl.toLocaleDateString('en-GB', { day:'numeric', month:'short' }) + ', ' + dl.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })
              : null;

            return (
              <Link
                key={a.id}
                to={`/student/tasks/${a.id}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div
                  className="glass-row"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '16px 22px',
                    borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.40)' : 'none',
                    borderLeft: `3px solid ${overdueA ? 'rgba(248,113,113,0.55)' : 'transparent'}`,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--txt-primary)' }}>{a.title}</span>
                      <TypeChip type={a.type} />
                    </div>
                    <div style={{ fontSize: 12, color: overdueA ? 'var(--clr-overdue-txt)' : 'var(--txt-secondary)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {dlStr
                        ? <span>{overdueA ? '⚠ Overdue · was due ' : 'Due '}{dlStr}</span>
                        : <span>No deadline set</span>
                      }
                      {typeof a.grade === 'number' && (
                        <span style={{ fontWeight: 700, color: '#059669', marginLeft: 4 }}>· Grade: {a.grade}/100</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <StatusBadge assignment={a} />
                    <ChevronRight size={14} style={{ color: 'var(--txt-tertiary)' }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
