import React, { useState, useMemo, useEffect } from 'react';
import { useData, useToast } from '../../context/DataContext';
import { Send, Calendar, Search, X, CheckSquare, Square, Users, BookOpen, Clock, AlertCircle, Check } from 'lucide-react';
import { TypeChip } from '../../utils/helpers.jsx';
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

export default function AssignStudentsModal({
  template: initialTemplate = null,
  preselectedStudentId = null,
  onClose,
  onSuccess,
}) {
  const { data, setData, session, profile, refreshData } = useData();
  const toast = useToast();

  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplate?.id || '');
  const [selectedIds, setSelectedIds] = useState(preselectedStudentId ? [preselectedStudentId] : []);
  const [deadline, setDeadline] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Active template
  const activeTemplate = useMemo(() => {
    if (initialTemplate) return initialTemplate;
    return (data.templates || []).find(t => t.id === selectedTemplateId) || null;
  }, [initialTemplate, data.templates, selectedTemplateId]);

  // Set default deadline to tomorrow 23:59 if not already set
  useEffect(() => {
    if (!deadline) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(23, 59, 0, 0);
      const pad = n => String(n).padStart(2, '0');
      setDeadline(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
    }
  }, [deadline]);

  const students = useMemo(() => {
    return (data.users || []).filter(u => u.role === 'STUDENT' && u.isActive !== false);
  }, [data.users]);

  const existingAssignments = useMemo(() => {
    if (!activeTemplate?.id) return [];
    return (data.assignments || []).filter(a => a.templateId === activeTemplate.id && a.status !== 'DONE');
  }, [data.assignments, activeTemplate?.id]);

  const existingAssignedStudentIds = useMemo(() => {
    return new Set(existingAssignments.map(a => a.studentId));
  }, [existingAssignments]);

  const setQuickDeadline = (daysAhead, hours = 23, minutes = 59) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hours, minutes, 0, 0);
    const pad = n => String(n).padStart(2, '0');
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setDeadline(formatted);
  };

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(s =>
      (s.firstName || '').toLowerCase().includes(q) ||
      (s.lastName || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  const filteredTemplates = useMemo(() => {
    const list = data.templates || [];
    if (!templateSearch.trim()) return list;
    const q = templateSearch.toLowerCase();
    return list.filter(t =>
      (t.title || '').toLowerCase().includes(q) ||
      (t.type || '').toLowerCase().includes(q) ||
      (t.instructions || '').toLowerCase().includes(q)
    );
  }, [data.templates, templateSearch]);

  const toggleStudent = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    if (selectedIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map(s => s.id));
    }
  };

  const selectUnassignedOnly = () => {
    const unassigned = filteredStudents
      .filter(s => !existingAssignedStudentIds.has(s.id))
      .map(s => s.id);
    setSelectedIds(unassigned);
  };

  const handleConfirm = async () => {
    if (!activeTemplate) {
      return setErr('Please select a task template to assign.');
    }
    if (!selectedIds.length) {
      return setErr('Please select at least one student.');
    }
    if (!deadline) {
      return setErr('Please choose a deadline for the assignment.');
    }

    setSubmitting(true);
    setErr('');
    try {
      const teacherId = session?.user?.id || profile?.id || activeTemplate.teacherId;
      const assignmentInputs = selectedIds.map(sId => ({
        templateId: activeTemplate.id,
        teacherId,
        studentId: sId,
        title: activeTemplate.title,
        type: activeTemplate.type,
        instructions: activeTemplate.instructions,
        submissionTypes: activeTemplate.submissionTypes || ['Text'],
        attachments: activeTemplate.attachments || [],
        deadline,
      }));

      const created = await createAssignments(assignmentInputs);

      setData(prev => ({
        ...prev,
        assignments: [...(prev.assignments || []), ...created],
      }));

      toast(`Assigned "${activeTemplate.title}" to ${selectedIds.length} student${selectedIds.length === 1 ? '' : 's'}`);
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
        style={{
          padding: '28px 26px',
          maxWidth: 600,
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent-text)',
              }}>
                <Send size={15} />
              </div>
              <h2 style={{ fontSize: 17.5, fontWeight: 700, color: 'var(--txt-primary)', margin: 0 }}>
                Assign Task
              </h2>
            </div>
            <p style={{ fontSize: 12, color: 'var(--txt-secondary)', margin: '4px 0 0' }}>
              {activeTemplate
                ? <>Assign <strong style={{ color: 'var(--txt-primary)' }}>"{activeTemplate.title}"</strong> to students</>
                : 'Choose a template and select students to assign.'
              }
            </p>
          </div>
          <button onClick={onClose} className="g-btn g-btn-ghost" style={{ padding: '6px 8px' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 2, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Template Selection if not fixed */}
          {!initialTemplate && (
            <div style={{
              background: 'rgba(255,255,255,0.38)', border: '1px solid rgba(255,255,255,0.60)',
              borderRadius: 'var(--r-md)', padding: '14px 16px',
            }}>
              <label style={labelStyle}>Select Task Template *</label>
              <select
                style={{ ...inputStyle, marginBottom: selectedTemplateId ? 8 : 0 }}
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
              >
                <option value="">— Choose a template ({data.templates?.length || 0} available) —</option>
                {(data.templates || []).map(t => (
                  <option key={t.id} value={t.id}>
                    [{t.type}] {t.title}
                  </option>
                ))}
              </select>

              {activeTemplate && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginTop: 8,
                  padding: '8px 12px', background: 'rgba(255,255,255,0.50)',
                  borderRadius: 'var(--r-sm)', fontSize: 12,
                }}>
                  <TypeChip type={activeTemplate.type} />
                  <span style={{ color: 'var(--txt-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeTemplate.instructions?.slice(0, 75)}...
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quick Deadline Selector */}
          <div style={{
            background: 'rgba(255,255,255,0.38)', border: '1px solid rgba(255,255,255,0.60)',
            borderRadius: 'var(--r-md)', padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ ...labelStyle, margin: 0 }}>Deadline *</label>
              <span style={{ fontSize: 11, color: 'var(--txt-secondary)' }}>Due at 23:59 default</span>
            </div>

            <input
              type="datetime-local"
              style={{ ...inputStyle, marginBottom: 10 }}
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />

            {/* Quick Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt-tertiary)', marginRight: 2 }}>
                Quick:
              </span>
              {[
                { label: 'Tomorrow', days: 1 },
                { label: '+2 Days', days: 2 },
                { label: '+3 Days', days: 3 },
                { label: '+1 Week', days: 7 },
                { label: '+2 Weeks', days: 14 },
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setQuickDeadline(preset.days)}
                  className="g-btn g-btn-ghost"
                  style={{
                    padding: '3px 9px', fontSize: 11, borderRadius: 'var(--r-sm)',
                    background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.65)'
                  }}
                >
                  <Calendar size={11} style={{ marginRight: 4, opacity: 0.7 }} />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Students Selection Section */}
          <div style={{
            background: 'rgba(255,255,255,0.38)', border: '1px solid rgba(255,255,255,0.60)',
            borderRadius: 'var(--r-md)', padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
              <label style={{ ...labelStyle, margin: 0 }}>
                Students ({selectedIds.length} of {students.length} selected)
              </label>

              <div style={{ display: 'flex', gap: 6 }}>
                {activeTemplate && existingAssignedStudentIds.size > 0 && (
                  <button
                    type="button"
                    onClick={selectUnassignedOnly}
                    className="g-btn g-btn-ghost"
                    style={{ padding: '3px 8px', fontSize: 11 }}
                    title="Select only students who do not have this task currently assigned"
                  >
                    Select unassigned only
                  </button>
                )}
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="g-btn g-btn-ghost"
                  style={{ padding: '3px 8px', fontSize: 11 }}
                >
                  {selectedIds.length === filteredStudents.length && filteredStudents.length > 0
                    ? 'Deselect all'
                    : 'Select all'
                  }
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="g-search-wrap" style={{ marginBottom: 10 }}>
              <span className="g-search-icon"><Search size={13} /></span>
              <input
                className="g-search"
                placeholder="Search students by name or email…"
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                style={{ padding: '7px 10px 7px 30px', fontSize: 12.5 }}
              />
            </div>

            {/* List */}
            <div style={{
              overflowY: 'auto', maxHeight: 180,
              background: 'rgba(255,255,255,0.30)', border: '1px solid rgba(255,255,255,0.55)',
              borderRadius: 'var(--r-sm)', padding: 4,
            }}>
              {filteredStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '18px 12px', fontSize: 12, color: 'var(--txt-secondary)' }}>
                  No students found.
                </div>
              ) : (
                filteredStudents.map(student => {
                  const isSelected = selectedIds.includes(student.id);
                  const isAssigned = existingAssignedStudentIds.has(student.id);
                  const initials = `${student.firstName?.[0] ?? ''}${student.lastName?.[0] ?? ''}`.toUpperCase();

                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
                        borderRadius: 'var(--r-sm)', cursor: 'pointer', transition: 'all 0.12s',
                        background: isSelected ? 'rgba(99,102,241,0.12)' : 'transparent',
                        border: isSelected ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                        marginBottom: 3,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ cursor: 'pointer', accentColor: 'var(--accent-text)', width: 15, height: 15 }}
                      />
                      <div style={{
                        width: 26, height: 26, borderRadius: 7,
                        background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.20)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10.5, fontWeight: 700, color: 'var(--accent-text)', flexShrink: 0
                      }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--txt-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{student.firstName} {student.lastName}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--txt-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {student.email}
                        </div>
                      </div>
                      {isAssigned && (
                        <span style={{
                          fontSize: 10, padding: '2px 7px', borderRadius: 99,
                          background: 'rgba(245,158,11,0.12)', color: '#b45309',
                          border: '1px solid rgba(245,158,11,0.28)', fontWeight: 600, flexShrink: 0
                        }}>
                          Active
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {err && (
          <div style={{
            marginTop: 12, padding: '9px 12px', background: 'var(--clr-overdue)',
            border: '1px solid var(--clr-overdue-bd)', borderRadius: 'var(--r-sm)',
            fontSize: 11.5, color: 'var(--clr-overdue-txt)', display: 'flex', alignItems: 'center', gap: 6
          }}>
            <AlertCircle size={14} />
            <span>{err}</span>
          </div>
        )}

        {/* Footer controls */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 14, marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.45)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--txt-secondary)' }}>
            Selected: <strong style={{ color: 'var(--txt-primary)' }}>{selectedIds.length}</strong> {selectedIds.length === 1 ? 'student' : 'students'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose} className="g-btn g-btn-ghost" disabled={submitting}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="g-btn g-btn-primary"
              disabled={selectedIds.length === 0 || !activeTemplate || submitting}
              style={{
                opacity: selectedIds.length === 0 || !activeTemplate || submitting ? 0.6 : 1,
                padding: '8px 16px', fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 6
              }}
            >
              <Send size={13} />
              {submitting ? 'Assigning…' : `Assign to ${selectedIds.length} Student${selectedIds.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
