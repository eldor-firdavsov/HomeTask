import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData, useToast } from '../../context/DataContext';
import { Search, BookOpen, ChevronRight, Copy, Trash2, UserCheck, X } from 'lucide-react';
import { TypeChip, formatDate } from '../../utils/helpers.jsx';
import AssignStudentsModal from '../../components/tasks/AssignStudentsModal';
import { deleteTaskTemplate, duplicateTaskTemplate } from '../../lib/supabase/tasks.js';

const TYPES = ['All Types', 'Vocabulary', 'Writing', 'Reading', 'Listening', 'Speaking', 'Grammar', 'Keyword', 'Summary', 'Other'];
const STATUS_TABS = [
  { id: 'all', label: 'All Homework' },
  { id: 'assigned', label: 'Given to Students' },
  { id: 'unassigned', label: 'Not Given Yet' },
];

export default function TaskLibrary() {
  const { data, setData, session, profile, refreshData } = useData();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [sortBy, setSortBy] = useState('newest');
  const [assigningTemplate, setAssigningTemplate] = useState(null);

  // Template assignment counts map
  const assignmentCountMap = useMemo(() => {
    const map = {};
    (data.assignments || []).forEach(a => {
      if (a.templateId) {
        map[a.templateId] = (map[a.templateId] || 0) + 1;
      }
    });
    return map;
  }, [data.assignments]);

  // Overall counts for tabs
  const tabCounts = useMemo(() => {
    const templates = data.templates || [];
    let assigned = 0;
    let unassigned = 0;
    templates.forEach(t => {
      if (assignmentCountMap[t.id] > 0) assigned++;
      else unassigned++;
    });
    return { all: templates.length, assigned, unassigned };
  }, [data.templates, assignmentCountMap]);

  // Filter & sort logic
  const filtered = useMemo(() => {
    let list = [...(data.templates || [])];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.instructions || '').toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter === 'assigned') {
      list = list.filter(t => (assignmentCountMap[t.id] || 0) > 0);
    } else if (statusFilter === 'unassigned') {
      list = list.filter(t => !assignmentCountMap[t.id]);
    }

    // Type filter
    if (typeFilter !== 'All Types') {
      list = list.filter(t => t.type?.toUpperCase() === typeFilter.toUpperCase());
    }

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === 'most_assigned') {
        return (assignmentCountMap[b.id] || 0) - (assignmentCountMap[a.id] || 0);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [data.templates, search, statusFilter, typeFilter, sortBy, assignmentCountMap]);

  const hasActiveFilters = search || statusFilter !== 'all' || typeFilter !== 'All Types' || sortBy !== 'newest';

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('All Types');
    setSortBy('newest');
  };

  const handleDelete = async (tplId) => {
    const inUse = data.assignments.some(a => a.templateId === tplId);
    if (inUse) {
      toast('Cannot delete — this template has active assignments.', 'error');
      return;
    }
    if (!confirm('Delete this task template? This cannot be undone.')) return;
    try {
      await deleteTaskTemplate(tplId);
      setData(prev => ({
        ...prev,
        templates: prev.templates.filter(t => t.id !== tplId),
      }));
      toast('Template deleted');
      if (refreshData) await refreshData();
    } catch (err) {
      console.error('Delete template error:', err);
      toast(err.message || 'Failed to delete template', 'error');
    }
  };

  const handleDuplicate = async (tpl) => {
    try {
      const teacherId = session?.user?.id || profile?.id || tpl.teacherId;
      const copy = await duplicateTaskTemplate(tpl.id, teacherId);
      setData(prev => ({
        ...prev,
        templates: [copy, ...(prev.templates || [])],
      }));
      toast('Template duplicated');
      if (refreshData) await refreshData();
    } catch (err) {
      console.error('Duplicate error:', err);
      toast(err.message || 'Failed to duplicate template', 'error');
    }
  };

  return (
    <div className="g-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--txt-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Homework Library
          </h1>
          <p style={{ fontSize: 13, color: 'var(--txt-secondary)', margin: '4px 0 0' }}>
            All your homework assignments. You can give any assignment to your students with one click.
          </p>
        </div>
        <Link to="/teacher/tasks/new" className="g-btn g-btn-primary">
          + Create Homework
        </Link>
      </div>

      {/* Filter Toolbar — Glass container */}
      <div
        className="glass-2"
        style={{ borderRadius: 'var(--r-lg)', padding: '16px 20px', marginBottom: 16 }}
      >
        {/* Top Filter Controls: Status Tabs & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 14 }}>
          {/* Status Tabs with counts */}
          <div className="g-tabs" style={{ gap: 4 }}>
            {STATUS_TABS.map(tab => {
              const count = tabCounts[tab.id] ?? 0;
              return (
                <button
                  key={tab.id}
                  className={`g-tab${statusFilter === tab.id ? ' active' : ''}`}
                  onClick={() => setStatusFilter(tab.id)}
                  style={{ fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    fontSize: 10.5,
                    padding: '1px 6px',
                    borderRadius: 99,
                    background: statusFilter === tab.id ? 'var(--accent)' : 'rgba(0,0,0,0.06)',
                    color: statusFilter === tab.id ? '#fff' : 'var(--txt-secondary)',
                    fontWeight: 600,
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="g-search-wrap" style={{ minWidth: 220 }}>
            <span className="g-search-icon"><Search size={13} /></span>
            <input
              className="g-search"
              placeholder="Search homework by title or topic…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Secondary Filter Controls: Subject Dropdown, Sort Dropdown, Clear button */}
        <div style={{
          display: 'flex',
          gap: 12,
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
              {TYPES.map(t => (
                <option key={t} value={t}>{t === 'All Types' ? 'All Subjects' : t}</option>
              ))}
            </select>
          </div>

          {/* Sort By Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--txt-secondary)' }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="g-select"
              style={{ fontSize: 12.5, padding: '5px 10px' }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most_assigned">Most Assigned</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>

          {/* Result Count and Reset Button */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11.5, color: 'var(--txt-tertiary)' }}>
              Showing {filtered.length} of {(data.templates || []).length} assignments
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="g-btn g-btn-ghost"
                style={{ fontSize: 11.5, padding: '4px 8px', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <X size={12} />
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-section" style={{ borderRadius: 'var(--r-xl)' }}>
          <div className="g-empty" style={{ padding: '48px 20px' }}>
            <div className="g-empty-icon"><BookOpen size={20} strokeWidth={1.8} /></div>
            <h3>{hasActiveFilters ? 'No matching tasks found' : 'No tasks yet'}</h3>
            <p>
              {hasActiveFilters
                ? 'Try adjusting your search query, status tab, or subject type filter.'
                : 'Create your first reusable task template.'}
            </p>
            {hasActiveFilters ? (
              <button onClick={resetFilters} className="g-btn g-btn-secondary" style={{ marginTop: 8 }}>
                Clear filters
              </button>
            ) : (
              <Link to="/teacher/tasks/new" className="g-btn g-btn-primary" style={{ marginTop: 8 }}>
                + New task
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-section" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
          {filtered.map((tpl, i) => {
            const assignedCount = assignmentCountMap[tpl.id] || 0;
            return (
              <div
                key={tpl.id}
                className="glass-row"
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '17px 24px',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.40)' : 'none',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
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
                    {assignedCount > 0 ? (
                      <span className="g-badge g-badge-progress" style={{ fontSize: 10 }}>
                        {assignedCount} active
                      </span>
                    ) : (
                      <span className="g-chip" style={{ fontSize: 10, opacity: 0.7 }}>
                        Draft
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--txt-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 500 }}>
                    {(tpl.instructions || '').slice(0, 100)}{tpl.instructions?.length > 100 ? '…' : ''}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--txt-tertiary)', marginTop: 5 }}>
                    {assignedCount} {assignedCount === 1 ? 'student has this' : 'students have this'} · Created {formatDate(tpl.createdAt)}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => setAssigningTemplate(tpl)}
                    className="g-btn g-btn-primary"
                    style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                    title="Give this homework to students"
                  >
                    <UserCheck size={13} /> Give to students
                  </button>
                  <button
                    onClick={() => handleDuplicate(tpl)}
                    className="g-btn g-btn-ghost"
                    style={{ padding: '7px 9px', fontSize: 12 }}
                    title="Make a copy"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(tpl.id)}
                    className="g-btn g-btn-ghost"
                    style={{ padding: '7px 9px', fontSize: 12, color: 'var(--clr-overdue-txt)' }}
                    title="Delete homework"
                  >
                    <Trash2 size={13} />
                  </button>
                  <Link
                    to={`/teacher/tasks/${tpl.id}`}
                    className="g-btn g-btn-ghost"
                    style={{ padding: '7px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}
                  >
                    Open <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {assigningTemplate && (
        <AssignStudentsModal
          template={assigningTemplate}
          onClose={() => setAssigningTemplate(null)}
        />
      )}
    </div>
  );
}
