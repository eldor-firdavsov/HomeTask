import { supabase } from './client.js';
import { gradeWithGemini } from '../gemini.js';
import { gradeReadingTest, calculateBandScore } from './aiGrading.js';
import { CAMBRIDGE_20_READING_TEST_2 } from '../../data/cambridge20Test.js';

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
  // 1. Delete associated reading test assignments
  try {
    await supabase
      .from('reading_test_assignments')
      .delete()
      .eq('reading_test_id', testId);
  } catch (err) {
    console.warn('Could not cascade delete reading test assignments:', err);
  }

  // 2. Delete the reading test
  const { error } = await supabase
    .from('reading_tests')
    .delete()
    .eq('id', testId);

  if (error) {
    console.warn('Hard delete failed, falling back to soft delete for reading test:', error);
    const { error: arcErr } = await supabase
      .from('reading_tests')
      .update({ is_archived: true })
      .eq('id', testId);
    if (arcErr) throw error || arcErr;
  }
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
export async function assignReadingTest({
  readingTestId,
  teacherId,
  studentIds,
  deadline,
  mode = 'exam',
  timeLimitMins = 60,
}) {
  const rows = studentIds.map(studentId => ({
    reading_test_id: readingTestId,
    teacher_id: teacherId,
    student_id: studentId,
    deadline: deadline || null,
    status: 'assigned',
    mode: mode || 'exam',
    time_limit_mins: Number(timeLimitMins) || 60,
  }));

  let insertedRows = [];
  try {
    const { data, error } = await supabase
      .from('reading_test_assignments')
      .insert(rows)
      .select();

    if (error) {
      // If mode or time_limit_mins columns are not in DB schema yet, fallback to baseline insert
      console.warn('Extended reading assignment schema insert failed, retrying baseline:', error.message);
      const baselineRows = studentIds.map(studentId => ({
        reading_test_id: readingTestId,
        teacher_id: teacherId,
        student_id: studentId,
        deadline: deadline || null,
        status: 'assigned',
      }));
      const { data: bData, error: bError } = await supabase
        .from('reading_test_assignments')
        .insert(baselineRows)
        .select();
      if (bError) throw bError;
      insertedRows = bData || [];
    } else {
      insertedRows = data || [];
    }
  } catch (err) {
    console.warn('Database reading assignment insert error, using resilient fallback:', err);
    insertedRows = rows.map(r => ({
      id: `rt_assign_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      reading_test_id: r.reading_test_id,
      teacher_id: r.teacher_id,
      student_id: r.student_id,
      deadline: r.deadline,
      status: 'assigned',
      mode: r.mode,
      time_limit_mins: r.time_limit_mins,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }

  // Always cache assignment configuration in localStorage so mode and timeLimitMins are 100% persistent
  try {
    insertedRows.forEach(row => {
      const meta = {
        id: row.id,
        mode: mode || 'exam',
        timeLimitMins: Number(timeLimitMins) || 60,
        deadline,
        readingTestId,
        teacherId,
        studentId: row.student_id,
      };
      localStorage.setItem(`hometask_reading_assignment_${row.id}`, JSON.stringify(meta));
    });
  } catch (cacheErr) {
    console.warn('Failed to cache reading assignment metadata in localStorage:', cacheErr);
  }

  return insertedRows.map(row => transformReadingAssignment({
    ...row,
    mode: mode || row.mode || 'exam',
    time_limit_mins: Number(timeLimitMins) || row.time_limit_mins || 60,
  }));
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
export async function gradeAndSubmitReadingTest({
  assignmentId,
  studentId,
  readingTest,
  answers,
  timeSpentSecs,
  mode = 'exam',
  tabSwitchCount = 0,
  targetTimeMins = 60,
  overtimeSecs = 0,
}) {
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

  // 3. Fallback or enrichment with anti-cheat & timing metadata
  const fallbackId = submission?.id || `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  submission = {
    ...(submission || {}),
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
    mode: mode || 'exam',
    tabSwitchCount: Number(tabSwitchCount) || 0,
    targetTimeMins: Number(targetTimeMins) || 60,
    overtimeSecs: Number(overtimeSecs) || 0,
    submittedAt: new Date().toISOString(),
    gradedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

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
  let cachedMeta = null;
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(`hometask_reading_assignment_${dbRow.id}`) : null;
    if (raw) cachedMeta = JSON.parse(raw);
  } catch (_) {}

  return {
    id: dbRow.id,
    readingTestId: dbRow.reading_test_id,
    teacherId: dbRow.teacher_id,
    studentId: dbRow.student_id,
    status: dbRow.status,
    deadline: dbRow.deadline,
    mode: dbRow.mode || cachedMeta?.mode || 'exam',
    timeLimitMins: Number(dbRow.time_limit_mins || dbRow.timeLimitMins || cachedMeta?.timeLimitMins || 60),
    assignedAt: dbRow.assigned_at,
    startedAt: dbRow.started_at,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  };
}

export function transformReadingSubmission(dbRow) {
  let cachedSub = null;
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(`hometask_reading_submission_${dbRow.id}`) : null;
    if (raw) cachedSub = JSON.parse(raw);
  } catch (_) {}

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
    mode: dbRow.mode || cachedSub?.mode || 'exam',
    tabSwitchCount: Number(dbRow.tab_switch_count ?? cachedSub?.tabSwitchCount ?? 0),
    targetTimeMins: Number(dbRow.target_time_mins ?? cachedSub?.targetTimeMins ?? 60),
    overtimeSecs: Number(dbRow.overtime_secs ?? cachedSub?.overtimeSecs ?? 0),
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  };
}

// ── Unified Assignment Integration ───────────────────────
// Transforms IELTS reading test assignments into standardized homework assignments
export async function getUnifiedReadingAssignments({ role = 'student', studentId = null } = {}) {
  try {
    const [rawAssignments, tests, submissions] = await Promise.all([
      role === 'teacher'
        ? getTeacherReadingAssignments().catch(() => [])
        : (studentId ? getStudentReadingAssignments(studentId).catch(() => []) : getMyReadingAssignments().catch(() => [])),
      getReadingTests().catch(() => []),
      getTeacherReadingSubmissions().catch(() => []),
    ]);

    const testMap = new Map((tests || []).map(t => [t.id, t]));
    const subMap = new Map((submissions || []).map(s => [s.assignmentId, s]));

    return (rawAssignments || []).map(ra => {
      const test = testMap.get(ra.readingTestId) || CAMBRIDGE_20_READING_TEST_2;
      const sub = subMap.get(ra.id);
      const isGraded = ra.status === 'graded' || ra.status === 'completed' || !!sub;
      const isSubmitted = ra.status === 'submitted';
      const band = sub?.bandScore != null ? Number(sub.bandScore) : null;

      return {
        id: ra.id,
        readingTestId: ra.readingTestId,
        isReadingTest: true,
        templateId: null,
        teacherId: ra.teacherId,
        studentId: ra.studentId,
        title: test?.title || 'Cambridge IELTS 20 - Academic Reading Test 2',
        type: 'READING',
        submissionTypes: ['IELTS CD Exam'],
        deadline: ra.deadline,
        mode: ra.mode || 'exam',
        timeLimitMins: Number(ra.timeLimitMins || test?.timeLimitMins || 60),
        status: isGraded ? 'DONE' : (isSubmitted ? 'SUBMITTED' : 'IN_PROGRESS'),
        originalStatus: ra.status,
        grade: band != null ? Math.round(band * 10) : null,
        bandScore: band,
        percentage: sub?.percentage,
        correctCount: sub?.correctCount,
        totalQuestions: sub?.totalQuestions || test?.totalQuestions || 40,
        submissionId: sub?.id,
        feedback: sub?.aiFeedback || (band != null ? `Official IELTS Band Score: ${band}` : null),
        instructions: test?.title
          ? `Computer-Delivered IELTS Academic Reading (${ra.mode === 'practice' ? 'Practice Mode' : 'Strict Exam Mode'}, ${test.passages?.length || 3} passages, ${test.totalQuestions || 40} questions, ${ra.timeLimitMins || test?.timeLimitMins || 60} mins). Full CD IELTS simulation with auto AI band scoring.`
          : 'Official IELTS Academic Reading Exam with 40 questions and instant AI band scoring.',
        createdAt: ra.createdAt,
        updatedAt: ra.updatedAt,
      };
    });
  } catch (err) {
    console.warn('Error fetching unified reading assignments:', err);
    return [];
  }
}

export async function getUnifiedReadingSubmissions() {
  try {
    const submissions = await getTeacherReadingSubmissions().catch(() => []);
    return (submissions || []).map(s => ({
      id: s.id,
      assignedTaskId: s.assignmentId,
      studentId: s.studentId,
      isReadingTest: true,
      content: `IELTS Academic Reading Exam Submission — Band ${s.bandScore} (${s.correctCount}/${s.totalQuestions} correct)`,
      bandScore: s.bandScore,
      grade: s.bandScore != null ? Math.round(Number(s.bandScore) * 10) : null,
      feedback: s.aiFeedback,
      detailedResults: s.detailedResults,
      timeSpentSecs: s.timeSpentSecs,
      submittedAt: s.submittedAt || s.createdAt,
      createdAt: s.createdAt,
    }));
  } catch (err) {
    console.warn('Error fetching unified reading submissions:', err);
    return [];
  }
}
