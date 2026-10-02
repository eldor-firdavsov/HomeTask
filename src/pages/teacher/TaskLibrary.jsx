import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData, useToast } from '../../context/DataContext';
import { Search, BookOpen, ChevronRight, Copy, Trash2, UserCheck } from 'lucide-react';
import { TypeChip, formatDate, uid } from '../../utils/helpers.jsx';
import AssignStudentsModal from '../../components/tasks/AssignStudentsModal';

const TYPES = ['All','Vocabulary','Writing','Reading','Listening','Speaking','Grammar','Keyword','Summary','Other'];

export default function TaskLibrary() {
  const { data, setData } = useData();
  const toast = useToast();
  const [search,            setSearch]            = useState('');
  const [activeType,        setActiveType]        = useState('All');
  const [assigningTemplate, setAssigningTemplate] = useState(null);

  const filtered = useMemo(() => {
    let list = [...(data.templates || [])];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.instructions || '').toLowerCase().includes(q)
      );
    }
    if (activeType !== 'All') {
      list = list.filter(t => t.type?.toUpperCase() === activeType.toUpperCase());
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [data.templates, search, activeType]);

  const handleDelete = (tplId) => {
    const inUse = data.assignments.some(a => a.templateId === tplId);
    if (inUse) {
      toast('Cannot delete — this template has active assignments.', 'error');
      return;
    }
    if (!confirm('Delete this task template? This cannot be undone.')) return;
    setData({ ...data, templates: data.templates.filter(t => t.id !== tplId) });
    toast('Template deleted');
  };

  const handleDuplicate = (tpl) => {
    const copy = { ...tpl, id: uid('tpl'), title: `${tpl.title} (copy)`, createdAt: new Date().toISOString() };
    setData({ ...data, templates: [...data.templates, copy] });
    toast('Template duplicated');
  };

  return (
    <div className="g-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--txt-primary)', margin: 0, letterSpacing: '-0.02em' }}>Tasks</h1>
          <p style={{ fontSize: 13, color: 'var(--txt-secondary)', margin: '4px 0 0' }}>Reusable task templates for your students</p>
        </div>
        <Link to="/teacher/tasks/new" className="g-btn g-btn-primary">+ New task</Link>
      </div>

      {/* Toolbar — glass container */}
      <div
        className="glass-2"
        style={{ borderRadius: 'var(--r-lg)', padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <div className="g-search-wrap">
          <span className="g-search-icon"><Search size={13} /></span>
          <input
            className="g-search"
            placeholder="Search tasks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="g-tabs" style={{ flex: 1 }}>
          {TYPES.map(t => (
            <button
              key={t}
              className={`g-tab${activeType === t ? ' active' : ''}`}
              onClick={() => setActiveType(t)}
              style={{ padding: '6px 11px', fontSize: 12 }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-section" style={{ borderRadius: 'var(--r-xl)' }}>
          <div className="g-empty">
            <div className="g-empty-icon"><BookOpen size={20} strokeWidth={1.8} /></div>
            <h3>{search || activeType !== 'All' ? 'No matching tasks' : 'No tasks yet'}</h3>
            <p>{search || activeType !== 'All' ? 'Try adjusting your search or filter.' : 'Create your first reusable task template.'}</p>
            {!search && activeType === 'All' && (
              <Link to="/teacher/tasks/new" className="g-btn g-btn-primary">+ New task</Link>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-section" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
          {filtered.map((tpl, i) => {
            const assignedCount = data.assignments.filter(a => a.templateId === tpl.id).length;
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
                  <div style={{ fontSize: 11, color: 'var(--txt-tertiary)', marginTop: 5 }}>
                    {assignedCount} {assignedCount === 1 ? 'student' : 'students'} assigned · Updated {formatDate(tpl.createdAt)}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => setAssigningTemplate(tpl)}
                    className="g-btn g-btn-primary"
                    style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                    title="Assign to one or several students"
                  >
                    <UserCheck size={13} /> Assign
                  </button>
                  <button
                    onClick={() => handleDuplicate(tpl)}
                    className="g-btn g-btn-ghost"
                    style={{ padding: '7px 9px', fontSize: 12 }}
                    title="Duplicate"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(tpl.id)}
                    className="g-btn g-btn-ghost"
                    style={{ padding: '7px 9px', fontSize: 12, color: 'var(--clr-overdue-txt)' }}
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                  <Link
                    to={`/teacher/tasks/${tpl.id}`}
                    className="g-btn g-btn-ghost"
                    style={{ padding: '7px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}
                  >
                    View <ChevronRight size={12} />
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
