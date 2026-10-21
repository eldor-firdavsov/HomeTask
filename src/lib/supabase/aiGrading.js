/**
 * AI Grading Module for IELTS Reading Tests
 * 
 * Uses rule-based grading with fuzzy matching.
 * Structured so AI (Gemini/OpenAI) can be layered in later.
 */

// ═══════════════════════════════════════════════════════════
// IELTS BAND SCORE MAPPING (Academic Reading)
// ═══════════════════════════════════════════════════════════

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
];

/**
 * Calculate IELTS band score from raw score
 */
export function calculateBandScore(correctCount, totalQuestions) {
  // Scale to 40 if total isn't 40
  const scaled = totalQuestions === 40
    ? correctCount
    : Math.round((correctCount / totalQuestions) * 40);

  for (const range of BAND_SCALE_40) {
    if (scaled >= range.min && scaled <= range.max) {
      return range.band;
    }
  }
  return 2.0;
}

/**
 * Normalize answer string for comparison
 */
function normalizeAnswer(answer) {
  if (answer == null) return '';
  return String(answer)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')       // collapse whitespace
    .replace(/['']/g, "'")      // normalize quotes
    .replace(/[""]/g, '"')
    .replace(/^(the|a|an)\s+/i, '') // strip leading articles for flexibility
    .replace(/\.$/, '');         // strip trailing period
}

/**
 * Check if two answers match (fuzzy)
 */
function answersMatch(studentAnswer, correctAnswer) {
  const student = normalizeAnswer(studentAnswer);
  const correct = normalizeAnswer(correctAnswer);

  if (!student || !correct) return false;

  // Exact match
  if (student === correct) return true;

  // T/F/NG shortcuts
  const tfng = {
    't': 'true', 'f': 'false', 'ng': 'not given',
    'y': 'yes', 'n': 'no',
    'true': 'true', 'false': 'false', 'not given': 'not given',
    'yes': 'yes', 'no': 'no',
  };
  if (tfng[student] && tfng[correct] && tfng[student] === tfng[correct]) return true;

  // Number equivalence: "3" === "three", "1st" === "first" (basic)
  const numberWords = {
    '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
    '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
    '10': 'ten', '11': 'eleven', '12': 'twelve',
  };
  if (numberWords[student] === correct || student === numberWords[correct]) return true;

  // Roman numeral equivalence (i–x)
  const roman = { 'i': '1', 'ii': '2', 'iii': '3', 'iv': '4', 'v': '5',
    'vi': '6', 'vii': '7', 'viii': '8', 'ix': '9', 'x': '10' };
  if (roman[student] === correct || student === roman[correct]) return true;

  // Contains check for short answers (if correct is 1-2 words, allow if student answer contains it)
  if (correct.split(' ').length <= 2 && student.includes(correct)) return true;

  // Levenshtein distance for typo tolerance (only for answers > 3 chars)
  if (correct.length > 3 && student.length > 3) {
    const dist = levenshtein(student, correct);
    if (dist <= 1) return true; // Allow 1 typo
  }

  return false;
}

/**
 * Simple Levenshtein distance
 */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Grade a student's reading test submission
 * 
 * @param {Array} passages - The test passages with questions and correct answers
 * @param {Object} studentAnswers - { questionId: answer, ... }
 * @returns {Object} grading result
 */
export function gradeReadingTest(passages, studentAnswers) {
  const detailedResults = [];
  let correctCount = 0;
  let totalQuestions = 0;

  for (const passage of passages) {
    for (const question of (passage.questions || [])) {
      totalQuestions++;
      const studentAnswer = studentAnswers[question.id] || '';
      const correctAnswer = question.correctAnswer || '';

      // For questions with multiple correct answers (e.g., matching)
      const correctAnswers = question.correctAnswers
        ? (Array.isArray(question.correctAnswers) ? question.correctAnswers : [question.correctAnswers])
        : [correctAnswer];

      // Check if the student's answer matches any correct answer
      const isCorrect = correctAnswers.some(ca => answersMatch(studentAnswer, ca));

      if (isCorrect) correctCount++;

      detailedResults.push({
        questionId: question.id,
        passageTitle: passage.title,
        questionText: question.questionText,
        questionType: question.type,
        studentAnswer: studentAnswer || '(no answer)',
        correctAnswer: correctAnswers.length > 1 ? correctAnswers.join(' / ') : correctAnswer,
        isCorrect,
        explanation: isCorrect
          ? ''
          : generateExplanation(question, studentAnswer, correctAnswer),
      });
    }
  }

  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 1000) / 10 : 0;
  const bandScore = calculateBandScore(correctCount, totalQuestions);

  const aiFeedback = generateOverallFeedback(correctCount, totalQuestions, bandScore, detailedResults);

  return {
    correctCount,
    totalQuestions,
    bandScore,
    percentage,
    detailedResults,
    aiFeedback,
  };
}

/**
 * Generate explanation for wrong answers
 */
function generateExplanation(question, studentAnswer, correctAnswer) {
  const type = (question.type || '').toLowerCase();

  if (!studentAnswer || studentAnswer === '(no answer)') {
    return `You did not answer this question. The correct answer is: ${correctAnswer}`;
  }

  if (type === 'true_false_ng' || type === 'yes_no_ng') {
    return `The correct answer is "${correctAnswer}". Your answer "${studentAnswer}" does not match.`;
  }

  if (type === 'multiple_choice') {
    return `The correct option is "${correctAnswer}". You selected "${studentAnswer}".`;
  }

  if (type === 'fill_blank' || type === 'short_answer' || type === 'sentence_completion') {
    return `The expected answer is "${correctAnswer}". Your answer "${studentAnswer}" is not close enough.`;
  }

  if (type === 'matching' || type === 'heading_match') {
    return `The correct match is "${correctAnswer}". You chose "${studentAnswer}".`;
  }

  return `The correct answer is "${correctAnswer}". You answered "${studentAnswer}".`;
}

/**
 * Generate overall feedback summary
 */
function generateOverallFeedback(correctCount, totalQuestions, bandScore, detailedResults) {
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Analyze weak areas
  const typeStats = {};
  for (const result of detailedResults) {
    const t = result.questionType || 'other';
    if (!typeStats[t]) typeStats[t] = { correct: 0, total: 0 };
    typeStats[t].total++;
    if (result.isCorrect) typeStats[t].correct++;
  }

  const weakAreas = Object.entries(typeStats)
    .filter(([, stats]) => stats.total > 0 && (stats.correct / stats.total) < 0.5)
    .map(([type]) => formatQuestionType(type));

  const unanswered = detailedResults.filter(r => r.studentAnswer === '(no answer)').length;

  let feedback = `📊 Score: ${correctCount}/${totalQuestions} (${percentage}%) — Band ${bandScore}\n\n`;

  if (bandScore >= 7.0) {
    feedback += `🌟 Excellent performance! You demonstrate strong reading comprehension skills.`;
  } else if (bandScore >= 6.0) {
    feedback += `👍 Good result! You show competent reading skills with room for improvement.`;
  } else if (bandScore >= 5.0) {
    feedback += `📝 Moderate performance. You understand main ideas but struggle with details.`;
  } else {
    feedback += `📚 Keep practicing! Focus on building vocabulary and reading speed.`;
  }

  if (weakAreas.length > 0) {
    feedback += `\n\n⚠️ Weak areas: ${weakAreas.join(', ')}. Practice these question types specifically.`;
  }

  if (unanswered > 0) {
    feedback += `\n\n💡 Tip: You left ${unanswered} question${unanswered > 1 ? 's' : ''} unanswered. In IELTS, there's no penalty for guessing — always attempt every question!`;
  }

  return feedback;
}

/**
 * Format question type for display
 */
function formatQuestionType(type) {
  const map = {
    'true_false_ng': 'True/False/Not Given',
    'yes_no_ng': 'Yes/No/Not Given',
    'multiple_choice': 'Multiple Choice',
    'fill_blank': 'Fill in the Blank',
    'matching': 'Matching',
    'heading_match': 'Heading Match',
    'short_answer': 'Short Answer',
    'sentence_completion': 'Sentence Completion',
  };
  return map[type] || type;
}

/**
 * Get band score color for UI
 */
export function getBandColor(band) {
  if (band >= 8.0) return '#10b981'; // emerald
  if (band >= 7.0) return '#22c55e'; // green
  if (band >= 6.0) return '#3b82f6'; // blue
  if (band >= 5.0) return '#f59e0b'; // amber
  if (band >= 4.0) return '#f97316'; // orange
  return '#ef4444'; // red
}

/**
 * Get band score label
 */
export function getBandLabel(band) {
  if (band >= 8.5) return 'Expert';
  if (band >= 7.5) return 'Very Good';
  if (band >= 6.5) return 'Competent';
  if (band >= 5.5) return 'Modest';
  if (band >= 4.5) return 'Limited';
  if (band >= 3.5) return 'Extremely Limited';
  return 'Intermittent';
}
