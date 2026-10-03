import { supabase } from './client.js';
import { TYPE_UI_TO_DB, STATUS_UI_TO_DB, transformAssignment } from './transforms.js';

// ── Get assignments for teacher ──────────────────────────
export async function getTeacherAssignments() {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(transformAssignment);
}

// ── Get assignments for a specific student (teacher view) ─
export async function getStudentAssignments(studentId) {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('student_id', studentId)
    .order('deadline', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data || []).map(transformAssignment);
}

// ── Get assignments for the logged-in student ────────────
export async function getMyAssignments() {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .order('deadline', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data || []).map(transformAssignment);
}

// ── Get a single assignment ──────────────────────────────
export async function getAssignment(assignmentId) {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .single();
  if (error) throw error;
  return transformAssignment(data);
}

// ── Create assignment(s) ─────────────────────────────────
export async function createAssignments(assignments) {
  const dbRows = assignments.map(a => ({
    task_template_id: a.templateId || null,
    teacher_id: a.teacherId,
    student_id: a.studentId,
    title: a.title,
    type: TYPE_UI_TO_DB[a.type] || a.type?.toLowerCase() || 'other',
    instructions: a.instructions,
    submission_types: a.submissionTypes || ['Text'],
    deadline: a.deadline || null,
    status: 'not_started',
  }));

  const { data, error } = await supabase
    .from('assignments')
    .insert(dbRows)
    .select();
  if (error) throw error;
  return (data || []).map(transformAssignment);
}

// ── Update assignment (teacher) ──────────────────────────
export async function updateAssignment(assignmentId, updates) {
  const dbUpdates = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.instructions !== undefined) dbUpdates.instructions = updates.instructions;
  if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
  if (updates.status !== undefined) dbUpdates.status = STATUS_UI_TO_DB[updates.status] || updates.status;
  if (updates.grade !== undefined) dbUpdates.grade = updates.grade;
  if (updates.feedback !== undefined) dbUpdates.feedback = updates.feedback;
  if (updates.reviewedAt !== undefined) dbUpdates.reviewed_at = updates.reviewedAt;
  if (updates.reviewedBy !== undefined) dbUpdates.reviewed_by = updates.reviewedBy;

  const { data, error } = await supabase
    .from('assignments')
    .update(dbUpdates)
    .eq('id', assignmentId)
    .select()
    .single();
  if (error) throw error;
  return transformAssignment(data);
}

// ── Update assignment status (student) ───────────────────
export async function updateAssignmentStatus(assignmentId, status) {
  const { data, error } = await supabase
    .from('assignments')
    .update({ status: STATUS_UI_TO_DB[status] || status })
    .eq('id', assignmentId)
    .select()
    .single();
  if (error) throw error;
  return transformAssignment(data);
}

// ── Delete assignment ────────────────────────────────────
export async function deleteAssignment(assignmentId) {
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', assignmentId);
  if (error) throw error;
}

// ── Get assignment attachments ───────────────────────────
export async function getAssignmentAttachments(assignmentId) {
  const { data, error } = await supabase
    .from('assignment_attachments')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('created_at');
  if (error) throw error;
  return data || [];
}

// ── Add assignment attachment ────────────────────────────
export async function addAssignmentAttachment(assignmentId, attachment) {
  const { data, error } = await supabase
    .from('assignment_attachments')
    .insert({
      assignment_id: assignmentId,
      file_name: attachment.fileName,
      storage_path: attachment.storagePath,
      mime_type: attachment.mimeType,
      file_size: attachment.fileSize,
      attachment_type: attachment.type || 'file',
      url: attachment.url,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
