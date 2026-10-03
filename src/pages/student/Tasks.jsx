import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Search, ChevronRight, ClipboardList, Filter, X, ArrowUpDown, Calendar, Timer } from 'lucide-react';
import { StatusBadge, TypeChip, isOverdue } from '../../utils/helpers.jsx';

const STATUS_FILTERS = ['All', 'To Do', 'In Progress', 'Turned In', 'Checking', 'Needs Changes', 'Completed', 'Late'];

const STATUS_MAP = {
  'To Do': 'PENDING',
  'In Progress': 'IN_PROGRESS',
  'Turned In': 'SUBMITTED',
  'Checking': 'UNDER_REVIEW',
  'Needs Changes': 'NEEDS_REVISION',
  'Completed': 'DONE',
};

const TASK_TYPES = ['All Subjects', 'Vocabulary', 'Writing', 'Reading', 'Listening', 'Speaking', 'Grammar', 'Keyword', 'Summary', 'Other'];

export default function StudentTasks() {
  const { data, session } = useData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All Subjects');
  const [timeframeFilter, setTimeframeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('deadline_asc');

  const mine = useMemo(
    () => (data?.assignments || []).filter(a => a.studentId === session?.user?.id),
    [data?.assignments, session?.user?.id]
  );

  // Status counts for badge indicators
  const statusCounts = useMemo(() => {
    const counts = { All: mine.length, Late: 0 };
    STATUS_FILTERS.forEach(f => {
      if (f !== 'All' && f !== 'Late') {
        counts[f] = mine.filter(a => a.status === STATUS_MAP[f]).length;
      }
    });
    counts.Late = mine.filter(isOverdue).length;
    return counts;
  }, [mine]);

  // Filter & sort logic
  const filtered = useMemo(() => {
    let list = mine;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        (a.instructions && a.instructions.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Late') {
        list = list.filter(isOverdue);
      } else {
        list = list.filter(a => a.status === STATUS_MAP[statusFilter]);
      }
    }

    // Task Type filter
    if (typeFilter !== 'All Subjects') {
      list = list.filter(a => (a.type || '').toUpperCase() === typeFilter.toUpperCase());
    }

    // Timeframe filter
    if (timeframeFilter !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);
      const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999);

      if (timeframeFilter === 'today') {
        list = list.filter(a => {
          if (!a.deadline) return false;
          const dl = new Date(a.deadline);
          return dl >= startOfToday && dl <= endOfToday;
        });
      } else if (timeframeFilter === 'tomorrow') {
        list = list.filter(a => {
          if (!a.deadline) return false;
          const dl = new Date(a.deadline);
          return dl > endOfToday && dl <= endOfTomorrow;
        });
      } else if (timeframeFilter === 'this_week') {
        list = list.filter(a => {
          if (!a.deadline) return false;
          const dl = new Date(a.deadline);
          return dl >= startOfToday && dl <= endOfWeek;
        });
      } else if (timeframeFilter === 'overdue') {
        list = list.filter(isOverdue);
      } else if (timeframeFilter === 'no_deadline') {
        list = list.filter(a => !a.deadline);
      }
    }

    // Sort
    return [...list].sort((a, b) => {
      if (sortBy === 'deadline_asc') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      }
      if (sortBy === 'deadline_desc') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(b.deadline) - new Date(a.deadline);
      }
      if (sortBy === 'grade') {
        return (b.grade ?? -1) - (a.grade ?? -1);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return 0;
    });
  }, [mine, search, statusFilter, typeFilter, timeframeFilter, sortBy]);

  const hasActiveFilters = search || statusFilter !== 'All' || typeFilter !== 'All Subjects' || timeframeFilter !== 'all' || sortBy !== 'deadline_asc';

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setTypeFilter('All Subjects');
    setTimeframeFilter('all');
    setSortBy('deadline_asc');
  };

  return (
    <div className="g-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--txt-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            My Homework
          </h1>
          <p style={{ fontSize: 13, color: 'var(--txt-secondary)', margin: '4px 0 0' }}>
            {mine.length} {mine.length === 1 ? 'homework assignment' : 'homework assignments'} for you
          </p>
        </div>

        {/* Actions & Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Link
            to="/student/pomodoro"
            className="g-btn g-btn-secondary"
            style={{ padding: '8px 14px', fontSize: 12.5, gap: 6, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
          >
            <Timer size={14} color="var(--accent-text)" />
            <span>Study Timer</span>
          </Link>

          <div className="g-search-wrap" style={{ minWidth: 220 }}>
            <span className="g-search-icon"><Search size={14} /></span>
            <input
              className="g-search"
              placeholder="Search homework by title or topic…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Filter Toolbar Container */}
      <div className="glass-2" style={{ borderRadius: 'var(--r-lg)', padding: '16px 18px', marginBottom: 20 }}>
        {/* Primary Status Tabs with Counts */}
        <div className="g-tabs" style={{ marginBottom: 14, overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: 4 }}>
          {STATUS_FILTERS.map(f => {
            const count = statusCounts[f] || 0;
            return (
              <button
                key={f}
                className={`g-tab${statusFilter === f ? ' active' : ''}`}
                onClick={() => setStatusFilter(f)}
                style={{ fontSize: 12.5, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span>{f}</span>
                <span style={{
                  fontSize: 10.5,
                  padding: '1px 6px',
                  borderRadius: 99,
                  background: statusFilter === f ? 'var(--accent)' : 'rgba(0,0,0,0.06)',
                  color: statusFilter === f ? '#fff' : 'var(--txt-secondary)',
                  fontWeight: 600,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Controls Row: Type, Timeframe, Sort, Reset */}
        <div style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
          borderTop: '1px solid rgba(255,255,255,0.40)',
          paddingTop: 12,
        }}>
          {/* Subject Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--txt-secondary)' }}>Subject:</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="g-select"
              style={{ fontSize: 12.5, padding: '5px 10px' }}
            >
              {TASK_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Timeframe Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--txt-secondary)' }}>Due date:</span>
            <select
              value={timeframeFilter}
              onChange={e => setTimeframeFilter(e.target.value)}
              className="g-select"
              style={{ fontSize: 12.5, padding: '5px 10px' }}
            >
              <option value="all">All Dates</option>
              <option value="today">Due Today</option>
              <option value="tomorrow">Due Tomorrow</option>
              <option value="this_week">Due This Week</option>
              <option value="overdue">Late Only</option>
              <option value="no_deadline">No Due Date</option>
            </select>
          </div>

          {/* Sort By */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--txt-secondary)' }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="g-select"
              style={{ fontSize: 12.5, padding: '5px 10px' }}
            >
              <option value="deadline_asc">Due Soonest</option>
              <option value="deadline_desc">Due Latest</option>
              <option value="newest">Recently Assigned</option>
              <option value="grade">Highest Grade</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="g-btn g-btn-ghost"
              style={{
                fontSize: 11.5,
                padding: '5px 10px',
                color: 'var(--accent-text)',
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <X size={13} />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results Header / Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}>
        <span style={{ fontSize: 12.5, color: 'var(--txt-secondary)', fontWeight: 500 }}>
          Showing <strong>{filtered.length}</strong> of <strong>{mine.length}</strong> assignments
        </span>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="glass-section" style={{ borderRadius: 'var(--r-xl)' }}>
          <div className="g-empty" style={{ padding: '48px 20px' }}>
            <div className="g-empty-icon"><ClipboardList size={22} strokeWidth={1.8} /></div>
            <h3>{hasActiveFilters ? 'No homework matches your filters' : 'No homework yet!'}</h3>
            <p>
              {hasActiveFilters
                ? 'Try clicking "Clear all filters" above to see all your homework.'
                : "Your teacher hasn't assigned any homework yet. Enjoy your day!"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="g-btn g-btn-secondary"
                style={{ marginTop: 8 }}
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-section" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
          {filtered.map((a, i) => {
            const overdueA = isOverdue(a);
            const dl = a.deadline ? new Date(a.deadline) : null;
            const dlStr = dl
              ? dl.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', ' + dl.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
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
                    borderLeft: `3px solid ${overdueA ? 'rgba(248,113,113,0.70)' : a.status === 'NEEDS_REVISION' ? 'rgba(251,146,60,0.70)' : 'transparent'}`,
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
