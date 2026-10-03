import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData, useToast } from '../../context/DataContext';
import {
  ArrowLeft, CheckCircle2, AlertCircle, Clock, Send,
  Link as LinkIcon, FileText, Image as ImageIcon, ExternalLink, Download, X,
  Paperclip, Upload, Trash2, Loader2, Timer
} from 'lucide-react';
import { TypeChip, StatusBadge, formatDateTime, isOverdue } from '../../utils/helpers.jsx';
import { createSubmission, addSubmissionAttachment, getSubmissionAttachments } from '../../lib/supabase/submissions.js';
import { updateAssignmentStatus, getAssignmentAttachments } from '../../lib/supabase/assignments.js';
import { getTaskAttachments } from '../../lib/supabase/tasks.js';
import { uploadSubmissionFile, getSignedUrl, validateFile, formatFileSize } from '../../lib/supabase/storage.js';

export default function StudentTaskDetail() {
  const { assignmentId } = useParams();
  const { data, session, profile, refreshData } = useData();
  const navigate = useNavigate();
  const toast    = useToast();
  const [zoomImage, setZoomImage] = useState(null);

  const assignment = (data?.assignments || []).find(a => a.id === assignmentId);
  const teacher    = (data?.users || []).find(u => u.role === 'TEACHER');

  const submission = useMemo(() =>
    (data?.submissions || [])
      .filter(s => s.assignedTaskId === assignmentId)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0],
    [data?.submissions, assignmentId]
  );

  const [content, setContent] = useState(submission?.content || '');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [savedAttachments, setSavedAttachments] = useState([]);
  const [taskAttachments, setTaskAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [busy, setBusy] = useState(false);

  // Load reference materials & task attachments provided by teacher
  useEffect(() => {
    if (!assignment) return;
    let isMounted = true;

    async function loadAttachments() {
      setLoadingAttachments(true);
      try {
        const rawAtts = [];

        // 1. Check template attachments
        if (assignment.templateId) {
          try {
            const tplAtts = await getTaskAttachments(assignment.templateId);
            if (tplAtts && tplAtts.length > 0) {
              rawAtts.push(...tplAtts);
            }
          } catch (tplErr) {
            console.warn('Could not fetch template attachments:', tplErr);
          }
        }

        // 2. Check assignment-specific attachments
        if (assignment.id) {
          try {
            const assignAtts = await getAssignmentAttachments(assignment.id);
            if (assignAtts && assignAtts.length > 0) {
              rawAtts.push(...assignAtts);
            }
          } catch (assignErr) {
            console.warn('Could not fetch assignment attachments:', assignErr);
          }
        }

        // 3. Fallback: attachments array directly on assignment object
        if (Array.isArray(assignment.attachments) && assignment.attachments.length > 0) {
          rawAtts.push(...assignment.attachments);
        }

        // Deduplicate attachments
        const seen = new Set();
        const unique = [];
        for (const item of rawAtts) {
          const key = item.id || item.storage_path || item.storagePath || item.url || item.name;
          if (key && !seen.has(key)) {
            seen.add(key);
            unique.push(item);
          }
        }

        // Resolve URLs for files and images
        const resolved = await Promise.all(unique.map(async (att) => {
          const rawType = (att.attachment_type || att.type || 'file').toUpperCase();
          const name = att.file_name || att.name || (rawType === 'LINK' ? (att.title || att.url) : 'Attachment');
          const size = att.file_size ? formatFileSize(att.file_size) : (att.size || '');
          const storagePath = att.storage_path || att.storagePath;

          let dataUrl = att.dataUrl || att.downloadUrl || null;

          if (!dataUrl && storagePath) {
            try {
              dataUrl = await getSignedUrl('task-attachments', storagePath);
            } catch (err) {
              try {
                dataUrl = await getSignedUrl('submission-files', storagePath);
              } catch (err2) {
                console.warn('Error creating signed url for task attachment:', storagePath, err);
              }
            }
          }

          return {
            id: att.id || Math.random().toString(),
            type: rawType,
            name,
            title: att.title || name,
            url: att.url || dataUrl,
            dataUrl: dataUrl || att.url,
            size,
            storagePath,
            mimeType: att.mime_type || att.mimeType,
          };
        }));

        if (isMounted) {
          setTaskAttachments(resolved);
        }
      } catch (err) {
        console.error('Failed to load task attachments:', err);
      } finally {
        if (isMounted) setLoadingAttachments(false);
      }
    }

    loadAttachments();

    return () => {
      isMounted = false;
    };
  }, [assignment?.id, assignment?.templateId]);

  // Load attachments of the previous submission if any
  useEffect(() => {
    if (submission?.id) {
      getSubmissionAttachments(submission.id)
        .then(async (atts) => {
          const withUrls = await Promise.all(atts.map(async (att) => {
            try {
              const url = await getSignedUrl('submission-files', att.storage_path);
              return { ...att, downloadUrl: url };
            } catch (err) {
              return att;
            }
          }));
          setSavedAttachments(withUrls);
        })
        .catch(console.error);
    }
  }, [submission?.id]);

  const onFocus = e => {
    e.target.style.borderColor = 'rgba(99,102,241,0.50)';
    e.target.style.boxShadow   = '0 0 0 4px rgba(99,102,241,0.10)';
    e.target.style.background  = 'rgba(255,255,255,0.62)';
  };
  const onBlur = e => {
    e.target.style.borderColor = 'rgba(255,255,255,0.60)';
    e.target.style.boxShadow   = '0 2px 8px rgba(30,40,100,0.04), inset 0 1px 0 rgba(255,255,255,0.55)';
    e.target.style.background  = 'rgba(255,255,255,0.40)';
  };

  if (!assignment) return (
    <div className="g-page" style={{ textAlign: 'center', padding: 80 }}>
      <p style={{ color: 'var(--txt-secondary)' }}>Task not found.</p>
      <Link to="/student/tasks" className="g-btn g-btn-primary" style={{ marginTop: 16 }}>Back to tasks</Link>
    </div>
  );

  const canSubmit = !['SUBMITTED','UNDER_REVIEW','DONE'].includes(assignment.status);
  const overdueA  = isOverdue(assignment);
  const dlDate    = assignment.deadline ? new Date(assignment.deadline) : null;
  const dlStr     = dlDate ? dlDate.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) + ', ' + dlDate.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : null;

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const f of files) {
      const isImg = f.type.startsWith('image/');
      const validation = validateFile(f, isImg ? 'image' : 'document');
      if (!validation.valid) {
        toast(validation.error, 'error');
        continue;
      }
      setAttachedFiles(prev => [...prev, f]);
    }
    e.target.value = '';
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    setBusy(true);
    try {
      await updateAssignmentStatus(assignmentId, 'IN_PROGRESS');
      toast('Draft saved');
      if (refreshData) await refreshData();
    } catch (err) {
      console.error('Draft error:', err);
      toast(err.message || 'Failed to save draft', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && attachedFiles.length === 0) {
      toast('Your submission cannot be empty. Enter text or attach a file.', 'error');
      return;
    }
    setBusy(true);
    try {
      const studentId = session?.user?.id || profile?.id;
      const nextVersion = (submission?.version || 0) + 1;

      // 1. Create submission record in database
      const newSub = await createSubmission({
        assignmentId,
        studentId,
        textContent: content.trim(),
        version: nextVersion,
      });

      // 2. Upload any attached files to private Supabase Storage
      for (const f of attachedFiles) {
        try {
          const uploaded = await uploadSubmissionFile(studentId, assignmentId, f);
          await addSubmissionAttachment(newSub.id, {
            fileName: f.name,
            storagePath: uploaded.storagePath,
            mimeType: f.type,
            fileSize: f.size,
          });
        } catch (uploadErr) {
          console.error('Error uploading submission attachment:', uploadErr);
        }
      }

      // 3. Transition assignment status to submitted
      await updateAssignmentStatus(assignmentId, 'SUBMITTED');

      toast('Homework turned in successfully!');
      if (refreshData) await refreshData();
      setTimeout(() => navigate('/student/tasks'), 500);
    } catch (err) {
      console.error('Submit error:', err);
      toast(err.message || 'Failed to submit task', 'error');
    } finally {
      setBusy(false);
    }
  };

  const textareaStyle = {
    width: '100%', background: 'rgba(255,255,255,0.40)', backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.60)',
    borderRadius: 'var(--r-md)', padding: '14px 16px', fontSize: 14.5,
    color: 'var(--txt-primary)', fontFamily: 'inherit', outline: 'none',
    resize: 'vertical', lineHeight: 1.65, boxSizing: 'border-box',
    boxShadow: '0 2px 8px rgba(30,40,100,0.04), inset 0 1px 0 rgba(255,255,255,0.55)',
    transition: 'all 0.15s',
    minHeight: 180,
  };

  return (
    <div className="g-page" style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 48 }}>
      {/* Back */}
      <Link to="/student/tasks"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--txt-secondary)', textDecoration: 'none', marginBottom: 24, transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color='var(--txt-primary)'}
        onMouseLeave={e => e.currentTarget.style.color='var(--txt-secondary)'}
      >
        <ArrowLeft size={13} /> My Homework
      </Link>

      {/* Header glass banner */}
      <div className="glass-1" style={{ borderRadius: 'var(--r-xl)', padding: '24px 28px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--txt-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              {assignment.title}
            </h1>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
              <TypeChip type={assignment.type} />
              {teacher && (
                <span style={{ fontSize: 12.5, color: 'var(--txt-secondary)' }}>
                  from {teacher.firstName} {teacher.lastName}
                </span>
              )}
              {dlStr && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 12, fontWeight: 500,
                  color: overdueA ? 'var(--clr-overdue-txt)' : 'var(--txt-secondary)',
                }}>
                  <Clock size={11} />
                  {overdueA ? 'Late — was due ' : 'Due '}{dlStr}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {assignment.status !== 'DONE' && (
              <Link
                to={`/student/pomodoro?taskId=${assignment.id}`}
                className="g-btn g-btn-secondary"
                style={{ padding: '6px 12px', fontSize: 12, gap: 6, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
              >
                <Timer size={14} color="var(--accent-text)" />
                <span>Study Timer</span>
              </Link>
            )}
            <StatusBadge assignment={assignment} />
          </div>
        </div>
      </div>

      {/* Grade & feedback (done) */}
      {assignment.status === 'DONE' && typeof assignment.grade === 'number' && (
        <div className="glass-2" style={{
          borderRadius: 'var(--r-lg)', padding: '20px 24px', marginBottom: 20,
          background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.28)',
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--clr-done-txt)', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--clr-done-txt)', marginBottom: 4 }}>
                Completed · Grade: {assignment.grade}/100
              </div>
              {assignment.feedback && (
                <p style={{ fontSize: 13.5, color: 'var(--txt-primary)', margin: 0, lineHeight: 1.65, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {assignment.feedback}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Revision feedback */}
      {assignment.status === 'NEEDS_REVISION' && assignment.feedback && (
        <div className="glass-2" style={{
          borderRadius: 'var(--r-lg)', padding: '18px 22px', marginBottom: 20,
          background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.30)',
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <AlertCircle size={18} style={{ color: 'var(--clr-revision-txt)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--clr-revision-txt)', marginBottom: 6 }}>
                Teacher asked for changes
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--txt-primary)', margin: 0, lineHeight: 1.65, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {assignment.feedback}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="glass-2" style={{ borderRadius: 'var(--r-lg)', padding: '22px 26px', marginBottom: 20, minWidth: 0, overflow: 'hidden' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-secondary)', marginBottom: 12 }}>
          Homework Instructions
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--txt-primary)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
          {assignment.instructions || 'No instructions provided.'}
        </p>
      </div>

      {/* Loading indicator for materials & attachments */}
      {loadingAttachments && (
        <div className="glass-2" style={{ borderRadius: 'var(--r-lg)', padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--txt-secondary)', fontSize: 13 }}>
          <Loader2 size={16} className="animate-spin" />
          <span>Loading study materials &amp; files…</span>
        </div>
      )}

      {/* Materials & Attachments provided by Teacher */}
      {!loadingAttachments && taskAttachments && taskAttachments.length > 0 && (
        <div className="glass-2" style={{ borderRadius: 'var(--r-lg)', padding: '22px 26px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-secondary)', marginBottom: 14 }}>
            Study Materials &amp; Files ({taskAttachments.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {taskAttachments.map(att => {
              const isImg = att.type === 'IMAGE' || att.mimeType?.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(att.name || '');
              const isLnk = att.type === 'LINK';

              return (
                <div
                  key={att.id}
                  style={{
                    background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.65)',
                    borderRadius: 'var(--r-md)', padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                  }}
                >
                  {isImg ? (
                    <div style={{ width: '100%', marginBottom: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ImageIcon size={16} color="var(--accent-text)" />
                          {att.name || 'Task Image'}
                          {att.size && <span style={{ fontSize: 11, color: 'var(--txt-secondary)', fontWeight: 400 }}>({att.size})</span>}
                        </div>
                        {att.dataUrl && (
                          <a
                            href={att.dataUrl}
                            download={att.name || 'image'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="g-btn g-btn-secondary"
                            style={{ padding: '5px 12px', fontSize: 11.5, textDecoration: 'none' }}
                          >
                            <Download size={12} style={{ marginRight: 4 }} /> Download
                          </a>
                        )}
                      </div>
                      {att.dataUrl ? (
                        <img
                          src={att.dataUrl}
                          alt={att.name || 'Task Material'}
                          onClick={() => setZoomImage(att.dataUrl)}
                          style={{
                            maxWidth: '100%', maxHeight: 340, borderRadius: 10,
                            border: '1px solid rgba(0,0,0,0.10)', cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.06)', objectFit: 'contain'
                          }}
                          title="Click to zoom image"
                        />
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--txt-tertiary)', fontStyle: 'italic' }}>
                          Image preview unavailable
                        </div>
                      )}
                    </div>
                  ) : !isLnk ? (
                    <>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--accent-text)', flexShrink: 0
                      }}>
                        <FileText size={20} />
                      </div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--txt-primary)' }}>
                          {att.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--txt-secondary)', marginTop: 2 }}>
                          Document {att.size ? `· ${att.size}` : ''}
                        </div>
                      </div>
                      {att.dataUrl ? (
                        <a
                          href={att.dataUrl}
                          download={att.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="g-btn g-btn-secondary"
                          style={{ padding: '7px 14px', fontSize: 12, textDecoration: 'none' }}
                        >
                          <Download size={13} style={{ marginRight: 5 }} /> Download
                        </a>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--txt-tertiary)' }}>File attached</span>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--accent-text)', flexShrink: 0
                      }}>
                        <LinkIcon size={20} />
                      </div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--txt-primary)' }}>
                          {att.title || att.url}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--txt-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {att.url}
                        </div>
                      </div>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="g-btn g-btn-secondary"
                        style={{ padding: '7px 14px', fontSize: 12, textDecoration: 'none' }}
                      >
                        <ExternalLink size={13} style={{ marginRight: 5 }} /> Open Link
                      </a>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Already submitted (read-only) */}
      {submission && !canSubmit && assignment.status !== 'NEEDS_REVISION' && (
        <div className="glass-2" style={{ borderRadius: 'var(--r-lg)', padding: '22px 26px', marginBottom: 20, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-secondary)', marginBottom: 12 }}>
            Your submission {submission.version > 1 ? `(Version ${submission.version})` : ''}
          </div>
          {submission.content ? (
            <p style={{
              fontSize: 14.5,
              lineHeight: 1.7,
              color: 'var(--txt-primary)',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere'
            }}>
              {submission.content}
            </p>
          ) : (
            <p style={{ color: 'var(--txt-tertiary)', fontSize: 13, fontStyle: 'italic', margin: 0 }}>No text submitted.</p>
          )}

          {/* Saved attachments */}
          {savedAttachments.length > 0 && (
            <div style={{ marginTop: 18, borderTop: '1px solid rgba(255,255,255,0.40)', paddingTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', marginBottom: 10 }}>
                Attached Files
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {savedAttachments.map(att => (
                  <div key={att.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', background: 'rgba(255,255,255,0.45)', borderRadius: 'var(--r-sm)',
                    border: '1px solid rgba(255,255,255,0.60)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <FileText size={16} color="var(--accent-text)" />
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {att.file_name}
                      </span>
                      {att.file_size && (
                        <span style={{ fontSize: 11, color: 'var(--txt-tertiary)' }}>({formatFileSize(att.file_size)})</span>
                      )}
                    </div>
                    {att.downloadUrl && (
                      <a href={att.downloadUrl} target="_blank" rel="noopener noreferrer" download={att.file_name} className="g-btn g-btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}>
                        <Download size={11} style={{ marginRight: 4 }} /> Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: 11.5, color: 'var(--txt-tertiary)', marginTop: 14 }}>
            Turned in {formatDateTime(submission.submittedAt)} · waiting for teacher to check
          </div>
        </div>
      )}

      {/* Submission area */}
      {canSubmit && (
        <div className="glass-2" style={{ borderRadius: 'var(--r-lg)', padding: '22px 26px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--txt-secondary)', marginBottom: 14 }}>
            {assignment.status === 'NEEDS_REVISION' ? 'Your revised answer' : 'Your answer'}
          </div>
          <textarea
            rows={7}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Type your answer here…"
            style={textareaStyle}
            onFocus={onFocus} onBlur={onBlur}
            disabled={busy}
          />

          {/* Attached Files List */}
          {attachedFiles.length > 0 && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {attachedFiles.map((file, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 12px', background: 'rgba(255,255,255,0.45)', borderRadius: 'var(--r-sm)',
                  border: '1px solid rgba(255,255,255,0.60)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Paperclip size={14} color="var(--accent-text)" />
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--txt-primary)' }}>{file.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--txt-tertiary)' }}>({formatFileSize(file.size)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-tertiary)', padding: 2 }}
                    title="Remove attachment"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, flexWrap: 'wrap', gap: 10 }}>
            <label className="g-btn g-btn-secondary" style={{ cursor: busy ? 'not-allowed' : 'pointer', fontSize: 12, padding: '7px 12px' }}>
              <Paperclip size={13} style={{ marginRight: 6 }} />
              Attach file or image
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                disabled={busy}
              />
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSaveDraft} className="g-btn g-btn-ghost" disabled={busy}>
                Save draft
              </button>
              <button onClick={handleSubmit} className="g-btn g-btn-primary" disabled={busy}>
                <Send size={13} />
                {busy ? 'Turning in…' : assignment.status === 'NEEDS_REVISION' ? 'Turn in again' : 'Turn in homework'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Lightbox */}
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
