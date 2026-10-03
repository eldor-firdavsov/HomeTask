import { supabase } from './client.js';

// ── Status mapping: DB enum → UI label ───────────────────
export const STATUS_DB_TO_UI = {
  'not_started': 'PENDING',
  'in_progress': 'IN_PROGRESS',
  'submitted': 'SUBMITTED',
  'under_review': 'UNDER_REVIEW',
  'needs_revision': 'NEEDS_REVISION',
  'done': 'DONE',
};

export const STATUS_UI_TO_DB = {
  'PENDING': 'not_started',
  'IN_PROGRESS': 'in_progress',
  'SUBMITTED': 'submitted',
  'UNDER_REVIEW': 'under_review',
  'NEEDS_REVISION': 'needs_revision',
  'DONE': 'done',
};

// ── Type mapping: DB enum → UI label ─────────────────────
export const TYPE_DB_TO_UI = {
  'keyword': 'KEYWORD',
  'summary': 'SUMMARY',
  'vocabulary': 'VOCABULARY',
  'writing': 'WRITING',
  'reading': 'READING',
  'listening': 'LISTENING',
  'speaking': 'SPEAKING',
  'grammar': 'GRAMMAR',
  'other': 'OTHER',
};

export const TYPE_UI_TO_DB = {
  'KEYWORD': 'keyword',
  'SUMMARY': 'summary',
  'VOCABULARY': 'vocabulary',
  'WRITING': 'writing',
  'READING': 'reading',
  'LISTENING': 'listening',
  'SPEAKING': 'speaking',
  'GRAMMAR': 'grammar',
  'OTHER': 'other',
};

// ── Transform DB assignment to UI format ─────────────────
export function transformAssignment(dbRow) {
  return {
    id: dbRow.id,
    templateId: dbRow.task_template_id,
    teacherId: dbRow.teacher_id,
    studentId: dbRow.student_id,
    title: dbRow.title,
    type: TYPE_DB_TO_UI[dbRow.type] || dbRow.type?.toUpperCase(),
    instructions: dbRow.instructions,
    submissionTypes: dbRow.submission_types || ['Text'],
    deadline: dbRow.deadline,
    status: STATUS_DB_TO_UI[dbRow.status] || dbRow.status?.toUpperCase(),
    grade: dbRow.grade,
    feedback: dbRow.feedback,
    reviewedAt: dbRow.reviewed_at,
    reviewedBy: dbRow.reviewed_by,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  };
}

// ── Transform DB template to UI format ───────────────────
export function transformTemplate(dbRow) {
  return {
    id: dbRow.id,
    teacherId: dbRow.teacher_id,
    title: dbRow.title,
    type: TYPE_DB_TO_UI[dbRow.type] || dbRow.type?.toUpperCase(),
    instructions: dbRow.instructions,
    submissionTypes: dbRow.submission_types || ['Text'],
    isArchived: dbRow.is_archived,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  };
}

// ── Transform DB submission to UI format ─────────────────
export function transformSubmission(dbRow) {
  return {
    id: dbRow.id,
    assignedTaskId: dbRow.assignment_id,
    studentId: dbRow.student_id,
    content: dbRow.text_content,
    version: dbRow.version,
    submittedAt: dbRow.submitted_at,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  };
}

// ── Transform DB profile to UI format ────────────────────
export function transformProfile(dbRow) {
  return {
    id: dbRow.id,
    firstName: dbRow.first_name,
    lastName: dbRow.last_name,
    email: dbRow.email,
    role: dbRow.role === 'teacher' ? 'TEACHER' : 'STUDENT',
    teacherId: dbRow.teacher_id,
    isActive: dbRow.is_active,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  };
}
