/**
 * Gemini AI Client — for parsing IELTS reading test HTML and grading
 */

const GEMINI_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY);

// Primary and fallback models supported by Google AI Studio
const PRIMARY_MODEL = 'gemini-3.5-flash';
const FALLBACK_MODEL = 'gemini-3.5-flash-lite';

/**
 * Call Gemini API with automatic fallback
 */
async function callGemini(prompt, maxTokens = 8192) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to .env');
  }

  const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: maxTokens,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Gemini error with ${model} (${response.status}):`, errText);
        lastError = new Error(`Gemini (${model}) error: ${response.status}`);
        continue; // Try fallback model
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from Gemini');

      try {
        return JSON.parse(text);
      } catch {
        // Try extracting JSON from markdown fences
        const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) return JSON.parse(match[1]);
        throw new Error('Failed to parse Gemini response as JSON');
      }
    } catch (err) {
      console.warn(`Gemini attempt with ${model} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

/**
 * Clean and pre-process raw HTML to extract meaningful text & markup
 * Crucially preserves the Answer Key section even in large documents.
 */
function preprocessHtmlForGemini(html) {
  if (!html) return '';

  // Extract answer key section before stripping anything, so we never lose it
  const answerSectionMatch = html.match(/(?:<[^>]+>)?\s*(?:answer\s*key|answers|solutions|keys|correct\s*answers?)\b[\s\S]*$/i);
  const preservedAnswerSection = answerSectionMatch ? answerSectionMatch[0] : '';

  // Remove scripts (except potential answer arrays) and styles
  let cleaned = html
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');

  // Truncate main body if gigantic, but ALWAYS append the preserved answer key section!
  if (cleaned.length > 70000) {
    const head = cleaned.slice(0, 60000);
    cleaned = head + '\n\n<!-- [PRESERVED ANSWER KEY SECTION FROM HTML] -->\n' + preservedAnswerSection.slice(0, 20000);
  }

  return cleaned;
}

/**
 * Client-side Regex & DOM Answer Key Extractor
 * Scans HTML for answer tables, lists, classes, data-attributes, and text blocks.
 * Returns an object mapping question numbers to answers: { 1: "TRUE", 2: "FALSE", 3: "A", ... }
 */
export function extractAnswerKeysFromRawHtml(html) {
  if (!html || typeof html !== 'string') return {};

  const keys = {};

  const normalizeAnswer = (val) => {
    if (!val) return '';
    let clean = val.replace(/<[^>]+>/g, '').trim();
    // Normalize True / False / Not Given
    const upper = clean.toUpperCase();
    if (upper === 'T' || upper === 'TRUE') return 'TRUE';
    if (upper === 'F' || upper === 'FALSE') return 'FALSE';
    if (upper === 'NG' || upper === 'NOT GIVEN' || upper === 'NOTGIVEN') return 'NOT GIVEN';
    if (upper === 'Y' || upper === 'YES') return 'YES';
    if (upper === 'N' || upper === 'NO') return 'NO';
    // Single letter Multiple Choice (A, B, C, D)
    if (/^[A-H]$/i.test(clean)) return clean.toUpperCase();
    return clean;
  };

  // 1. Table cells: <td>1</td><td>TRUE</td> or multi-column table pairs on the same <tr>
  const tdRe = /<t[dh][^>]*>\s*(?:Q(?:uestion)?\s*)?(\b[1-9]|[1-3][0-9]|40)\s*<\/t[dh]>\s*<t[dh][^>]*>([^<]+)<\/t[dh]>/gi;
  let m;
  while ((m = tdRe.exec(html)) !== null) {
    const qNum = parseInt(m[1], 10);
    const ans = normalizeAnswer(m[2]);
    if (ans && !keys[qNum]) keys[qNum] = ans;
  }

  // 2. data-question and data-answer attributes
  const dataWithQRe = /data-(?:q|question)=["'](\d+)["'][^>]*data-(?:answer|correct)=["']([^"']+)["']/gi;
  while ((m = dataWithQRe.exec(html)) !== null) {
    const qNum = parseInt(m[1], 10);
    const ans = normalizeAnswer(m[2]);
    if (ans && !keys[qNum]) keys[qNum] = ans;
  }

  // 3. Ordered list (<ol>) inside an answers or solutions container
  const olMatch = html.match(/(?:<ol\b[^>]*>)([\s\S]*?)<\/ol>/i);
  if (olMatch && /(?:answer|solution|key)/i.test(html.slice(Math.max(0, olMatch.index - 300), olMatch.index + 50))) {
    const liRe = /<li[^>]*>([^<]+)<\/li>/gi;
    let idx = 1;
    let liMatch;
    while ((liMatch = liRe.exec(olMatch[1])) !== null && idx <= 40) {
      const ans = normalizeAnswer(liMatch[1]);
      if (ans && !keys[idx]) keys[idx] = ans;
      idx++;
    }
  }

  // 4. Look for an explicit "Answer Key" / "Answers" section in text
  const sectionMatch = html.match(/(?:answer\s*key|answers|solutions|keys)\b[\s\S]*$/i);
  const textToScan = sectionMatch ? sectionMatch[0] : html;

  // Regex pattern: "1. TRUE" or "1: B" or "1 - FALSE" or "1) NOT GIVEN" or "Q1. answer"
  const generalRe = /(?:^|[>\n\r\s])(?:Q(?:uestion)?\s*)?(\b[1-9]|[1-3][0-9]|40)\s*[\.\:\)\-–—]\s*([A-Za-z0-9\s\/'\-]{1,50})(?=[<\n\r;]|$)/gim;
  while ((m = generalRe.exec(textToScan)) !== null) {
    const qNum = parseInt(m[1], 10);
    const ans = normalizeAnswer(m[2]);
    if (ans && !keys[qNum] && !/^(the|a|an|of|in|to|is)$/i.test(ans)) {
      keys[qNum] = ans;
    }
  }

  return keys;
}

/**
 * Parse an IELTS reading test from HTML content
 * Teacher pastes HTML from Cambridge IELTS or any reading test → Gemini + Answer Key scanner extracts full structured test
 */
export async function parseReadingTestFromHTML(htmlContent) {
  // 1. Scan client-side for answer keys in the raw HTML
  const clientExtractedKeys = extractAnswerKeysFromRawHtml(htmlContent);
  const clientKeyEntries = Object.entries(clientExtractedKeys);

  const cleanedHtml = preprocessHtmlForGemini(htmlContent);

  const answerKeyHint = clientKeyEntries.length > 0
    ? `\nPRE-DETECTED ANSWER KEY HINT FROM HTML:\n${clientKeyEntries.map(([q, a]) => `Q${q}: ${a}`).join(', ')}\nEnsure every question has its corresponding correct answer.\n`
    : '';

  const prompt = `You are an expert IELTS Academic Reading test extractor and parser.
Analyze this HTML content from an IELTS reading test and extract all passages, questions, and especially the CORRECT ANSWERS from the HTML into a clean, structured JSON object.

CRITICAL REQUIREMENT — ANSWER KEY EXTRACTION:
The HTML file contains the correct answers/answer key for this IELTS reading test (often at the bottom, or in a solutions table/list, or inline with questions).
You MUST pick the correct answers directly from the HTML and place them in "correctAnswer" for every single question (1 to 40).
- For True / False / Not Given: "TRUE", "FALSE", or "NOT GIVEN" (uppercase)
- For Yes / No / Not Given: "YES", "NO", or "NOT GIVEN" (uppercase)
- For Multiple Choice: "A", "B", "C", or "D" (uppercase)
- For Fill in the Blank / Short Answer: the exact word(s) from the answer key
Never return empty answers if the answer key exists in the HTML!

${answerKeyHint}

EXTRACTION INSTRUCTIONS:
1. **Test Title**: Extract the test title (e.g. "Cambridge IELTS 18 - Reading Test 1" or infer from headings).
2. **Passages** (IELTS Academic tests have up to 3 reading passages):
   - "title": Clean title of each passage (e.g. "Passage 1: The Secret Life of Trees").
   - "text": Clean passage text. Remove HTML tags, navigation, buttons, and sidebars. Preserve paragraphs separated by double line breaks ("\\n\\n"). Include paragraph labels (e.g., A, B, C...) if present.
3. **Questions**:
   - Assign sequential IDs across the whole test: "q1", "q2", "q3", ... up to "q40".
   - "questionText": The statement, question, or sentence prompt.
   - "type": Classify into one of these exact types:
     * "true_false_ng" — True / False / Not Given
     * "yes_no_ng" — Yes / No / Not Given
     * "multiple_choice" — A, B, C, D choices
     * "fill_blank" — Fill in the blank / Summary completion
     * "short_answer" — Short answer question
     * "sentence_completion" — Complete the sentence
     * "matching" — Matching information/features
     * "heading_match" — Match headings to paragraphs
   - "options": Array of option strings (for multiple_choice, matching, or heading_match). E.g. ["A. Option 1", "B. Option 2", ...]. Empty array [] for fill_blank or T/F/NG.
   - "correctAnswer": Exact correct answer picked from the HTML answer key.
   - "points": 1

RETURN FORMAT (strictly valid JSON only, no explanatory text):
{
  "title": "IELTS Academic Reading Test",
  "passages": [
    {
      "title": "Passage 1: Title",
      "text": "Full text of passage 1...",
      "questions": [
        {
          "id": "q1",
          "type": "true_false_ng",
          "questionText": "Statement 1 text here",
          "options": [],
          "correctAnswer": "TRUE",
          "points": 1
        }
      ]
    }
  ]
}

HTML TO PARSE:
${cleanedHtml}`;

  const parsed = await callGemini(prompt, 16384);

  // 2. Post-process and ensure 100% answer key coverage by merging client-extracted keys
  if (parsed && Array.isArray(parsed.passages)) {
    let globalQIndex = 1;
    for (const passage of parsed.passages) {
      if (Array.isArray(passage.questions)) {
        for (const q of passage.questions) {
          const qNum = parseInt(String(q.id).replace(/\D/g, ''), 10) || globalQIndex;
          
          // If Gemini left correctAnswer empty, or if client found an explicit key
          if ((!q.correctAnswer || q.correctAnswer.trim() === '') && clientExtractedKeys[qNum]) {
            q.correctAnswer = clientExtractedKeys[qNum];
          }

          // Normalize answer format
          if (q.correctAnswer) {
            const upper = q.correctAnswer.trim().toUpperCase();
            if (upper === 'T' || upper === 'TRUE') q.correctAnswer = 'TRUE';
            else if (upper === 'F' || upper === 'FALSE') q.correctAnswer = 'FALSE';
            else if (upper === 'NG' || upper === 'NOT GIVEN') q.correctAnswer = 'NOT GIVEN';
            else if (upper === 'Y' || upper === 'YES') q.correctAnswer = 'YES';
            else if (upper === 'N' || upper === 'NO') q.correctAnswer = 'NO';
            else if (/^[A-H]$/i.test(q.correctAnswer.trim())) q.correctAnswer = q.correctAnswer.trim().toUpperCase();
          }

          globalQIndex++;
        }
      }
    }
  }

  return parsed;
}

/**
 * Grade reading test answers using Gemini AI
 * Handles semantic matching for fill-in-the-blank and short answers,
 * and provides constructive evaluation feedback.
 */
export async function gradeWithGemini(passages, studentAnswers) {
  const questionsForGrading = [];
  for (const passage of passages) {
    for (const q of (passage.questions || [])) {
      questionsForGrading.push({
        id: q.id,
        type: q.type,
        questionText: q.questionText,
        correctAnswer: q.correctAnswer || (q.correctAnswers ? q.correctAnswers[0] : '') || '',
        studentAnswer: studentAnswers[q.id] || '',
      });
    }
  }

  const prompt = `You are an official IELTS Reading Test examiner and grader.
Grade the student's submitted answers comparing each studentAnswer to the correctAnswer.

GRADING RULES:
1. True/False/Not Given & Yes/No/Not Given:
   - Must match the correct option (case-insensitive, e.g. "true" == "TRUE", "T" == "TRUE", "not given" == "NOT GIVEN").
2. Multiple Choice:
   - Must match the correct letter (e.g. "A" == "a" or "A. Option Text" matches "A").
3. Fill-in-the-Blank / Short Answer / Sentence Completion:
   - Compare semantically and textually.
   - Be tolerant of minor 1-letter typos, singular vs plural forms, and leading articles ("the", "a", "an").
   - Accept number equivalents ("3" == "three").
   - If meaning and key word match, mark isCorrect = true.
4. If studentAnswer is blank or whitespace, mark isCorrect = false.

For every question, return:
- questionId: the question id (e.g. "q1")
- isCorrect: boolean true or false
- explanation: a concise 1-sentence explanation ONLY if incorrect, explaining why (empty string "" if correct)

Also provide:
- overallFeedback: 2-3 encouraging sentences highlighting strengths and how to improve.
- weakAreas: array of strings indicating which question types or areas need practice (e.g. ["True/False/Not Given", "Summary Completion"]).

Return strictly JSON:
{
  "results": [
    {
      "questionId": "q1",
      "isCorrect": true,
      "explanation": ""
    }
  ],
  "overallFeedback": "Great performance! You showed strong comprehension...",
  "weakAreas": ["Summary Completion"]
}

Questions to grade:
${JSON.stringify(questionsForGrading, null, 2)}`;

  return await callGemini(prompt, 8192);
}
