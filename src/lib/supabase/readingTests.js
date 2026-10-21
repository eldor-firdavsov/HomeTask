import { supabase } from './client.js';
import { gradeWithGemini } from '../gemini.js';
import { gradeReadingTest, calculateBandScore } from './aiGrading.js';

// ═══════════════════════════════════════════════════════════
// READING TESTS — CRUD
// ═══════════════════════════════════════════════════════════

// ── Get all reading tests for the current teacher ────────
export async function getReadingTests() {
  const { data, error } = await supabase
    .from('reading_tests')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(transformReadingTest);
}

// ── Get a single reading test ────────────────────────────
export async function getReadingTest(testId) {
  const { data, error } = await supabase
    .from('reading_tests')
    .select('*')
    .eq('id', testId)
    .single();
  if (error) throw error;
  return transformReadingTest(data);
}

// ── Create a new reading test ────────────────────────────
export async function createReadingTest({ teacherId, title, passages, timeLimitMins, totalQuestions }) {
  const { data, error } = await supabase
    .from('reading_tests')
    .insert({
      teacher_id: teacherId,
      title,
      passages: passages || [],
      time_limit_mins: timeLimitMins || 60,
      total_questions: totalQuestions || 40,
    })
    .select()
    .single();
  if (error) throw error;
  return transformReadingTest(data);
}

// ── Update a reading test ────────────────────────────────
export async function updateReadingTest(testId, updates) {
  const dbUpdates = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.passages !== undefined) dbUpdates.passages = updates.passages;
  if (updates.timeLimitMins !== undefined) dbUpdates.time_limit_mins = updates.timeLimitMins;
  if (updates.totalQuestions !== undefined) dbUpdates.total_questions = updates.totalQuestions;
  if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived;

  const { data, error } = await supabase
    .from('reading_tests')
    .update(dbUpdates)
    .eq('id', testId)
    .select()
    .single();
  if (error) throw error;
  return transformReadingTest(data);
}

// ── Archive (soft-delete) a reading test ─────────────────
export async function archiveReadingTest(testId) {
  const { error } = await supabase
    .from('reading_tests')
    .update({ is_archived: true })
    .eq('id', testId);
  if (error) throw error;
}

// ── Delete a reading test ────────────────────────────────
export async function deleteReadingTest(testId) {
  const { error } = await supabase
    .from('reading_tests')
    .delete()
    .eq('id', testId);
  if (error) throw error;
}

// ═══════════════════════════════════════════════════════════
// READING TEST ASSIGNMENTS
// ═══════════════════════════════════════════════════════════

// ── Get all assignments for teacher ──────────────────────
export async function getTeacherReadingAssignments() {
  const { data, error } = await supabase
    .from('reading_test_assignments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(transformReadingAssignment);
}

// ── Get assignments for a specific student (teacher view) ─
export async function getStudentReadingAssignments(studentId) {
  const { data, error } = await supabase
    .from('reading_test_assignments')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(transformReadingAssignment);
}

// ── Get my reading assignments (student view) ────────────
export async function getMyReadingAssignments() {
  const { data, error } = await supabase
    .from('reading_test_assignments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(transformReadingAssignment);
}

// ── Assign a reading test to students ────────────────────
export async function assignReadingTest({ readingTestId, teacherId, studentIds, deadline }) {
  const rows = studentIds.map(studentId => ({
    reading_test_id: readingTestId,
    teacher_id: teacherId,
    student_id: studentId,
    deadline: deadline || null,
    status: 'assigned',
  }));

  const { data, error } = await supabase
    .from('reading_test_assignments')
    .insert(rows)
    .select();
  if (error) throw error;
  return (data || []).map(transformReadingAssignment);
}

// ── Update assignment status ─────────────────────────────
export async function updateReadingAssignment(assignmentId, updates) {
  const dbUpdates = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.startedAt !== undefined) dbUpdates.started_at = updates.startedAt;

  const { data, error } = await supabase
    .from('reading_test_assignments')
    .update(dbUpdates)
    .eq('id', assignmentId)
    .select()
    .single();
  if (error) throw error;
  return transformReadingAssignment(data);
}

// ── Delete a reading test assignment ─────────────────────
export async function deleteReadingAssignment(assignmentId) {
  const { error } = await supabase
    .from('reading_test_assignments')
    .delete()
    .eq('id', assignmentId);
  if (error) throw error;
}

// ═══════════════════════════════════════════════════════════
// READING TEST SUBMISSIONS
// ═══════════════════════════════════════════════════════════

// ── Get submission for an assignment ─────────────────────
export async function getReadingSubmission(assignmentId) {
  const { data, error } = await supabase
    .from('reading_test_submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? transformReadingSubmission(data) : null;
}

// ── Get submission by ID ─────────────────────────────────
export async function getReadingSubmissionById(submissionId) {
  // 1. Check local storage cache first for instant retrieval
  try {
    const cached = localStorage.getItem(`hometask_reading_submission_${submissionId}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn('LocalStorage reading submission cache check failed:', e);
  }

  // 2. Query Supabase if ID is a valid UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submissionId);
  if (isUUID) {
    try {
      const { data, error } = await supabase
        .from('reading_test_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();
      if (!error && data) {
        const transformed = transformReadingSubmission(data);
        try {
          localStorage.setItem(`hometask_reading_submission_${submissionId}`, JSON.stringify(transformed));
        } catch (_) {}
        return transformed;
      }
    } catch (err) {
      console.warn('Supabase reading submission lookup error:', err);
    }
  }

  // 3. Fallback to last reading submission in localStorage
  try {
    const lastSub = localStorage.getItem('hometask_last_reading_submission');
    if (lastSub) {
      const parsed = JSON.parse(lastSub);
      if (
        parsed.id === submissionId ||
        !submissionId ||
        submissionId === 'demo' ||
        submissionId === 'practice' ||
        String(submissionId).startsWith('sub_')
      ) {
        return parsed;
      }
    }
  } catch (_) {}

  throw new Error(`Reading submission "${submissionId}" could not be found.`);
}

// ── Get all submissions for teacher's students ───────────
export async function getTeacherReadingSubmissions() {
  const { data, error } = await supabase
    .from('reading_test_submissions')
    .select('*')
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(transformReadingSubmission);
}

// ── Create a submission ──────────────────────────────────
export async function createReadingSubmission({ assignmentId, studentId, answers, timeSpentSecs }) {
  const { data, error } = await supabase
    .from('reading_test_submissions')
    .insert({
      assignment_id: assignmentId,
      student_id: studentId,
      answers: answers || {},
      time_spent_secs: timeSpentSecs || 0,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return transformReadingSubmission(data);
}

// ── Update submission with grading results ───────────────
export async function updateReadingSubmissionGrade(submissionId, gradeData) {
  const { data, error } = await supabase
    .from('reading_test_submissions')
    .update({
      correct_count: gradeData.correctCount,
      total_questions: gradeData.totalQuestions,
      band_score: gradeData.bandScore,
      percentage: gradeData.percentage,
      detailed_results: gradeData.detailedResults,
      ai_feedback: gradeData.aiFeedback,
      graded_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .select()
    .single();
  if (error) throw error;
  return transformReadingSubmission(data);
}

// ── Complete submit and grading flow (Lightning-fast instant grading) ──
export async function gradeAndSubmitReadingTest({ assignmentId, studentId, readingTest, answers, timeSpentSecs }) {
  const passages = readingTest?.passages || [];

  // 1. Instant deterministic rule-based IELTS grading (< 1ms execution)
  // Handles T/F/NG, Y/N/NG, MCQ, Headings, number words, Roman numerals, and typo tolerance
  const gradeData = gradeReadingTest(passages, answers);

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assignmentId);
  let submission = null;

  // 2. Persist to Supabase if assignment is a valid database UUID
  if (isUUID) {
    try {
      const dbSubmission = await createReadingSubmission({
        assignmentId,
        studentId,
        answers,
        timeSpentSecs,
      });

      submission = await updateReadingSubmissionGrade(dbSubmission.id, gradeData);

      // Best effort update assignment status
      updateReadingAssignment(assignmentId, { status: 'graded' }).catch(() => {});
    } catch (dbErr) {
      console.warn('Database submission failed, falling back to local storage cache:', dbErr);
    }
  }

  // 3. Fallback to resilient local record if demo/practice or database offline
  if (!submission) {
    const fallbackId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    submission = {
      id: fallbackId,
      assignmentId: assignmentId || 'demo',
      studentId: studentId || 'demo-student',
      test: readingTest,
      answers: answers || {},
      correctCount: gradeData.correctCount,
      totalQuestions: gradeData.totalQuestions,
      bandScore: gradeData.bandScore,
      percentage: gradeData.percentage,
      detailedResults: gradeData.detailedResults,
      aiFeedback: gradeData.aiFeedback,
      timeSpentSecs: timeSpentSecs || 0,
      submittedAt: new Date().toISOString(),
      gradedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Always cache locally for instantaneous retrieval in results page
  try {
    const recordToCache = { ...submission, test: readingTest };
    localStorage.setItem(`hometask_reading_submission_${submission.id}`, JSON.stringify(recordToCache));
    localStorage.setItem('hometask_last_reading_submission', JSON.stringify(recordToCache));
  } catch (cacheErr) {
    console.warn('Failed to cache reading submission locally:', cacheErr);
  }

  return submission;
}

// ═══════════════════════════════════════════════════════════
// TRANSFORMS
// ═══════════════════════════════════════════════════════════

export function transformReadingTest(dbRow) {
  return {
    id: dbRow.id,
    teacherId: dbRow.teacher_id,
    title: dbRow.title,
    passages: dbRow.passages || [],
    timeLimitMins: dbRow.time_limit_mins,
    totalQuestions: dbRow.total_questions,
    bandScale: dbRow.band_scale,
    isArchived: dbRow.is_archived,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  };
}

export function transformReadingAssignment(dbRow) {
  return {
    id: dbRow.id,
    readingTestId: dbRow.reading_test_id,
    teacherId: dbRow.teacher_id,
    studentId: dbRow.student_id,
    status: dbRow.status,
    deadline: dbRow.deadline,
    assignedAt: dbRow.assigned_at,
    startedAt: dbRow.started_at,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  };
}

export function transformReadingSubmission(dbRow) {
  return {
    id: dbRow.id,
    assignmentId: dbRow.assignment_id,
    studentId: dbRow.student_id,
    answers: dbRow.answers || {},
    correctCount: dbRow.correct_count,
    totalQuestions: dbRow.total_questions,
    bandScore: dbRow.band_score,
    percentage: dbRow.percentage,
    detailedResults: dbRow.detailed_results || [],
    aiFeedback: dbRow.ai_feedback,
    gradedAt: dbRow.graded_at,
    submittedAt: dbRow.submitted_at,
    timeSpentSecs: dbRow.time_spent_secs,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  };
}
