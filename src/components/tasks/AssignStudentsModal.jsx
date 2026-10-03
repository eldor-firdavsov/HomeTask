import React, { useState, useMemo } from 'react';
import { useData, useToast } from '../../context/DataContext';
import { Send, Calendar, Search, X, CheckSquare, Square, Users } from 'lucide-react';
import { uid } from '../../utils/helpers.jsx';
import { createAssignments } from '../../lib/supabase/assignments.js';

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.05em', textTransform: 'uppercase',
  color: 'var(--txt-secondary)', marginBottom: 7,
};

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.40)', backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.60)',
  borderRadius: 'var(--r-sm)', padding: '10px 12px', fontSize: 13.5,
  color: 'var(--txt-primary)', fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box', transition: 'all 0.15s',
  boxShadow: '0 2px 8px rgba(30,40,100,0.04), inset 0 1px 0 rgba(255,255,255,0.55)',
};

const handleFocus = e => {
  e.target.style.borderColor = 'rgba(99,102,241,0.50)';
  e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.10)';
  e.target.style.background = 'rgba(255,255,255,0.62)';
};

const handleBlur = e => {
  e.target.style.borderColor = 'rgba(255,255,255,0.60)';
  e.target.style.boxShadow = '0 2px 8px rgba(30,40,100,0.04), inset 0 1px 0 rgba(255,255,255,0.55)';
  e.target.style.background = 'rgba(255,255,255,0.40)';
};

export default function AssignStudentsModal({ template, onClose, onSuccess }) {
  const { data, setData, session, profile, refreshData } = useData();
  const toast = useToast();

  const [selectedIds, setSelectedIds] = useState([]);
  const [deadline,    setDeadline]    = useState('');
  const [search,      setSearch]      = useState('');
  const [err,         setErr]         = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const students = useMemo(() => {
    return (data.users || []).filter(u => u.role === 'STUDENT');
  }, [data.users]);

  const existingAssignments = useMemo(() => {
    return (data.assignments || []).filter(a => a.templateId === template.id);
  }, [data.assignments, template.id]);

  const setQuickDeadline = (daysAhead) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(23, 59, 0, 0);
    const pad = n => String(n).padStart(2, '0');
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setDeadline(formatted);
  };

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(s =>
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q)  ||
      s.email.toLowerCase().includes(q)
    );
  }, [students, search]);

  const toggleStudent = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map(s => s.id));
    }
  };

  const handleConfirm = async () => {
    if (!selectedIds.length) {
      return setErr('Please select at least one student.');
    }
    if (!deadline) {
      return setErr('Please choose a deadline for the assignment.');
    }

    setSubmitting(true);
    setErr('');
    try {
      const assignmentInputs = selectedIds.map(sId => ({
        templateId: template.id,
        teacherId: session?.user?.id || profile?.id || template.teacherId,
        studentId: sId,
        title: template.title,
        type: template.type,
        instructions: template.instructions,
        submissionTypes: template.submissionTypes || ['Text'],
        attachments: template.attachments || [],
        deadline,
      }));

      const created = await createAssignments(assignmentInputs);

      setData(prev => ({
        ...prev,
        assignments: [...(prev.assignments || []), ...created],
      }));

      toast(`Assigned "${template.title}" to ${selectedIds.length} student${selectedIds.length === 1 ? '' : 's'}`);
      if (refreshData) await refreshData();
      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err) {
      console.error('Failed to create assignments:', err);
      setErr(err.message || 'Failed to assign task to students');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="g-overlay" onClick={onClose} style={{ zIndex: 110 }}>
      <div
        className="glass-4 g-modal"
        onClick={e => e.stopPropagation()}
        style={{ padding: '30px 28px', maxWidth: 580, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt-primary)', margin: 0 }}>
              Assign Task to Students
            </h2>
            <p style={{ fontSize: 12, color: 'var(--txt-secondary)', margin: '4px 0 0' }}>
              Assign <strong style={{ color: 'var(--txt-primary)' }}>"{template.title}"</strong> to one or several students simultaneously
            </p>
          </div>
          <button onClick={onClose} className="g-btn g-btn-ghost" style={{ padding: '6px 8px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Deadline picker & quick presets */}
        <div style={{
          background: 'rgba(255,255,255,0.40)', border: '1px solid rgba(255,255,255,0.60)',
          borderRadius: 'var(--r-md)', padding: '16px 18px', marginBottom: 18
        }}>
          <label style={labelStyle}>Assignment Deadline *</label>
          <input
            type="datetime-local"
            style={{ ...inputStyle, marginBottom: 10 }}
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--txt-tertiary)', marginRight: 4 }}>Quick presets:</span>
            {[
              { label: '+1 Day', days: 1 },
              { label: '+3 Days', days: 3 },
              { label: '+1 Week', days: 7 },
              { label: '+2 Weeks', days: 14 },
            ].map(preset => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setQuickDeadline(preset.days)}
                className="g-btn g-btn-ghost"
                style={{ padding: '4px 9px', fontSize: 11, borderRadius: 'var(--r-sm)' }}
              >
                <Calendar size={11} style={{ marginRight: 4 }} />
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Student Selection Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ ...labelStyle, margin: 0 }}>
            Select Students ({selectedIds.length} of {students.length} selected)
          </label>
          <button
            type="button"
            onClick={toggleSelectAll}
            className="g-btn g-btn-ghost"
            style={{ padding: '4px 10px', fontSize: 11.5 }}
          >
            {selectedIds.length === filteredStudents.length && filteredStudents.length > 0 ? 'Deselect all' : 'Select all'}
          </button>
        </div>

        {/* Search student */}
        <div className="g-search-wrap" style={{ marginBottom: 12 }}>
          <span className="g-search-icon"><Search size={13} /></span>
          <input
            className="g-search"
            placeholder="Search students by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Student list */}
        <div style={{
          flex: 1, overflowY: 'auto', maxHeight: 220,
          background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.50)',
          borderRadius: 'var(--r-md)', padding: 6, marginBottom: 18
        }}>
          {filteredStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 12px', fontSize: 12.5, color: 'var(--txt-secondary)' }}>
              No students found.
            </div>
          ) : (
            filteredStudents.map(student => {
              const isSelected = selectedIds.includes(student.id);
              const activeAssign = existingAssignments.find(a => a.studentId === student.id && a.templateId === template.id);
              const initials = `${student.firstName?.[0] ?? ''}${student.lastName?.[0] ?? ''}`.toUpperCase();

              return (
                <div
                  key={student.id}
                  onClick={() => toggleStudent(student.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px',
                    borderRadius: 'var(--r-sm)', cursor: 'pointer', transition: 'all 0.12s',
                    background: isSelected ? 'rgba(99,102,241,0.12)' : 'transparent',
                    border: isSelected ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                    marginBottom: 4,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    style={{ cursor: 'pointer', accentColor: 'var(--accent-text)', width: 16, height: 16 }}
                  />
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.20)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: 'var(--accent-text)', flexShrink: 0
                  }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-primary)' }}>
                      {student.firstName} {student.lastName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--txt-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {student.email}
                    </div>
                  </div>
                  {activeAssign && (
                    <span style={{
                      fontSize: 10, padding: '3px 8px', borderRadius: 99,
                      background: 'rgba(245,158,11,0.14)', color: '#b45309',
                      border: '1px solid rgba(245,158,11,0.30)', fontWeight: 600, flexShrink: 0
                    }}>
                      Assigned ({activeAssign.status.toLowerCase()})
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {err && (
          <div style={{
            padding: '10px 14px', background: 'var(--clr-overdue)', border: '1px solid var(--clr-overdue-bd)',
            borderRadius: 'var(--r-sm)', fontSize: 12, color: 'var(--clr-overdue-txt)', marginBottom: 16,
          }}>
            {err}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
          <div style={{ fontSize: 12, color: 'var(--txt-secondary)' }}>
            Selected: <strong style={{ color: 'var(--txt-primary)' }}>{selectedIds.length}</strong> {selectedIds.length === 1 ? 'student' : 'students'}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} className="g-btn g-btn-ghost">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="g-btn g-btn-primary"
              disabled={selectedIds.length === 0 || submitting}
              style={{ opacity: selectedIds.length === 0 || submitting ? 0.6 : 1 }}
            >
              <Send size={13} />
              {submitting ? 'Assigning…' : `Assign to ${selectedIds.length || 0} ${selectedIds.length === 1 ? 'student' : 'students'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
