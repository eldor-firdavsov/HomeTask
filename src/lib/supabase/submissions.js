import { supabase } from './client.js';
import { transformSubmission } from './transforms.js';

// ── Get submissions for an assignment ────────────────────
export async function getSubmissionsByAssignment(assignmentId) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('version', { ascending: false });
  if (error) throw error;
  return (data || []).map(transformSubmission);
}

// ── Get all submissions (teacher: across all assignments) ─
export async function getTeacherSubmissions() {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(transformSubmission);
}

// ── Get a single submission ──────────────────────────────
export async function getSubmission(submissionId) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', submissionId)
    .single();
  if (error) throw error;
  return transformSubmission(data);
}

// ── Create a submission ──────────────────────────────────
export async function createSubmission({ assignmentId, studentId, textContent, version }) {
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      assignment_id: assignmentId,
      student_id: studentId,
      text_content: textContent,
      version: version || 1,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return transformSubmission(data);
}

// ── Update a submission ──────────────────────────────────
export async function updateSubmission(submissionId, updates) {
  const dbUpdates = {};
  if (updates.textContent !== undefined) dbUpdates.text_content = updates.textContent;

  const { data, error } = await supabase
    .from('submissions')
    .update(dbUpdates)
    .eq('id', submissionId)
    .select()
    .single();
  if (error) throw error;
  return transformSubmission(data);
}

// ── Get submission attachments ───────────────────────────
export async function getSubmissionAttachments(submissionId) {
  const { data, error } = await supabase
    .from('submission_attachments')
    .select('*')
    .eq('submission_id', submissionId)
    .order('created_at');
  if (error) throw error;
  return data || [];
}

// ── Add submission attachment ────────────────────────────
export async function addSubmissionAttachment(submissionId, attachment) {
  const { data, error } = await supabase
    .from('submission_attachments')
    .insert({
      submission_id: submissionId,
      file_name: attachment.fileName,
      storage_path: attachment.storagePath,
      mime_type: attachment.mimeType,
      file_size: attachment.fileSize,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Grade submission (teacher) ───────────────────────────
export async function gradeSubmission({ assignmentId, submissionId, grade, feedback, teacherId }) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('assignments')
    .update({
      status: 'done',
      grade: parseInt(grade, 10),
      feedback: feedback || null,
      reviewed_at: now,
      reviewed_by: teacherId,
    })
    .eq('id', assignmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Request revision (teacher) ───────────────────────────
export async function requestRevision({ assignmentId, submissionId, feedback, teacherId }) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('assignments')
    .update({
      status: 'needs_revision',
      feedback: feedback || null,
      reviewed_at: now,
      reviewed_by: teacherId,
    })
    .eq('id', assignmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

