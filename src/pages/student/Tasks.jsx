import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Search, ChevronRight, ClipboardList, Filter, X, ArrowUpDown, Calendar, BookOpen } from 'lucide-react';
import { StatusBadge, TypeChip, isOverdue } from '../../utils/helpers.jsx';
import Breadcrumbs from '../../components/common/Breadcrumbs';

const STATUS_FILTERS = ['All', 'In Progress', 'Submitted', 'Review', 'Done', 'Overdue'];

const STATUS_MAP = {
  'In Progress': 'IN_PROGRESS',
  'Submitted': 'SUBMITTED',
  'Review': 'REVIEW',
  'Done': 'DONE',
};

const TASK_TYPES = ['All Types', 'Vocabulary', 'Writing', 'Reading', 'Listening', 'Speaking', 'Grammar', 'Keyword', 'Summary', 'Other'];

export default function StudentTasks() {
  const { data, session } = useData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [timeframeFilter, setTimeframeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('deadline_asc');

  const mine = useMemo(
    () => (data?.assignments || []).filter(a => a.studentId === session?.user?.id),
    [data?.assignments, session?.user?.id]
  );

  // Status counts for badge indicators
  const statusCounts = useMemo(() => {
    const counts = { All: mine.length, Overdue: 0 };
    STATUS_FILTERS.forEach(f => {
      if (f === 'In Progress') {
        counts[f] = mine.filter(a => ['IN_PROGRESS', 'PENDING'].includes(a.status)).length;
      } else if (f === 'Review') {
        counts[f] = mine.filter(a => ['REVIEW', 'UNDER_REVIEW', 'NEEDS_REVISION'].includes(a.status)).length;
      } else if (f !== 'All' && f !== 'Overdue') {
        counts[f] = mine.filter(a => a.status === STATUS_MAP[f]).length;
      }
    });
    counts.Overdue = mine.filter(isOverdue).length;
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
      if (statusFilter === 'Overdue') {
        list = list.filter(isOverdue);
      } else if (statusFilter === 'In Progress') {
        list = list.filter(a => ['IN_PROGRESS', 'PENDING'].includes(a.status));
      } else if (statusFilter === 'Review') {
        list = list.filter(a => ['REVIEW', 'UNDER_REVIEW', 'NEEDS_REVISION'].includes(a.status));
      } else {
        list = list.filter(a => a.status === STATUS_MAP[statusFilter]);
      }
    }

    // Task Type filter
    if (typeFilter !== 'All Types') {
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

  const hasActiveFilters = search || statusFilter !== 'All' || typeFilter !== 'All Types' || timeframeFilter !== 'all' || sortBy !== 'deadline_asc';

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setTypeFilter('All Types');
    setTimeframeFilter('all');
    setSortBy('deadline_asc');
  };

  return (
    <div className="g-page">
      <Breadcrumbs items={[{ label: 'Home', to: '/student/dashboard' }, { label: 'My Tasks' }]} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="badge-academic" style={{ fontSize: 11, padding: '2px 8px' }}>
              <BookOpen size={11} style={{ marginRight: 4 }} />
              Coursework
            </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.02em' }}>
            My Tasks
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
            {mine.length} {mine.length === 1 ? 'task' : 'tasks'} assigned to you
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className="g-search-wrap" style={{ minWidth: 260 }}>
            <span className="g-search-icon"><Search size={14} /></span>
            <input
              className="g-search"
              placeholder="Search by title or instructions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Filter Toolbar Container */}
      <div className="g-card" style={{ padding: '16px 18px', marginBottom: 20 }}>
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
                  background: statusFilter === f ? 'var(--color-primary)' : 'var(--color-surface-subtle)',
                  color: statusFilter === f ? '#fff' : 'var(--color-text-secondary)',
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
          borderTop: '1px solid var(--color-border)',
          paddingTop: 12,
        }}>
          {/* Subject / Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--txt-secondary)' }}>Type:</span>
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
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--txt-secondary)' }}>Deadline:</span>
            <select
              value={timeframeFilter}
              onChange={e => setTimeframeFilter(e.target.value)}
              className="g-select"
              style={{ fontSize: 12.5, padding: '5px 10px' }}
            >
              <option value="all">All Deadlines</option>
              <option value="today">Due Today</option>
              <option value="tomorrow">Due Tomorrow</option>
              <option value="this_week">Due This Week</option>
              <option value="overdue">Overdue Only</option>
              <option value="no_deadline">No Deadline</option>
            </select>
          </div>

          {/* Sort By */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--txt-secondary)' }}>Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="g-select"
              style={{ fontSize: 12.5, padding: '5px 10px' }}
            >
              <option value="deadline_asc">Deadline (Soonest first)</option>
              <option value="deadline_desc">Deadline (Latest first)</option>
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
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Results Header / Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}>
        <span style={{ fontSize: 12.5, color: 'var(--txt-secondary)', fontWeight: 500 }}>
          Showing <strong>{filtered.length}</strong> of <strong>{mine.length}</strong> tasks
        </span>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="g-card" style={{ padding: '48px 20px', textAlign: 'center' }}>
          <div className="g-empty" style={{ padding: 0 }}>
            <div className="g-empty-icon" style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
              <ClipboardList size={22} strokeWidth={1.8} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginTop: 12 }}>
              {hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', maxWidth: 380, margin: '6px auto 16px' }}>
              {hasActiveFilters
                ? 'Try adjusting your status, subject type, or deadline filter criteria.'
                : "Your teacher hasn't assigned any tasks yet."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="g-btn g-btn-secondary"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="g-card" style={{ padding: 0, overflow: 'hidden' }}>
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
                    display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border)' : 'none',
                    borderLeft: `3px solid ${overdueA ? 'var(--color-danger)' : ['REVIEW', 'NEEDS_REVISION'].includes(a.status) ? 'var(--color-warning)' : 'transparent'}`,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--color-text)' }}>{a.title}</span>
                      <TypeChip type={a.type} />
                    </div>
                    <div style={{ fontSize: 12, color: overdueA ? 'var(--color-danger)' : 'var(--color-text-secondary)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {dlStr
                        ? <span>{overdueA ? '⚠ Overdue · was due ' : 'Due '}{dlStr}</span>
                        : <span>No deadline set</span>
                      }
                      {typeof a.grade === 'number' && (
                        <span style={{ fontWeight: 700, color: 'var(--color-success)', marginLeft: 4 }}>· Grade: {a.grade}/100</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <StatusBadge assignment={a} />
                    <ChevronRight size={14} style={{ color: 'var(--color-text-tertiary)' }} />
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
