import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData, useToast } from '../../context/DataContext';
import {
  ArrowLeft, Plus, Link as LinkIcon, FileText, Image as ImageIcon,
  Trash2, X, Upload, ExternalLink, Paperclip, Calendar, Search, Send
} from 'lucide-react';
import { uid } from '../../utils/helpers.jsx';
import { createTaskTemplate, addTaskAttachment } from '../../lib/supabase/tasks.js';
import { createAssignments } from '../../lib/supabase/assignments.js';
import { uploadTaskAttachment } from '../../lib/supabase/storage.js';

const TASK_TYPES = ['WRITING','READING','VOCABULARY','GRAMMAR','LISTENING','SPEAKING','KEYWORD','SUMMARY','OTHER'];
const SUB_TYPES  = ['Text','Image','File','Audio'];

const sectionStyle = (extra = {}) => ({
  borderRadius: 'var(--r-lg)',
  padding: '24px 26px',
  marginBottom: 20,
  ...extra,
});

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function CreateTask() {
  const { data, setData, session, profile, refreshData } = useData();
  const navigate = useNavigate();
  const toast    = useToast();

  const [title,        setTitle]        = useState('');
  const [type,         setType]         = useState('WRITING');
  const [instructions, setInstructions] = useState('');
  const [subTypes,     setSubTypes]     = useState(['Text']);
  const [attachments, setAttachments] = useState([]);
  const [attachType,   setAttachType]   = useState('link'); // 'link' | 'file' | 'image'
  const [linkUrl,      setLinkUrl]      = useState('');
  const [linkTitle,    setLinkTitle]    = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearch,      setStudentSearch]      = useState('');
  const [deadline,     setDeadline]     = useState('');
  const [errors,       setErrors]       = useState({});
  const [busy,         setBusy]         = useState(false);

  const students = (data?.users || []).filter(u => u.role === 'STUDENT');

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(s =>
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  const toggleStudent = (id) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  const setQuickDeadline = (daysAhead) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(23, 59, 0, 0);
    const pad = n => String(n).padStart(2, '0');
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setDeadline(formatted);
  };

  /* ── Focus/blur handlers ── */
  const onFocus = e => {
    e.target.style.borderColor = 'rgba(99,102,241,0.50)';
    e.target.style.boxShadow   = '0 0 0 4px rgba(99,102,241,0.10)';
    e.target.style.background  = 'rgba(255,255,255,0.62)';
  };
  const onBlur  = e => {
    e.target.style.borderColor = 'rgba(255,255,255,0.60)';
    e.target.style.boxShadow   = '0 2px 8px rgba(30,40,100,0.04), inset 0 1px 0 rgba(255,255,255,0.55)';
    e.target.style.background  = 'rgba(255,255,255,0.40)';
  };

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.40)', backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.60)',
    borderRadius: 'var(--r-sm)', padding: '10px 13px', fontSize: 13.5,
    color: 'var(--txt-primary)', fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', transition: 'all 0.15s',
    boxShadow: '0 2px 8px rgba(30,40,100,0.04), inset 0 1px 0 rgba(255,255,255,0.55)',
  };

  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
    textTransform: 'uppercase', color: 'var(--txt-secondary)', marginBottom: 7,
  };

  const validate = (requireAssign) => {
    const e = {};
    if (!title.trim())        e.title        = 'Task title is required.';
    if (!instructions.trim()) e.instructions = 'Instructions are required.';
    if (requireAssign) {
      if (!selectedStudentIds.length) e.students = 'Please select at least one student.';
      if (!deadline)  e.deadline  = 'Please set a deadline.';
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleAddLink = (e) => {
    e?.preventDefault();
    if (!linkUrl.trim()) return;
    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    const newAtt = {
      id: uid('att'),
      type: 'LINK',
      url,
      title: linkTitle.trim() || url,
    };
    setAttachments(prev => [...prev, newAtt]);
    setLinkUrl('');
    setLinkTitle('');
    toast('Link attached');
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
        rawFile: file,
      };
      setAttachments(prev => [...prev, newAtt]);
      toast(isImg ? 'Image attached' : 'File attached');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSave = async () => {
    if (!validate(false) || busy) return;
    setBusy(true);
    try {
      const teacherId = session?.user?.id || profile?.id;
      const tpl = await createTaskTemplate({
        teacherId,
        title: title.trim(),
        type,
        instructions: instructions.trim(),
        submissionTypes: subTypes,
      });

      // Save attachments if any
      for (const att of attachments) {
        if (att.type === 'LINK') {
          await addTaskAttachment(tpl.id, {
            type: 'link',
            fileName: att.title || att.url,
            url: att.url,
            storagePath: '',
          }).catch(console.error);
        } else if (att.rawFile) {
          try {
            const uploaded = await uploadTaskAttachment(teacherId, tpl.id, att.rawFile);
            await addTaskAttachment(tpl.id, {
              type: att.type === 'IMAGE' ? 'image' : 'file',
              fileName: att.name,
              storagePath: uploaded.storagePath,
              mimeType: uploaded.mimeType,
              fileSize: uploaded.fileSize,
            });
          } catch (uploadErr) {
            console.warn('Storage upload note:', uploadErr);
          }
        }
      }

      toast('Task saved to library');
      if (refreshData) await refreshData();
      navigate('/teacher/tasks');
    } catch (err) {
      console.error('Save template error:', err);
      toast(err.message || 'Failed to save task to library', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async () => {
    if (selectedStudentIds.length === 0) {
      return handleSave();
    }
    if (!validate(true) || busy) return;
    setBusy(true);
    try {
      const teacherId = session?.user?.id || profile?.id;
      const tpl = await createTaskTemplate({
        teacherId,
        title: title.trim(),
        type,
        instructions: instructions.trim(),
        submissionTypes: subTypes,
      });

      // Save attachments if any
      for (const att of attachments) {
        if (att.type === 'LINK') {
          await addTaskAttachment(tpl.id, {
            type: 'link',
            fileName: att.title || att.url,
            url: att.url,
            storagePath: '',
          }).catch(console.error);
        } else if (att.rawFile) {
          try {
            const uploaded = await uploadTaskAttachment(teacherId, tpl.id, att.rawFile);
            await addTaskAttachment(tpl.id, {
              type: att.type === 'IMAGE' ? 'image' : 'file',
              fileName: att.name,
              storagePath: uploaded.storagePath,
              mimeType: uploaded.mimeType,
              fileSize: uploaded.fileSize,
            });
          } catch (uploadErr) {
            console.warn('Storage upload note:', uploadErr);
          }
        }
      }

      const assignmentInputs = selectedStudentIds.map(sId => ({
        templateId: tpl.id,
        teacherId,
        studentId: sId,
        title: tpl.title,
        type: tpl.type,
        instructions: tpl.instructions,
        submissionTypes: tpl.submissionTypes,
        attachments,
        deadline,
      }));

      await createAssignments(assignmentInputs);

      toast(`Task created and assigned to ${selectedStudentIds.length} student${selectedStudentIds.length === 1 ? '' : 's'}`);
      if (refreshData) await refreshData();
      navigate('/teacher/dashboard');
    } catch (err) {
      console.error('Create and assign error:', err);
      toast(err.message || 'Failed to create and assign task', 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggleSub = (st) =>
    setSubTypes(prev => prev.includes(st) ? (prev.length > 1 ? prev.filter(s => s !== st) : prev) : [...prev, st]);

  const err = (key) => errors[key] ? (
    <div style={{ fontSize: 11.5, color: 'var(--clr-overdue-txt)', marginTop: 5 }}>{errors[key]}</div>
  ) : null;

  return (
    <div className="g-page" style={{ maxWidth: 620, margin: '0 auto' }}>
      {/* Back */}
      <Link to="/teacher/tasks"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--txt-secondary)', textDecoration: 'none', marginBottom: 24, transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--txt-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--txt-secondary)'}
      >
        <ArrowLeft size={13} /> Tasks
      </Link>

      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--txt-primary)', margin: '0 0 24px', letterSpacing: '-0.02em' }}>
        New task
      </h1>

      {/* Task Info Section */}
      <div className="glass-2" style={sectionStyle()}>
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-secondary)', margin: '0 0 18px' }}>
          Task information
        </h2>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Task title</label>
          <input
            style={inputStyle} value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Unit 7 Vocabulary Quiz"
            onFocus={onFocus} onBlur={onBlur}
          />
          {err('title')}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Task type</label>
          <select style={inputStyle} value={type} onChange={e => setType(e.target.value)} onFocus={onFocus} onBlur={onBlur}>
            {TASK_TYPES.map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Instructions</label>
          <textarea
            style={{ ...inputStyle, minHeight: 110, resize: 'vertical', lineHeight: 1.6 }}
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder="Describe what the student needs to do…"
            onFocus={onFocus} onBlur={onBlur}
          />
          {err('instructions')}
        </div>
      </div>

      {/* ── Materials & Attachments Section ── */}
      <div className="glass-2" style={sectionStyle()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-secondary)', margin: 0 }}>
            Task Materials &amp; Resources
          </h2>
          <span style={{ fontSize: 11, color: 'var(--txt-tertiary)' }}>Optional</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--txt-secondary)', margin: '0 0 16px' }}>
          Attach a web link, document file, or image for students to reference while completing this task.
        </p>

        {/* Attachment type selector tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { id: 'link',  label: 'Web Link', Icon: LinkIcon },
            { id: 'file',  label: 'File / Document', Icon: FileText },
            { id: 'image', label: 'Image', Icon: ImageIcon },
          ].map(({ id, label, Icon }) => {
            const active = attachType === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setAttachType(id)}
                className={active ? 'g-btn g-btn-primary' : 'g-btn g-btn-ghost'}
                style={{ fontSize: 12, padding: '7px 13px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Form per attachment type */}
        {attachType === 'link' && (
          <div style={{
            background: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.55)',
            borderRadius: 'var(--r-md)', padding: '14px 16px', marginBottom: 16
          }}>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Link URL *</label>
              <input
                style={inputStyle}
                placeholder="https://example.com/article-or-video"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Title / Description (optional)</label>
              <input
                style={inputStyle}
                placeholder="e.g. BBC Reading Article or YouTube Practice Video"
                value={linkTitle}
                onChange={e => setLinkTitle(e.target.value)}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>
            <button
              type="button"
              onClick={handleAddLink}
              disabled={!linkUrl.trim()}
              className="g-btn g-btn-secondary"
              style={{ fontSize: 12, padding: '7px 14px', opacity: linkUrl.trim() ? 1 : 0.6 }}
            >
              <Plus size={13} style={{ marginRight: 4 }} /> Attach Link
            </button>
          </div>
        )}

        {attachType === 'file' && (
          <div style={{
            background: 'rgba(255,255,255,0.35)', border: '1px dashed rgba(99,102,241,0.35)',
            borderRadius: 'var(--r-md)', padding: '22px 18px', textAlign: 'center', marginBottom: 16,
            position: 'relative', cursor: 'pointer'
          }}>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.zip,.ppt,.pptx"
              onChange={(e) => handleFileUpload(e, false)}
              style={{
                position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%'
              }}
            />
            <FileText size={28} style={{ color: 'var(--accent)', margin: '0 auto 8px', opacity: 0.8 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-primary)' }}>
              Click to choose a document or file
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-secondary)', marginTop: 4 }}>
              PDF, Word, TXT, PowerPoint, or ZIP files
            </div>
          </div>
        )}

        {attachType === 'image' && (
          <div style={{
            background: 'rgba(255,255,255,0.35)', border: '1px dashed rgba(99,102,241,0.35)',
            borderRadius: 'var(--r-md)', padding: '22px 18px', textAlign: 'center', marginBottom: 16,
            position: 'relative', cursor: 'pointer'
          }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, true)}
              style={{
                position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%'
              }}
            />
            <ImageIcon size={28} style={{ color: 'var(--accent)', margin: '0 auto 8px', opacity: 0.8 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-primary)' }}>
              Click to choose an image of the task
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-secondary)', marginTop: 4 }}>
              PNG, JPG, WebP, or GIF
            </div>
          </div>
        )}

        {/* Current Attachments List */}
        {attachments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            <label style={{ ...labelStyle, marginBottom: 4 }}>Attached Resources ({attachments.length})</label>
            {attachments.map(att => (
              <div
                key={att.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.65)',
                  borderRadius: 'var(--r-sm)',
                }}
              >
                {att.type === 'IMAGE' ? (
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    style={{ width: 38, height: 38, borderRadius: 6, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(0,0,0,0.10)' }}
                  />
                ) : att.type === 'FILE' ? (
                  <div style={{
                    width: 38, height: 38, borderRadius: 6,
                    background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent-text)', flexShrink: 0
                  }}>
                    <FileText size={18} />
                  </div>
                ) : (
                  <div style={{
                    width: 38, height: 38, borderRadius: 6,
                    background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent-text)', flexShrink: 0
                  }}>
                    <LinkIcon size={18} />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {att.type === 'LINK' ? att.title : att.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--txt-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      textTransform: 'uppercase', fontSize: 9.5, fontWeight: 700,
                      background: 'rgba(99,102,241,0.10)', color: 'var(--accent-text)',
                      padding: '1px 5px', borderRadius: 4
                    }}>
                      {att.type}
                    </span>
                    {att.size && <span>{att.size}</span>}
                    {att.url && (
                      <a href={att.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-text)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        Visit <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="g-btn g-btn-ghost"
                  style={{ padding: '6px 8px', color: 'var(--clr-overdue-txt)' }}
                  title="Remove attachment"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submission type section */}
      <div className="glass-2" style={sectionStyle()}>
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-secondary)', margin: '0 0 16px' }}>
          Submission type
        </h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SUB_TYPES.map(st => {
            const active = subTypes.includes(st);
            return (
              <button
                key={st} type="button"
                onClick={() => toggleSub(st)}
                style={{
                  padding: '8px 16px', borderRadius: 'var(--r-pill)', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', border: `1px solid ${active ? 'rgba(99,102,241,0.40)' : 'rgba(255,255,255,0.55)'}`,
                  background: active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.35)',
                  color: active ? 'var(--accent-text)' : 'var(--txt-secondary)',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.15s', fontFamily: 'inherit',
                  boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.40)' : 'none',
                }}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {/* Assignment section */}
      <div className="glass-2" style={sectionStyle()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-secondary)', margin: 0 }}>
            Assign to students
          </h2>
          <span style={{ fontSize: 11, color: 'var(--txt-tertiary)' }}>Optional</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--txt-secondary)', margin: '0 0 16px' }}>
          Select one or several students to assign this task to immediately, or leave unselected to save only into the task library.
        </p>

        {/* Student Selection Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <label style={{ ...labelStyle, margin: 0 }}>
            Select Students ({selectedStudentIds.length} of {students.length} selected)
          </label>
          <button
            type="button"
            onClick={toggleSelectAll}
            className="g-btn g-btn-ghost"
            style={{ padding: '4px 10px', fontSize: 11.5 }}
          >
            {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? 'Deselect all' : 'Select all'}
          </button>
        </div>

        {/* Search student */}
        <div className="g-search-wrap" style={{ marginBottom: 12 }}>
          <span className="g-search-icon"><Search size={13} /></span>
          <input
            className="g-search"
            placeholder="Search students by name or email…"
            value={studentSearch}
            onChange={e => setStudentSearch(e.target.value)}
          />
        </div>

        {/* Student list */}
        <div style={{
          maxHeight: 200, overflowY: 'auto',
          background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.50)',
          borderRadius: 'var(--r-md)', padding: 6, marginBottom: 16
        }}>
          {filteredStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 12px', fontSize: 12.5, color: 'var(--txt-secondary)' }}>
              No students found.
            </div>
          ) : (
            filteredStudents.map(student => {
              const isSelected = selectedStudentIds.includes(student.id);
              const initials = `${student.firstName?.[0] ?? ''}${student.lastName?.[0] ?? ''}`.toUpperCase();

              return (
                <div
                  key={student.id}
                  onClick={() => toggleStudent(student.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
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
                    width: 28, height: 28, borderRadius: 8,
                    background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.20)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10.5, fontWeight: 700, color: 'var(--accent-text)', flexShrink: 0
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
                </div>
              );
            })
          )}
        </div>
        {err('students')}

        {/* Deadline section with quick presets */}
        <div style={{ marginTop: 14 }}>
          <label style={labelStyle}>Deadline</label>
          <input
            type="datetime-local"
            style={{ ...inputStyle, marginBottom: 8 }}
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
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
                style={{ padding: '3px 8px', fontSize: 11, borderRadius: 'var(--r-sm)' }}
              >
                <Calendar size={11} style={{ marginRight: 3 }} />
                {preset.label}
              </button>
            ))}
          </div>
          {err('deadline')}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4, paddingBottom: 32, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => navigate(-1)} className="g-btn g-btn-ghost">Cancel</button>
        {selectedStudentIds.length > 0 && (
          <button type="button" onClick={handleSave} className="g-btn g-btn-secondary" disabled={busy}>
            Save to library only
          </button>
        )}
        <button
          type="button"
          onClick={selectedStudentIds.length > 0 ? handleSend : handleSave}
          className="g-btn g-btn-primary"
          disabled={busy}
        >
          {selectedStudentIds.length > 0 ? (
            <>
              <Send size={13} style={{ marginRight: 6 }} />
              {`Create & assign to ${selectedStudentIds.length} student${selectedStudentIds.length === 1 ? '' : 's'}`}
            </>
          ) : (
            <>
              <Plus size={14} style={{ marginRight: 6 }} />
              Create & save to library
            </>
          )}
        </button>
      </div>
    </div>
  );
}
