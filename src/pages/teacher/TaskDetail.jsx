import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData, useToast } from '../../context/DataContext';
import {
  ArrowLeft, Edit3, Send, Trash2, Copy, Users, Clock, CheckCircle2,
  AlertCircle, FileText, Check, ChevronRight, Calendar, UserCheck,
  Search, X, Link as LinkIcon, Image as ImageIcon, ExternalLink, Download, Plus, Loader2
} from 'lucide-react';
import {
  TypeChip, StatusBadge, formatDate, formatDateTime,
  isOverdue, gradeColor, uid,
} from '../../utils/helpers.jsx';
import AssignStudentsModal from '../../components/tasks/AssignStudentsModal';
import { updateTaskTemplate, duplicateTaskTemplate, deleteTaskTemplate, getTaskAttachments } from '../../lib/supabase/tasks.js';
import { createAssignments } from '../../lib/supabase/assignments.js';
import { getSignedUrl } from '../../lib/supabase/storage.js';

const TASK_TYPES = ['WRITING','READING','VOCABULARY','GRAMMAR','LISTENING','SPEAKING','KEYWORD','SUMMARY','OTHER'];
const SUB_TYPES = ['Text','Image','File','Audio'];

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/* ── Shared inline styles ──────────────────── */
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

/* ── Edit Task Modal ───────────────────────── */
function EditTaskModal({ template, onClose, onSave }) {
  const toast = useToast();
  const [title,        setTitle]        = useState(template.title || '');
  const [type,         setType]         = useState(template.type || 'WRITING');
  const [instructions, setInstructions] = useState(template.instructions || '');
  const [subTypes,     setSubTypes]     = useState(template.submissionTypes || ['Text']);
  const [attachments,  setAttachments]  = useState(template.attachments || []);
  const [attachType,   setAttachType]   = useState('link'); // 'link' | 'file' | 'image'
  const [linkUrl,      setLinkUrl]      = useState('');
  const [linkTitle,    setLinkTitle]    = useState('');
  const [err,          setErr]          = useState('');

  const toggleSub = (st) => {
    setSubTypes(prev => {
      if (prev.includes(st)) {
        return prev.length > 1 ? prev.filter(s => s !== st) : prev;
      }
      return [...prev, st];
    });
  };

  const handleAddLink = (e) => {
    e?.preventDefault();
    if (!linkUrl.trim()) return;
    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    const newAtt = {
      id: uid('att'),
      type: 'LINK',
      url,
      title: linkTitle.trim() || url,
    };
    setAttachments(prev => [...prev, newAtt]);
    setLinkUrl('');
    setLinkTitle('');
    toast('Link added');
  };

  const handleFileUpload = (e, isImg = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const newAtt = {
        id: uid('att'),
        type: isImg ? 'IMAGE' : 'FILE',
        name: file.name,
        size: formatFileSize(file.size),
        dataUrl: ev.target.result,
      };
      setAttachments(prev => [...prev, newAtt]);
      toast(isImg ? 'Image added' : 'File added');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return setErr('Task title is required.');
    if (!instructions.trim()) return setErr('Instructions are required.');
    if (!subTypes.length) return setErr('At least one submission type is required.');

    onSave({
      ...template,
      title: title.trim(),
      type,
      instructions: instructions.trim(),
      submissionTypes: subTypes,
      attachments: attachments || [],
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="g-overlay" onClick={onClose}>
      <div
        className="glass-4 g-modal"
        onClick={e => e.stopPropagation()}
        style={{ padding: '30px 28px', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt-primary)', margin: 0 }}>
            Edit Task Details
          </h2>
          <button onClick={onClose} className="g-btn g-btn-ghost" style={{ padding: '6px 8px' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Task Title</label>
            <input
              style={inputStyle}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Essay on Climate Change"
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Task Type</label>
            <select
              style={inputStyle}
              value={type}
              onChange={e => setType(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
            >
              {TASK_TYPES.map(t => (
                <option key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Instructions</label>
            <textarea
              style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Provide clear, step-by-step instructions for your students..."
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          {/* Attachments Section in Edit */}
          <div style={{
            background: 'rgba(255,255,255,0.30)', border: '1px solid rgba(255,255,255,0.50)',
            borderRadius: 'var(--r-md)', padding: '14px 16px', marginBottom: 18
          }}>
            <label style={{ ...labelStyle, marginBottom: 6 }}>Task Materials &amp; Resources (Link, File, or Image)</label>

            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {[
                { id: 'link',  label: 'Link', Icon: LinkIcon },
                { id: 'file',  label: 'File', Icon: FileText },
                { id: 'image', label: 'Image', Icon: ImageIcon },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAttachType(id)}
                  className={attachType === id ? 'g-btn g-btn-primary' : 'g-btn g-btn-ghost'}
                  style={{ fontSize: 11.5, padding: '5px 11px' }}
                >
                  <Icon size={13} style={{ marginRight: 4 }} />
                  {label}
                </button>
              ))}
            </div>

            {attachType === 'link' && (
              <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                <input
                  style={inputStyle}
                  placeholder="https://example.com/reading-or-video"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="Link description (optional)"
                    value={linkTitle}
                    onChange={e => setLinkTitle(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddLink}
                    disabled={!linkUrl.trim()}
                    className="g-btn g-btn-secondary"
                    style={{ fontSize: 12, padding: '6px 14px' }}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {attachType === 'file' && (
              <div style={{
                position: 'relative', border: '1px dashed rgba(99,102,241,0.35)',
                borderRadius: 'var(--r-sm)', padding: '14px', textAlign: 'center', cursor: 'pointer'
              }}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.zip,.ppt,.pptx"
                  onChange={e => handleFileUpload(e, false)}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                />
                <span style={{ fontSize: 12, color: 'var(--txt-primary)', fontWeight: 600 }}>Click to attach PDF, Word, or TXT file</span>
              </div>
            )}

            {attachType === 'image' && (
              <div style={{
                position: 'relative', border: '1px dashed rgba(99,102,241,0.35)',
                borderRadius: 'var(--r-sm)', padding: '14px', textAlign: 'center', cursor: 'pointer'
              }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleFileUpload(e, true)}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                />
                <span style={{ fontSize: 12, color: 'var(--txt-primary)', fontWeight: 600 }}>Click to attach an image (PNG, JPG, WebP)</span>
              </div>
            )}

            {attachments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {attachments.map(att => (
                  <div key={att.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
                    background: 'rgba(255,255,255,0.60)', borderRadius: 'var(--r-sm)',
                    border: '1px solid rgba(255,255,255,0.70)'
                  }}>
                    {att.type === 'IMAGE' ? (
                      <img src={att.dataUrl} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }} />
                    ) : att.type === 'FILE' ? (
                      <FileText size={16} color="var(--accent-text)" />
                    ) : (
                      <LinkIcon size={16} color="var(--accent-text)" />
                    )}
                    <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {att.type === 'LINK' ? att.title : att.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="g-btn g-btn-ghost"
                      style={{ padding: '4px 6px', color: 'var(--clr-overdue-txt)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Allowed Submission Types</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SUB_TYPES.map(st => {
                const active = subTypes.includes(st);
                return (
                  <button
                    type="button"
                    key={st}
                    onClick={() => toggleSub(st)}
                    className={active ? 'g-btn g-btn-primary' : 'g-btn g-btn-ghost'}
                    style={{ fontSize: 12, padding: '7px 14px' }}
                  >
                    {active && <Check size={12} style={{ marginRight: 5 }} />}
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {err && (
            <div style={{
              padding: '10px 14px', background: 'var(--clr-overdue)', border: '1px solid var(--clr-overdue-bd)',
              borderRadius: 'var(--r-sm)', fontSize: 12, color: 'var(--clr-overdue-txt)', marginBottom: 18,
            }}>
              {err}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={onClose} className="g-btn g-btn-ghost">
              Cancel
            </button>
            <button type="submit" className="g-btn g-btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Task Detail Page ─────────────────── */
export default function TaskDetail() {
  const { templateId } = useParams();
  const { data, setData, session, profile, refreshData } = useData();
  const navigate = useNavigate();
  const toast = useToast();

  const [showEdit, setShowEdit] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const [templateAttachments, setTemplateAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('all');

  const template = useMemo(() => {
    return (data.templates || []).find(t => t.id === templateId);
  }, [data.templates, templateId]);

  useEffect(() => {
    if (!templateId) return;
    let isMounted = true;
    setLoadingAttachments(true);
    getTaskAttachments(templateId)
      .then(async (atts) => {
        const withUrls = await Promise.all((atts || []).map(async (att) => {
          const type = (att.attachment_type || 'file').toUpperCase();
          let dataUrl = att.url || null;
          if (att.storage_path) {
            try {
              dataUrl = await getSignedUrl('task-attachments', att.storage_path);
            } catch (err) {
              console.warn('Teacher task attachment URL error:', err);
            }
          }
          return {
            id: att.id,
            type,
            name: att.file_name,
            title: att.file_name,
            size: att.file_size ? formatFileSize(att.file_size) : '',
            storagePath: att.storage_path,
            url: att.url || dataUrl,
            dataUrl,
            mimeType: att.mime_type,
          };
        }));
        if (isMounted) setTemplateAttachments(withUrls);
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setLoadingAttachments(false);
      });

    return () => { isMounted = false; };
  }, [templateId]);

  const allAttachments = useMemo(() => {
    if (templateAttachments.length > 0) return templateAttachments;
    return template?.attachments || [];
  }, [templateAttachments, template?.attachments]);

  const students = useMemo(() => {
    return (data.users || []).filter(u => u.role === 'STUDENT');
  }, [data.users]);

  const assignments = useMemo(() => {
    return (data.assignments || []).filter(a => a.templateId === templateId);
  }, [data.assignments, templateId]);

  // Statistics
  const stats = useMemo(() => {
    const total = assignments.length;
    const pending = assignments.filter(a => a.status === 'PENDING').length;
    const inProgress = assignments.filter(a => a.status === 'IN_PROGRESS').length;
    const review = assignments.filter(a => ['SUBMITTED','UNDER_REVIEW'].includes(a.status)).length;
    const done = assignments.filter(a => a.status === 'DONE').length;
    const overdue = assignments.filter(a => isOverdue(a)).length;
    return { total, pending, inProgress, review, done, overdue };
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    let list = assignments;
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      list = list.filter(a => {
        const student = (data.users || []).find(u => u.id === a.studentId);
        return (
          (student?.firstName && student.firstName.toLowerCase().includes(q)) ||
          (student?.lastName && student.lastName.toLowerCase().includes(q)) ||
          (student?.email && student.email.toLowerCase().includes(q))
        );
      });
    }
    if (studentStatusFilter !== 'all') {
      if (studentStatusFilter === 'overdue') {
        list = list.filter(isOverdue);
      } else if (studentStatusFilter === 'review') {
        list = list.filter(a => ['SUBMITTED', 'UNDER_REVIEW'].includes(a.status));
      } else if (studentStatusFilter === 'pending') {
        list = list.filter(a => a.status === 'PENDING');
      } else if (studentStatusFilter === 'in_progress') {
        list = list.filter(a => a.status === 'IN_PROGRESS');
      } else if (studentStatusFilter === 'revision') {
        list = list.filter(a => a.status === 'NEEDS_REVISION');
      } else if (studentStatusFilter === 'done') {
        list = list.filter(a => a.status === 'DONE');
      }
    }
    return list;
  }, [assignments, studentSearch, studentStatusFilter, data.users]);

  if (!template) {
    return (
      <div className="g-page" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div className="glass-section" style={{ maxWidth: 480, margin: '0 auto', padding: '40px 30px' }}>
          <FileText size={36} style={{ color: 'var(--txt-tertiary)', marginBottom: 12 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--txt-primary)', margin: '0 0 8px' }}>
            Task not found
          </h2>
          <p style={{ fontSize: 13, color: 'var(--txt-secondary)', margin: '0 0 20px' }}>
            The requested task template could not be found or may have been deleted.
          </p>
          <Link to="/teacher/tasks" className="g-btn g-btn-primary">
            Back to Task Library
          </Link>
        </div>
      </div>
    );
  }

  /* ── Save edited template ── */
  const handleSaveTemplate = async (updated) => {
    try {
      const saved = await updateTaskTemplate(updated.id, {
        title: updated.title,
        type: updated.type,
        instructions: updated.instructions,
        submissionTypes: updated.submissionTypes,
      });
      setData(prev => ({
        ...prev,
        templates: prev.templates.map(t => t.id === updated.id ? { ...t, ...saved } : t),
      }));
      setShowEdit(false);
      toast('Task template updated successfully');
      if (refreshData) await refreshData();
    } catch (err) {
      console.error('Update template error:', err);
      toast(err.message || 'Failed to update template', 'error');
    }
  };

  /* ── Assign to multiple students ── */
  const handleAssignStudents = async (studentIds, deadline) => {
    try {
      const teacherId = session?.user?.id || profile?.id || template.teacherId;
      const assignmentInputs = studentIds.map(sId => ({
        templateId: template.id,
        teacherId,
        studentId: sId,
        title: template.title,
        type: template.type,
        instructions: template.instructions,
        submissionTypes: template.submissionTypes || ['Text'],
        attachments: allAttachments,
        deadline,
      }));

      const created = await createAssignments(assignmentInputs);
      setData(prev => ({
        ...prev,
        assignments: [...(prev.assignments || []), ...created],
      }));
      setShowAssign(false);
      toast(`Assigned "${template.title}" to ${studentIds.length} student${studentIds.length === 1 ? '' : 's'}`);
      if (refreshData) await refreshData();
    } catch (err) {
      console.error('Assign students error:', err);
      toast(err.message || 'Failed to assign task', 'error');
    }
  };

  /* ── Duplicate template ── */
  const handleDuplicate = async () => {
    try {
      const teacherId = session?.user?.id || profile?.id || template.teacherId;
      const copy = await duplicateTaskTemplate(template.id, teacherId);
      setData(prev => ({
        ...prev,
        templates: [copy, ...(prev.templates || [])],
      }));
      toast('Task duplicated into library');
      if (refreshData) await refreshData();
      navigate(`/teacher/tasks/${copy.id}`);
    } catch (err) {
      console.error('Duplicate error:', err);
      toast(err.message || 'Failed to duplicate task', 'error');
    }
  };

  /* ── Delete template ── */
  const handleDelete = async () => {
    if (assignments.length > 0) {
      toast('Cannot delete: this task is assigned to active students.', 'error');
      return;
    }
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;
    try {
      await deleteTaskTemplate(template.id);
      setData(prev => ({
        ...prev,
        templates: prev.templates.filter(t => t.id !== template.id),
      }));
      toast('Task template deleted');
      if (refreshData) await refreshData();
      navigate('/teacher/tasks');
    } catch (err) {
      console.error('Delete error:', err);
      toast(err.message || 'Failed to delete task template', 'error');
    }
  };

  return (
    <div className="g-page">
      {/* Back button */}
      <Link
        to="/teacher/tasks"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13,
          color: 'var(--txt-secondary)', textDecoration: 'none', marginBottom: 22,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--txt-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--txt-secondary)'}
      >
        <ArrowLeft size={14} /> Back to Tasks
      </Link>

      {/* Main Task Header Glass Panel */}
      <div className="glass-1" style={{ borderRadius: 'var(--r-xl)', padding: '28px 32px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 18 }}>
          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--txt-primary)', margin: 0, letterSpacing: '-0.02em', wordBreak: 'break-word' }}>
                {template.title}
              </h1>
              <TypeChip type={template.type} />
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--txt-secondary)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span>Created {formatDate(template.createdAt)}</span>
              <span>·</span>
              <span>{assignments.length} {assignments.length === 1 ? 'student' : 'students'} currently assigned</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowAssign(true)}
              className="g-btn g-btn-primary"
              style={{ padding: '9px 16px', fontSize: 13 }}
            >
              <UserCheck size={15} /> Assign to Students
            </button>
            <button
              onClick={() => setShowEdit(true)}
              className="g-btn g-btn-secondary"
              style={{ padding: '9px 14px', fontSize: 13 }}
            >
              <Edit3 size={15} /> Edit Task
            </button>
            <button
              onClick={handleDuplicate}
              className="g-btn g-btn-ghost"
              style={{ padding: '9px 11px' }}
              title="Duplicate Task"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={handleDelete}
              className="g-btn g-btn-ghost"
              style={{ padding: '9px 11px', color: 'var(--clr-overdue-txt)' }}
              title="Delete Task"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))',
          gap: 10,
          marginTop: 20,
          paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.45)',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.30)', border: '1px solid rgba(255,255,255,0.50)',
            borderRadius: 'var(--r-md)', padding: '12px 14px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--txt-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 2 }}>
              Assigned
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--txt-primary)' }}>
              {stats.total}
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.30)', border: '1px solid rgba(255,255,255,0.50)',
            borderRadius: 'var(--r-md)', padding: '12px 14px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--txt-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 2 }}>
              Pending
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--txt-secondary)' }}>
              {stats.pending}
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.30)', border: '1px solid rgba(255,255,255,0.50)',
            borderRadius: 'var(--r-md)', padding: '12px 14px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--txt-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 2 }}>
              In Review
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--clr-submitted-txt)' }}>
              {stats.review}
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.30)', border: '1px solid rgba(255,255,255,0.50)',
            borderRadius: 'var(--r-md)', padding: '12px 14px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--txt-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 2 }}>
              Done
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--clr-done-txt)' }}>
              {stats.done}
            </div>
          </div>
          {stats.overdue > 0 && (
            <div style={{
              background: 'rgba(254,242,242,0.50)', border: '1px solid rgba(248,113,113,0.35)',
              borderRadius: 'var(--r-md)', padding: '12px 14px',
            }}>
              <div style={{ fontSize: 11, color: 'var(--clr-overdue-txt)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 2 }}>
                Overdue
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--clr-overdue-txt)' }}>
                {stats.overdue}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Details and Instructions Card */}
      <div className="glass-2" style={{ borderRadius: 'var(--r-xl)', padding: '26px 30px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-secondary)', margin: '0 0 16px' }}>
          Instructions &amp; Details
        </h2>
        <div style={{
          fontSize: 14.5, lineHeight: 1.65, color: 'var(--txt-primary)',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          background: 'rgba(255,255,255,0.35)', padding: '18px 20px',
          borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.55)',
          marginBottom: 20,
        }}>
          {template.instructions || 'No instructions provided.'}
        </div>

        {/* Loading indicator for materials & attachments */}
        {loadingAttachments && (
          <div className="glass-2" style={{ borderRadius: 'var(--r-lg)', padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--txt-secondary)', fontSize: 13 }}>
            <Loader2 size={16} className="animate-spin" />
            <span>Loading materials &amp; attached resources…</span>
          </div>
        )}

        {/* Display Materials & Attachments if any */}
        {!loadingAttachments && allAttachments && allAttachments.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--txt-secondary)', margin: '0 0 12px' }}>
              Materials &amp; Attached Resources ({allAttachments.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              {allAttachments.map(att => (
                <div
                  key={att.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    background: 'rgba(255,255,255,0.40)', border: '1px solid rgba(255,255,255,0.60)',
                    borderRadius: 'var(--r-md)',
                  }}
                >
                  {att.type === 'IMAGE' ? (
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      onClick={() => setZoomImage(att.dataUrl)}
                      style={{
                        width: 44, height: 44, borderRadius: 8, objectFit: 'cover',
                        cursor: 'pointer', border: '1px solid rgba(0,0,0,0.12)'
                      }}
                      title="Click to view full image"
                    />
                  ) : att.type === 'FILE' ? (
                    <div style={{
                      width: 44, height: 44, borderRadius: 8,
                      background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--accent-text)', flexShrink: 0
                    }}>
                      <FileText size={20} />
                    </div>
                  ) : (
                    <div style={{
                      width: 44, height: 44, borderRadius: 8,
                      background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--accent-text)', flexShrink: 0
                    }}>
                      <LinkIcon size={20} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {att.type === 'LINK' ? att.title : att.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--txt-secondary)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <span style={{ textTransform: 'uppercase', fontSize: 9, fontWeight: 700, background: 'rgba(99,102,241,0.10)', color: 'var(--accent-text)', padding: '1px 5px', borderRadius: 4 }}>
                        {att.type}
                      </span>
                      {att.size && <span>{att.size}</span>}
                    </div>
                  </div>

                  {att.type === 'LINK' ? (
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="g-btn g-btn-secondary"
                      style={{ padding: '6px 10px', fontSize: 11.5 }}
                    >
                      <ExternalLink size={12} /> Open
                    </a>
                  ) : att.type === 'FILE' && att.dataUrl ? (
                    <a
                      href={att.dataUrl}
                      download={att.name}
                      className="g-btn g-btn-secondary"
                      style={{ padding: '6px 10px', fontSize: 11.5 }}
                    >
                      <Download size={12} />
                    </a>
                  ) : att.type === 'IMAGE' ? (
                    <button
                      type="button"
                      onClick={() => setZoomImage(att.dataUrl)}
                      className="g-btn g-btn-ghost"
                      style={{ padding: '6px 10px', fontSize: 11.5 }}
                    >
                      View
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 10 }}>
            Accepted Submissions:
          </span>
          <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', verticalAlign: 'middle' }}>
            {(template.submissionTypes || ['Text']).map(st => (
              <span
                key={st}
                style={{
                  fontSize: 12, padding: '4px 10px', borderRadius: 99,
                  background: 'rgba(99,102,241,0.12)', color: 'var(--accent-text)',
                  border: '1px solid rgba(99,102,241,0.22)', fontWeight: 500,
                }}
              >
                {st}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Assigned Students Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--txt-primary)', margin: 0 }}>
            Assigned Students ({assignments.length})
          </h2>
          <p style={{ fontSize: 12.5, color: 'var(--txt-secondary)', margin: '2px 0 0' }}>
            Students working on this task and their current progress
          </p>
        </div>
        <button
          onClick={() => setShowAssign(true)}
          className="g-btn g-btn-secondary"
          style={{ fontSize: 12.5, padding: '7px 14px' }}
        >
          + Assign to More Students
        </button>
      </div>

      {assignments.length > 0 && (
        <div className="glass-2" style={{ borderRadius: 'var(--r-lg)', padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div className="g-tabs" style={{ gap: 4 }}>
              {[
                { id: 'all', label: `All (${assignments.length})` },
                { id: 'pending', label: `Pending (${stats.pending})` },
                { id: 'in_progress', label: `In Progress (${stats.inProgress})` },
                { id: 'review', label: `Review (${stats.review})` },
                { id: 'done', label: `Done (${stats.done})` },
                ...(stats.overdue > 0 ? [{ id: 'overdue', label: `Overdue (${stats.overdue})` }] : []),
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`g-tab${studentStatusFilter === tab.id ? ' active' : ''}`}
                  onClick={() => setStudentStatusFilter(tab.id)}
                  style={{ fontSize: 12, padding: '5px 10px' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div className="g-search-wrap" style={{ minWidth: 180 }}>
                <span className="g-search-icon"><Search size={13} /></span>
                <input
                  className="g-search"
                  placeholder="Filter students…"
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  style={{ padding: '5px 8px 5px 28px', fontSize: 12 }}
                />
              </div>

              {(studentSearch || studentStatusFilter !== 'all') && (
                <button
                  onClick={() => { setStudentSearch(''); setStudentStatusFilter('all'); }}
                  className="g-btn g-btn-ghost"
                  style={{ fontSize: 11.5, padding: '4px 8px', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', gap: 3 }}
                >
                  <X size={12} /> Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="glass-section" style={{ borderRadius: 'var(--r-xl)' }}>
          <div className="g-empty" style={{ padding: '40px 20px' }}>
            <div className="g-empty-icon"><Users size={22} strokeWidth={1.8} /></div>
            <h3>No students assigned yet</h3>
            <p>Assign this task template to one or more of your students with a deadline.</p>
            <button
              onClick={() => setShowAssign(true)}
              className="g-btn g-btn-primary"
              style={{ marginTop: 8 }}
            >
              Assign to Students Now
            </button>
          </div>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="glass-section" style={{ borderRadius: 'var(--r-xl)', padding: '36px 20px', textAlign: 'center' }}>
          <div className="g-empty" style={{ padding: '24px 20px' }}>
            <div className="g-empty-icon"><Users size={20} strokeWidth={1.8} /></div>
            <h4>No students match this filter</h4>
            <p>Try clearing your student search or selecting a different status tab.</p>
            <button
              onClick={() => { setStudentSearch(''); setStudentStatusFilter('all'); }}
              className="g-btn g-btn-secondary"
              style={{ marginTop: 6 }}
            >
              Reset filters
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-section" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
          {filteredAssignments.map((assignment, i) => {
            const student = data.users.find(u => u.id === assignment.studentId);
            const submission = data.submissions.find(s => s.assignedTaskId === assignment.id);
            const overdue = isOverdue(assignment);
            const initials = student ? `${student.firstName?.[0] ?? ''}${student.lastName?.[0] ?? ''}`.toUpperCase() : '??';

            return (
              <div
                key={assignment.id}
                className="glass-row"
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px',
                  borderBottom: i < assignments.length - 1 ? '1px solid rgba(255,255,255,0.40)' : 'none',
                  borderLeft: `3px solid ${overdue ? 'rgba(248,113,113,0.60)' : 'transparent'}`,
                }}
              >
                {/* Student Avatar */}
                <div style={{
                  width: 38, height: 38, borderRadius: 11,
                  background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: 'var(--accent-text)', flexShrink: 0
                }}>
                  {initials}
                </div>

                {/* Student Info & Deadline */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <Link
                      to={student ? `/teacher/students/${student.id}` : '#'}
                      style={{
                        fontSize: 14.5, fontWeight: 600, color: 'var(--txt-primary)',
                        textDecoration: 'none', transition: 'color 0.15s'
                      }}
                      onMouseEnter={e => e.target.style.color = 'var(--accent-text)'}
                      onMouseLeave={e => e.target.style.color = 'var(--txt-primary)'}
                    >
                      {student ? `${student.firstName} ${student.lastName}` : 'Unknown student'}
                    </Link>
                    <span style={{ fontSize: 12, color: 'var(--txt-tertiary)', wordBreak: 'break-all' }}>
                      {student?.email}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: overdue ? 'var(--clr-overdue-txt)' : 'var(--txt-secondary)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span>
                      {assignment.deadline
                        ? (overdue ? 'Overdue · Due ' : 'Due ') + formatDateTime(assignment.deadline)
                        : 'No deadline set'}
                    </span>
                    {typeof assignment.grade === 'number' && (
                      <span style={{ fontWeight: 700, color: gradeColor(assignment.grade) }}>
                        · Grade: {assignment.grade}/100
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Badge & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                  <StatusBadge assignment={assignment} />
                  {submission && ['SUBMITTED', 'UNDER_REVIEW', 'DONE'].includes(assignment.status) && (
                    <Link
                      to={`/teacher/submissions/${submission.id}`}
                      className="g-btn g-btn-primary"
                      style={{ fontSize: 12, padding: '6px 14px' }}
                    >
                      {assignment.status === 'DONE' ? 'View Review' : 'Review'}
                    </Link>
                  )}
                  {student && (
                    <Link
                      to={`/teacher/students/${student.id}`}
                      className="g-btn g-btn-ghost"
                      style={{ padding: '6px 10px', fontSize: 12 }}
                      title="View Student"
                    >
                      <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <EditTaskModal
          template={{ ...template, attachments: allAttachments }}
          onClose={() => setShowEdit(false)}
          onSave={handleSaveTemplate}
        />
      )}

      {/* Assign Modal */}
      {showAssign && (
        <AssignStudentsModal
          template={{ ...template, attachments: allAttachments }}
          students={students}
          existingAssignments={assignments}
          onClose={() => setShowAssign(false)}
          onAssign={handleAssignStudents}
        />
      )}

      {/* Image Zoom Lightbox Modal */}
      {zoomImage && (
        <div className="g-overlay" onClick={() => setZoomImage(null)} style={{ zIndex: 120 }}>
          <div
            className="glass-4"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 720, width: '90%', padding: 12, borderRadius: 'var(--r-lg)',
              display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}
          >
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
              <button onClick={() => setZoomImage(null)} className="g-btn g-btn-ghost" style={{ padding: '6px 8px' }}>
                <X size={18} />
              </button>
            </div>
            <img src={zoomImage} alt="Task material" style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: 8, objectFit: 'contain' }} />
          </div>
        </div>
      )}
    </div>
  );
}
