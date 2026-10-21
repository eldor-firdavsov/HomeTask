import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData, useToast } from '../../context/DataContext';
import {
  ArrowLeft, Plus, Trash2, BookOpen, Search,
  Send, ChevronDown, ChevronUp, Upload, Check, X,
  Sparkles, FileCode, Loader2, CheckCircle2, Clock,
  Edit3, HelpCircle, FileText, RefreshCw, Users, AlertCircle
} from 'lucide-react';
import { createReadingTest, assignReadingTest } from '../../lib/supabase/readingTests';
import { parseReadingTestFromHTML, extractAnswerKeysFromRawHtml } from '../../lib/gemini';
import { SAMPLE_IELTS_READING_HTML } from '../../data/sampleIeltsHtml';
import { CAMBRIDGE_20_READING_TEST_2 } from '../../data/cambridge20Test';
import Breadcrumbs from '../../components/common/Breadcrumbs';

const QUESTION_TYPES = [
  { value: 'true_false_ng', label: 'True / False / Not Given' },
  { value: 'yes_no_ng', label: 'Yes / No / Not Given' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'sentence_completion', label: 'Sentence Completion' },
  { value: 'matching', label: 'Matching' },
  { value: 'heading_match', label: 'Heading Match' },
];

let qCounter = 1;
function newQuestion() {
  return {
    id: `q${qCounter++}`,
    type: 'true_false_ng',
    questionText: '',
    options: [],
    correctAnswer: '',
    correctAnswers: [],
    points: 1,
  };
}

function newPassage(idx = 1) {
  return {
    title: `Passage ${idx}`,
    text: '',
    questions: [newQuestion()],
  };
}

export default function CreateReadingTest() {
  const { data, profile, session, refreshData } = useData();
  const navigate = useNavigate();
  const toast = useToast();

  // Mode: 'ai' (Default, streamlined) or 'manual'
  const [mode, setMode] = useState('ai');

  // Test state
  const [title, setTitle] = useState('');
  const [timeLimitMins, setTimeLimitMins] = useState(60);
  const [passages, setPassages] = useState([]);
  const [isTestGenerated, setIsTestGenerated] = useState(false);

  // AI HTML Input state
  const [htmlInput, setHtmlInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [aiParsing, setAiParsing] = useState(false);
  const [aiProgressStep, setAiProgressStep] = useState(0);

  // Answer Key Inline Edit Modal
  const [editingAnswerQ, setEditingAnswerQ] = useState(null); // { pIdx, qIdx, qNum, answer, questionText }
  const [editAnswerValue, setEditAnswerValue] = useState('');

  // Passage review tab
  const [activePassageTab, setActivePassageTab] = useState(0);
  const [showFullPassageText, setShowFullPassageText] = useState(false);

  // Student Assignment
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [deadline, setDeadline] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  const students = (data?.users || []).filter(u => u.role === 'STUDENT');

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(s =>
      (s.firstName || '').toLowerCase().includes(q) ||
      (s.lastName || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  // Flattened all questions list for summary
  const allQuestions = useMemo(() => {
    const list = [];
    passages.forEach((p, pIdx) => {
      (p.questions || []).forEach((q, qIdx) => {
        list.push({ ...q, pIdx, qIdx });
      });
    });
    return list;
  }, [passages]);

  const totalQuestions = allQuestions.length;
  const answeredCount = allQuestions.filter(q => q.correctAnswer && q.correctAnswer.trim() !== '').length;

  // ── Handle File Upload ───────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result || '';
      setHtmlInput(text);
      toast(`Loaded ${file.name} (${Math.round(text.length / 1024)} KB)`);
    };
    reader.onerror = () => toast('Error reading HTML file', 'error');
    reader.readAsText(file);
  };

  // ── Load Sample HTML ─────────────────────────────
  const handleLoadSample = () => {
    setHtmlInput(SAMPLE_IELTS_READING_HTML);
    setFileName('cambridge_ielts_18_test_1.html');
    toast('Loaded Cambridge IELTS 18 Reading Test 1 (with 40 Questions & Answer Key)');
  };

  // ── Load Cambridge 20 Full Test ───────────────────
  const handleLoadCambridge20 = () => {
    setTitle(CAMBRIDGE_20_READING_TEST_2.title);
    setPassages(CAMBRIDGE_20_READING_TEST_2.passages);
    setFileName('cambridge_ielts_20_test_2.html');
    setActivePassageIdx(0);
    toast('🎉 Loaded Cambridge IELTS 20 Academic Reading Test 2 (Manatees, 40 Questions & Answer Key)');
  };

  // ── AI Extraction ────────────────────────────────
  const handleGenerateTestWithAi = async () => {
    if (!htmlInput.trim()) {
      toast('Please paste your HTML or upload an IELTS HTML file', 'error');
      return;
    }

    setAiParsing(true);
    setAiProgressStep(1);

    try {
      // Step 1: Scan for answer keys in raw HTML
      setAiProgressStep(1);
      const preKeys = extractAnswerKeysFromRawHtml(htmlInput);
      const detectedKeyCount = Object.keys(preKeys).length;

      // Step 2: Call Gemini parser
      setAiProgressStep(2);
      const parsed = await parseReadingTestFromHTML(htmlInput);
      if (!parsed || !Array.isArray(parsed.passages) || parsed.passages.length === 0) {
        throw new Error('Could not extract reading passages from this HTML. Please check the content.');
      }

      // Step 3: Validate and structure passages & questions
      setAiProgressStep(3);
      setTitle(parsed.title || 'IELTS Academic Reading Test');

      let counter = 1;
      const formattedPassages = parsed.passages.map((p, pIndex) => ({
        title: p.title || `Passage ${pIndex + 1}`,
        text: p.text || '',
        questions: (p.questions || []).map(q => {
          const qNum = parseInt(String(q.id || counter).replace(/\D/g, ''), 10) || counter;
          const assignedId = `q${qNum}`;
          counter++;
          const finalAnswer = q.correctAnswer || preKeys[qNum] || '';

          return {
            id: assignedId,
            type: q.type || 'fill_blank',
            questionText: q.questionText || '',
            options: Array.isArray(q.options) ? q.options : [],
            correctAnswer: finalAnswer,
            correctAnswers: [finalAnswer],
            points: 1,
          };
        }),
      }));

      setPassages(formattedPassages);
      setIsTestGenerated(true);
      setActivePassageTab(0);

      const totalQ = formattedPassages.reduce((sum, p) => sum + (p.questions?.length || 0), 0);
      const withAnswers = formattedPassages.reduce(
        (sum, p) => sum + p.questions.filter(q => q.correctAnswer && q.correctAnswer.trim() !== '').length, 0
      );

      toast(`✨ Success! Extracted ${formattedPassages.length} passages, ${totalQ} questions, and ${withAnswers} correct answers from the HTML!`);
    } catch (err) {
      console.error('AI Generation error:', err);
      toast(err.message || 'Failed to extract IELTS test with AI', 'error');
    } finally {
      setAiParsing(false);
      setAiProgressStep(0);
    }
  };

  // ── Inline Answer Key Quick Edit ─────────────────
  const openEditAnswer = (q, globalIdx) => {
    setEditingAnswerQ({
      ...q,
      globalIdx: globalIdx + 1,
    });
    setEditAnswerValue(q.correctAnswer || '');
  };

  const handleSaveAnswer = () => {
    if (!editingAnswerQ) return;
    const { pIdx, qIdx } = editingAnswerQ;
    const val = editAnswerValue.trim();

    setPassages(prev => prev.map((p, pi) => {
      if (pi !== pIdx) return p;
      return {
        ...p,
        questions: p.questions.map((q, qi) => qi === qIdx ? { ...q, correctAnswer: val, correctAnswers: [val] } : q),
      };
    }));

    toast(`Updated Question ${editingAnswerQ.globalIdx} answer to "${val}"`);
    setEditingAnswerQ(null);
  };

  // ── Quick Deadline Helpers ───────────────────────
  const setQuickDeadline = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(23, 59, 0, 0);
    setDeadline(d.toISOString().slice(0, 16));
  };

  // ── Toggle Student Selection ─────────────────────
  const toggleStudent = (id) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const selectAllStudents = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map(s => s.id));
    }
  };

  // ── Validation ───────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Test title is required';
    if (passages.length === 0) errs.passages = 'At least one passage is required';
    if (passages.some(p => !p.text.trim())) errs.passages = 'All passages must contain text';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit / Save & Assign ───────────────────────
  const handleSaveTest = async () => {
    if (!validate()) return;
    const teacherId = profile?.id || session?.user?.id;
    if (!teacherId) {
      toast('Teacher session not found. Please log in again.', 'error');
      return;
    }

    setBusy(true);
    try {
      const test = await createReadingTest({
        teacherId,
        title: title.trim(),
        passages,
        timeLimitMins,
        totalQuestions: passages.reduce((sum, p) => sum + (p.questions?.length || 0), 0),
      });

      if (selectedStudentIds.length > 0) {
        await assignReadingTest({
          readingTestId: test.id,
          teacherId,
          studentIds: selectedStudentIds,
          deadline: deadline || null,
        });
      }

      toast(`🎉 IELTS Reading Test "${title}" created${selectedStudentIds.length > 0 ? ` and assigned to ${selectedStudentIds.length} student(s)` : ''}!`);
      if (refreshData) await refreshData();
      navigate('/teacher/reading-tests');
    } catch (err) {
      console.error('Error saving test:', err);
      toast(err.message || 'Failed to save test', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="g-page" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 80px' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/teacher/dashboard' },
          { label: 'IELTS Reading Tests', to: '/teacher/reading-tests' },
          { label: 'Create Test with AI', current: true },
        ]}
      />

        {/* Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.7)', padding: '3px 4px', borderRadius: 10, border: '1px solid rgba(226,232,240,0.8)' }}>
          <button
            type="button"
            onClick={() => setMode('ai')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
              background: mode === 'ai' ? 'var(--color-primary)' : 'transparent',
              color: mode === 'ai' ? '#ffffff' : 'var(--color-text-secondary)',
              border: 'none', cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            <Sparkles size={13} /> AI HTML Importer
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('manual');
              if (passages.length === 0) setPassages([newPassage(1)]);
              setIsTestGenerated(true);
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
              background: mode === 'manual' ? 'var(--color-primary)' : 'transparent',
              color: mode === 'manual' ? '#ffffff' : 'var(--color-text-secondary)',
              border: 'none', cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            <Edit3 size={13} /> Manual Editor
          </button>
        </div>
      </div>

      {/* Main Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>📖 IELTS Academic Reading Creator</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#4338ca', background: '#e0e7ff', padding: '3px 10px', borderRadius: 999 }}>
            AI Powered
          </span>
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', margin: '6px 0 0' }}>
          Upload or paste any IELTS reading test HTML file. Passages, 40 questions, and the official Answer Key are automatically extracted and verified.
        </p>
      </div>

      {/* ============================================================== */}
      {/* STEP 1: AI HTML IMPORT STUDIO (When test is not yet generated) */}
      {/* ============================================================== */}
      {mode === 'ai' && !isTestGenerated && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Hero Upload & Paste Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 18,
              border: '1px solid rgba(226, 232, 240, 0.9)',
              boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.08)',
              padding: '32px 30px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                  Paste or Upload IELTS Reading HTML
                </h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  Works with Cambridge IELTS tests, online mocks, or custom teacher HTML files with answer keys.
                </p>
              </div>

              {/* Sample loader buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleLoadCambridge20}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700,
                    background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.35)',
                    color: '#1d4ed8', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                  title="Load full Cambridge 20 Academic Reading Test 2 (Manatees, Procrastination, Strike Zone)"
                >
                  <FileCode size={14} /> Load Cambridge 20 Test (Manatees)
                </button>

                <button
                  type="button"
                  onClick={handleLoadSample}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                    background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)',
                    color: '#4338ca', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  <FileCode size={14} /> Load Cambridge 18 Sample
                </button>
              </div>
            </div>

            {/* Drag & Drop File Zone */}
            <div
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: 12,
                padding: '24px 20px',
                textAlign: 'center',
                background: fileName ? '#f0fdf4' : '#f8fafc',
                borderColor: fileName ? '#86efac' : '#cbd5e1',
                marginBottom: 18,
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              <input
                type="file"
                accept=".html,.htm"
                onChange={handleFileUpload}
                style={{
                  position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%'
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: fileName ? 'var(--color-success-soft)' : 'var(--color-primary-soft)',
                  color: fileName ? 'var(--color-success)' : 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {fileName ? <Check size={22} strokeWidth={2.5} /> : <Upload size={20} />}
                </div>

                {fileName ? (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>
                      ✓ {fileName}
                    </div>
                    <div style={{ fontSize: 12, color: '#15803d', marginTop: 2 }}>
                      HTML loaded successfully. Click the button below to extract test & answer keys.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                      Click to choose an HTML file, or drag and drop it here
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      Supports standard IELTS Academic HTML files with Passages 1–3 and Answer Key
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Paste HTML Box */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Or Paste Raw HTML Content:
                </label>
                {htmlInput && (
                  <button
                    type="button"
                    onClick={() => { setHtmlInput(''); setFileName(''); }}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 11.5, cursor: 'pointer', padding: 0 }}
                  >
                    Clear text
                  </button>
                )}
              </div>

              <textarea
                value={htmlInput}
                onChange={e => { setHtmlInput(e.target.value); setFileName(''); }}
                placeholder="Paste the raw HTML of your IELTS test here (e.g. <html>...<body>...<div class='answers'>...)..."
                rows={10}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  lineHeight: 1.5,
                }}
              />
            </div>

            {/* AI Progress Box (visible when generating) */}
            {aiParsing && (
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: 12,
                  background: 'var(--color-primary-soft)',
                  border: '1px solid rgba(36, 74, 58, 0.25)',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <Loader2 size={24} className="auth-spinner" style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>
                    {aiProgressStep === 1 && 'Scanning HTML structure and detecting Answer Keys...'}
                    {aiProgressStep === 2 && 'Gemini AI is extracting 3 Reading Passages & formatting questions...'}
                    {aiProgressStep === 3 && 'Validating 40 questions and matching official Answer Key...'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    This usually takes 5 to 10 seconds. All 40 answers will be ready for review.
                  </div>
                </div>
              </div>
            )}

            {/* Big Action Button */}
            <button
              type="button"
              onClick={handleGenerateTestWithAi}
              disabled={aiParsing || !htmlInput.trim()}
              style={{
                width: '100%',
                padding: '15px 24px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                color: '#ffffff',
                background: !htmlInput.trim() || aiParsing
                  ? '#94a3b8'
                  : 'var(--color-primary)',
                border: 'none',
                cursor: !htmlInput.trim() || aiParsing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: !htmlInput.trim() || aiParsing ? 'none' : '0 2px 8px rgba(36, 74, 58, 0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              {aiParsing ? (
                <>
                  <Loader2 size={18} className="auth-spinner" />
                  <span>Generating Full IELTS Test with AI…</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Generate Full IELTS Test (Passages, 40 Questions & Answer Keys)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STEP 2: TEST REVIEW, ANSWER KEY MATRIX & ASSIGN STUDIO         */}
      {/* ============================================================== */}
      {isTestGenerated && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Success Banner */}
          <div
            style={{
              padding: '14px 20px',
              borderRadius: 14,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: '#22c55e', color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Check size={18} strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>
                  IELTS Test Extracted Successfully!
                </div>
                <div style={{ fontSize: 12.5, color: '#15803d', marginTop: 1 }}>
                  {passages.length} Passages · {totalQuestions} Questions · <strong>{answeredCount} of {totalQuestions} Answers Picked from HTML ✓</strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Do you want to import a different HTML file? Any unsaved changes will be lost.')) {
                  setIsTestGenerated(false);
                  setHtmlInput('');
                  setFileName('');
                }
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: '#ffffff', border: '1px solid #cbd5e1',
                color: '#475569', cursor: 'pointer',
              }}
            >
              <RefreshCw size={12} /> Import Different HTML
            </button>
          </div>

          {/* Card 1: Test Details */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              border: '1px solid rgba(226, 232, 240, 0.9)',
              padding: '24px 26px',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                  Test Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Cambridge IELTS 18 — Test 1 Reading"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    borderRadius: 10,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {errors.title && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.title}</div>}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                  Time Limit
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    value={timeLimitMins}
                    onChange={e => setTimeLimitMins(Math.max(1, parseInt(e.target.value) || 60))}
                    style={{
                      width: 70,
                      padding: '11px 8px',
                      textAlign: 'center',
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: 13.5, color: '#64748b', fontWeight: 500 }}>minutes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: THE ANSWER KEY MATRIX (1–40 Questions) */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              border: '1px solid rgba(226, 232, 240, 0.9)',
              padding: '24px 26px',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 3px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🎯 Answer Key Matrix ({answeredCount} / {totalQuestions} Picked from HTML)</span>
                </h3>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>
                  Click any answer pill below to quickly review or tweak the correct answer.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 6, fontSize: 12, fontWeight: 600 }}>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Check size={12} strokeWidth={2.5} /> {answeredCount} Answers Detected
                </span>
                {totalQuestions > answeredCount && (
                  <span style={{ background: '#fef2f2', color: '#b91c1c', padding: '3px 9px', borderRadius: 6 }}>
                    {totalQuestions - answeredCount} Missing
                  </span>
                )}
              </div>
            </div>

            {/* Answer Pills Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
                gap: 8,
              }}
            >
              {allQuestions.map((q, idx) => {
                const qNum = idx + 1;
                const hasAnswer = Boolean(q.correctAnswer && q.correctAnswer.trim() !== '');

                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => openEditAnswer(q, idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: hasAnswer ? '1px solid #bbf7d0' : '1px solid #fecaca',
                      background: hasAnswer ? '#f0fdf4' : '#fef2f2',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                    title={`Question ${qNum}: ${q.questionText || 'No prompt'}\nClick to edit answer`}
                  >
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b' }}>
                        Q{qNum}
                      </div>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: hasAnswer ? '#15803d' : '#dc2626',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 85,
                        }}
                      >
                        {hasAnswer ? q.correctAnswer : 'Missing'}
                      </div>
                    </div>
                    <Edit3 size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 3: Passages Overview */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              border: '1px solid rgba(226, 232, 240, 0.9)',
              padding: '24px 26px',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 3px' }}>
                  📖 Reading Passages & Questions
                </h3>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>
                  3 Passages structured for IELTS Computer-Delivered layout.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowFullPassageText(!showFullPassageText)}
                style={{
                  background: 'transparent',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <FileText size={13} />
                <span>{showFullPassageText ? 'Hide Passage Text' : 'Inspect Full Passage Text'}</span>
              </button>
            </div>

            {/* Passage Tabs */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              {passages.map((p, pIdx) => {
                const words = (p.text || '').split(/\s+/).filter(Boolean).length;
                const qCount = p.questions?.length || 0;
                const isActive = activePassageTab === pIdx;

                return (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => setActivePassageTab(pIdx)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 10,
                      border: 'none',
                      background: isActive ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                      color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>Part {pIdx + 1}</div>
                    <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 500, marginTop: 2 }}>
                      {qCount} Questions · {words} words
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Passage Preview */}
            {passages[activePassageTab] && (
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                  {passages[activePassageTab].title || `Passage ${activePassageTab + 1}`}
                </div>

                {showFullPassageText ? (
                  <div
                    style={{
                      padding: '16px 18px',
                      borderRadius: 10,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      fontSize: 14,
                      lineHeight: 1.75,
                      color: '#1e293b',
                      whiteSpace: 'pre-wrap',
                      maxHeight: 350,
                      overflowY: 'auto',
                      fontFamily: 'Georgia, serif',
                    }}
                  >
                    {passages[activePassageTab].text || 'No text'}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic' }}>
                    "{passages[activePassageTab].text?.slice(0, 180)}…"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 4: Assign to Students */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              border: '1px solid rgba(226, 232, 240, 0.9)',
              padding: '24px 26px',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 3px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={18} color="var(--color-primary)" />
                  <span>Assign to Students ({selectedStudentIds.length} Selected)</span>
                </h3>
                <p style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', margin: 0 }}>
                  Select students to receive this IELTS reading exam.
                </p>
              </div>

              {students.length > 0 && (
                <button
                  type="button"
                  onClick={selectAllStudents}
                  style={{
                    background: 'var(--color-primary-soft)',
                    border: '1px solid rgba(36, 74, 58, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--color-primary)',
                    cursor: 'pointer',
                  }}
                >
                  {selectedStudentIds.length === students.length ? 'Deselect All' : 'Select All Students'}
                </button>
              )}
            </div>

            {/* Students Grid */}
            {students.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                No active students found in your roster. You can save this test to your library and assign it later.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                {students.map(s => {
                  const isSelected = selectedStudentIds.includes(s.id);
                  const initials = `${s.firstName?.[0] || ''}${s.lastName?.[0] || ''}`.toUpperCase();

                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleStudent(s.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: isSelected ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: isSelected ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                          color: isSelected ? '#ffffff' : 'var(--color-text-secondary)',
                          fontWeight: 700, fontSize: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.firstName} {s.lastName}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.email}
                        </div>
                      </div>
                      <div
                        style={{
                          width: 18, height: 18, borderRadius: 5,
                          border: isSelected ? 'none' : '1.5px solid var(--color-border)',
                          background: isSelected ? 'var(--color-primary)' : 'transparent',
                          color: '#ffffff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Deadline selection */}
            <div style={{ paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={16} color="#64748b" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Exam Deadline:</span>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 12.5,
                    color: '#0f172a',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Quick set:</span>
                {[
                  { label: 'Tomorrow', days: 1 },
                  { label: 'In 3 Days', days: 3 },
                  { label: 'In 1 Week', days: 7 },
                ].map(opt => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setQuickDeadline(opt.days)}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      padding: '4px 8px',
                      fontSize: 11.5,
                      fontWeight: 500,
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
              padding: '16px 0',
            }}
          >
            <Link
              to="/teacher/reading-tests"
              style={{
                padding: '12px 20px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                color: '#64748b',
                textDecoration: 'none',
              }}
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={handleSaveTest}
              disabled={busy}
              style={{
                padding: '14px 28px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                color: '#ffffff',
                background: 'var(--color-primary)',
                border: 'none',
                cursor: busy ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 2px 8px rgba(36, 74, 58, 0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="auth-spinner" />
                  <span>Saving Test…</span>
                </>
              ) : selectedStudentIds.length > 0 ? (
                <>
                  <Send size={16} />
                  <span>Publish & Assign to {selectedStudentIds.length} Student(s)</span>
                </>
              ) : (
                <>
                  <Check size={16} strokeWidth={2.5} />
                  <span>Save Test to Library</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* QUICK INLINE EDIT ANSWER MODAL                                 */}
      {/* ============================================================== */}
      {editingAnswerQ && (
        <div
          className="g-overlay"
          onClick={() => setEditingAnswerQ(null)}
          style={{ zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            className="g-modal"
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: '24px 26px',
              maxWidth: 440,
              width: '90%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                Edit Answer for Question {editingAnswerQ.globalIdx}
              </div>
              <button
                type="button"
                onClick={() => setEditingAnswerQ(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ fontSize: 13, color: '#475569', marginBottom: 14, background: '#f8fafc', padding: '10px 12px', borderRadius: 8, lineHeight: 1.45 }}>
              <strong>Prompt:</strong> {editingAnswerQ.questionText || 'No prompt specified'}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Correct Answer:
              </label>
              <input
                type="text"
                value={editAnswerValue}
                onChange={e => setEditAnswerValue(e.target.value)}
                placeholder="e.g. TRUE, FALSE, A, or text phrase"
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 5 }}>
                For True/False/Not Given, use TRUE, FALSE, or NOT GIVEN. For MCQs, use A, B, C, or D.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setEditingAnswerQ(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAnswer}
                style={{
                  background: 'var(--color-primary)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Save Answer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
