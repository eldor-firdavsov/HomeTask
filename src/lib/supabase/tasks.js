import { supabase } from './client.js';
import { TYPE_UI_TO_DB, transformTemplate } from './transforms.js';

// ── Get all templates for the current teacher ────────────
export async function getTaskTemplates() {
  const { data, error } = await supabase
    .from('task_templates')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(transformTemplate);
}

// ── Get a single template ────────────────────────────────
export async function getTaskTemplate(templateId) {
  const { data, error } = await supabase
    .from('task_templates')
    .select('*')
    .eq('id', templateId)
    .single();
  if (error) throw error;
  return transformTemplate(data);
}

// ── Create a new task template ───────────────────────────
export async function createTaskTemplate({ teacherId, title, type, instructions, submissionTypes }) {
  const { data, error } = await supabase
    .from('task_templates')
    .insert({
      teacher_id: teacherId,
      title,
      type: TYPE_UI_TO_DB[type] || type.toLowerCase(),
      instructions,
      submission_types: submissionTypes,
    })
    .select()
    .single();
  if (error) throw error;
  return transformTemplate(data);
}

// ── Update a task template ───────────────────────────────
export async function updateTaskTemplate(templateId, updates) {
  const dbUpdates = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.type !== undefined) dbUpdates.type = TYPE_UI_TO_DB[updates.type] || updates.type.toLowerCase();
  if (updates.instructions !== undefined) dbUpdates.instructions = updates.instructions;
  if (updates.submissionTypes !== undefined) dbUpdates.submission_types = updates.submissionTypes;

  const { data, error } = await supabase
    .from('task_templates')
    .update(dbUpdates)
    .eq('id', templateId)
    .select()
    .single();
  if (error) throw error;
  return transformTemplate(data);
}

// ── Soft-delete a task template ──────────────────────────
export async function deleteTaskTemplate(templateId) {
  const { error } = await supabase
    .from('task_templates')
    .update({ is_archived: true })
    .eq('id', templateId);
  if (error) throw error;
}

// ── Hard-delete a task template (only if no assignments) ─
export async function hardDeleteTaskTemplate(templateId) {
  const { error } = await supabase
    .from('task_templates')
    .delete()
    .eq('id', templateId);
  if (error) throw error;
}

// ── Duplicate a task template ────────────────────────────
export async function duplicateTaskTemplate(templateId, teacherId) {
  const original = await getTaskTemplate(templateId);
  return createTaskTemplate({
    teacherId,
    title: `${original.title} (copy)`,
    type: original.type,
    instructions: original.instructions,
    submissionTypes: original.submissionTypes,
  });
}

// ── Get task attachments ─────────────────────────────────
export async function getTaskAttachments(templateId) {
  const { data, error } = await supabase
    .from('task_attachments')
    .select('*')
    .eq('task_template_id', templateId)
    .order('created_at');
  if (error) throw error;
  return data || [];
}

// ── Add task attachment ──────────────────────────────────
export async function addTaskAttachment(templateId, attachment) {
  const { data, error } = await supabase
    .from('task_attachments')
    .insert({
      task_template_id: templateId,
      file_name: attachment.fileName,
      storage_path: attachment.storagePath,
      mime_type: attachment.mimeType,
      file_size: attachment.fileSize,
      attachment_type: attachment.type,
      url: attachment.url,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Delete task attachment ───────────────────────────────
export async function deleteTaskAttachment(attachmentId) {
  const { error } = await supabase
    .from('task_attachments')
    .delete()
    .eq('id', attachmentId);
  if (error) throw error;
}
