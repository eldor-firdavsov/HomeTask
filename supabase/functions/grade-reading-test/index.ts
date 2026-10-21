import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Academic Reading Band scale (40 questions)
const BAND_SCALE_40 = [
  { min: 39, max: 40, band: 9.0 },
  { min: 37, max: 38, band: 8.5 },
  { min: 35, max: 36, band: 8.0 },
  { min: 33, max: 34, band: 7.5 },
  { min: 30, max: 32, band: 7.0 },
  { min: 27, max: 29, band: 6.5 },
  { min: 23, max: 26, band: 6.0 },
  { min: 19, max: 22, band: 5.5 },
  { min: 15, max: 18, band: 5.0 },
  { min: 13, max: 14, band: 4.5 },
  { min: 10, max: 12, band: 4.0 },
  { min: 6, max: 9, band: 3.5 },
  { min: 4, max: 5, band: 3.0 },
  { min: 0, max: 3, band: 2.5 },
]

function calculateBandScore(correctCount: number, totalQuestions: number): number {
  const scaled = totalQuestions === 40
    ? correctCount
    : Math.round((correctCount / (totalQuestions || 1)) * 40)

  for (const range of BAND_SCALE_40) {
    if (scaled >= range.min && scaled <= range.max) return range.band
  }
  return 2.0
}

function normalizeAnswer(str: any): string {
  if (str == null) return ''
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/\.$/, '')
}

function answersMatch(studentAnswer: any, correctAnswer: any): boolean {
  const s = normalizeAnswer(studentAnswer)
  const c = normalizeAnswer(correctAnswer)
  if (!s || !c) return false
  if (s === c) return true

  const tfng: Record<string, string> = {
    't': 'true', 'f': 'false', 'ng': 'not given',
    'y': 'yes', 'n': 'no',
    'true': 'true', 'false': 'false', 'not given': 'not given',
    'yes': 'yes', 'no': 'no',
  }
  if (tfng[s] && tfng[c] && tfng[s] === tfng[c]) return true

  const nums: Record<string, string> = {
    '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
    '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten'
  }
  if (nums[s] === c || s === nums[c]) return true

  return false
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { assignmentId, studentId, answers, timeSpentSecs } = await req.json()
    if (!assignmentId || !studentId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Fetch assignment and reading test
    const { data: assignment, error: assignError } = await adminClient
      .from('reading_test_assignments')
      .select('*, reading_tests(*)')
      .eq('id', assignmentId)
      .single()

    if (assignError || !assignment) {
      return new Response(JSON.stringify({ error: 'Assignment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const test = assignment.reading_tests
    const passages = test?.passages || []

    // 2. Perform rule-based grading
    const detailedResults: any[] = []
    let correctCount = 0
    let totalQuestions = 0

    for (const passage of passages) {
      for (const question of (passage.questions || [])) {
        totalQuestions++
        const studentAns = (answers || {})[question.id] || ''
        const correctAns = question.correctAnswer || ''
        const allowed = Array.isArray(question.correctAnswers) && question.correctAnswers.length > 0
          ? question.correctAnswers
          : [correctAns]

        const isCorrect = allowed.some((ca: string) => answersMatch(studentAns, ca))
        if (isCorrect) correctCount++

        detailedResults.push({
          questionId: question.id,
          passageTitle: passage.title,
          questionText: question.questionText,
          questionType: question.type,
          studentAnswer: studentAns || '(no answer)',
          correctAnswer: allowed.join(' / '),
          isCorrect,
          explanation: isCorrect ? '' : `The correct answer is "${correctAns}". Your answer was "${studentAns || '(no answer)'}".`,
        })
      }
    }

    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 1000) / 10 : 0
    const bandScore = calculateBandScore(correctCount, totalQuestions)

    const aiFeedback = `Performance: ${correctCount}/${totalQuestions} correct (${percentage}%) — IELTS Band ${bandScore}. Completed in ${Math.round((timeSpentSecs || 0) / 60)} minutes.`

    // 3. Upsert into reading_test_submissions
    const { data: submission, error: subError } = await adminClient
      .from('reading_test_submissions')
      .insert({
        assignment_id: assignmentId,
        student_id: studentId,
        answers: answers || {},
        correct_count: correctCount,
        total_questions: totalQuestions,
        band_score: bandScore,
        percentage,
        detailed_results: detailedResults,
        ai_feedback: aiFeedback,
        time_spent_secs: timeSpentSecs || 0,
        submitted_at: new Date().toISOString(),
        graded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (subError) throw subError

    // 4. Update assignment status
    await adminClient
      .from('reading_test_assignments')
      .update({ status: 'graded', updated_at: new Date().toISOString() })
      .eq('id', assignmentId)

    return new Response(JSON.stringify({
      success: true,
      submission,
      bandScore,
      correctCount,
      totalQuestions,
      detailedResults,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
