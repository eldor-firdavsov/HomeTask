import { supabase } from './client.js';

// ── File size limits (bytes) ─────────────────────────────
export const FILE_LIMITS = {
  image: 10 * 1024 * 1024,    // 10MB
  document: 20 * 1024 * 1024, // 20MB
  audio: 30 * 1024 * 1024,    // 30MB
};

// ── Allowed MIME types ───────────────────────────────────
export const ALLOWED_TYPES = {
  image: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4'],
};

// ── Validate a file before upload ────────────────────────
export function validateFile(file, category = 'document') {
  const limit = FILE_LIMITS[category] || FILE_LIMITS.document;
  const allowed = ALLOWED_TYPES[category] || ALLOWED_TYPES.document;

  if (file.size > limit) {
    const limitMB = Math.round(limit / (1024 * 1024));
    return { valid: false, error: `File too large. Maximum size is ${limitMB}MB.` };
  }

  if (allowed.length > 0 && !allowed.includes(file.type)) {
    return { valid: false, error: `File type "${file.type}" is not supported.` };
  }

  return { valid: true, error: null };
}

// ── Format file size for display ─────────────────────────
export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ── Upload a file to Supabase Storage ────────────────────
export async function uploadFile(bucket, path, file) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
  if (error) throw error;
  return data;
}

// ── Get a signed URL for a private file ──────────────────
export async function getSignedUrl(bucket, path, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

// ── Delete a file from storage ───────────────────────────
export async function deleteFile(bucket, path) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);
  if (error) throw error;
}

// ── Upload a task attachment ─────────────────────────────
export async function uploadTaskAttachment(teacherId, templateId, file) {
  const ext = file.name.split('.').pop();
  const path = `${teacherId}/${templateId}/${Date.now()}_${file.name}`;
  await uploadFile('task-attachments', path, file);
  return {
    storagePath: path,
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size,
  };
}

// ── Upload a submission file ─────────────────────────────
export async function uploadSubmissionFile(studentId, assignmentId, file) {
  const path = `${studentId}/${assignmentId}/${Date.now()}_${file.name}`;
  await uploadFile('submission-files', path, file);
  return {
    storagePath: path,
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size,
  };
}

// ── Get URL for a task attachment ────────────────────────
export async function getTaskAttachmentUrl(storagePath) {
  return getSignedUrl('task-attachments', storagePath);
}

// ── Get URL for a submission file ────────────────────────
export async function getSubmissionFileUrl(storagePath) {
  return getSignedUrl('submission-files', storagePath);
}
