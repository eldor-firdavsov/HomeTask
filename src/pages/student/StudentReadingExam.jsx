import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData, useToast } from '../../context/DataContext';
import {
  Clock, Flag, HelpCircle, ArrowLeft, ArrowRight, CheckCircle2,
  AlertTriangle, Send, Highlighter, Eraser, Loader2, Eye, EyeOff,
  Maximize, Minimize, MoveHorizontal, ListOrdered, StickyNote, X, Trash2, Target
} from 'lucide-react';
import {
  getMyReadingAssignments,
  getReadingTest,
  gradeAndSubmitReadingTest
} from '../../lib/supabase/readingTests';
import { CAMBRIDGE_20_READING_TEST_2 } from '../../data/cambridge20Test';
import '../../styles/ielts-cd-exam.css';

export default function StudentReadingExam() {
  const { assignmentId } = useParams();
  const { session, profile } = useData();
  const navigate = useNavigate();
  const toast = useToast();

  const [_assignment, setAssignment] = useState(null);
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);

  // Exam state
  const [activePassageIdx, setActivePassageIdx] = useState(0);
  const [activeQuestionId, setActiveQuestionId] = useState('q1');
  const [answers, setAnswers] = useState({}); // { q1: "TRUE", q2: "A", ... }
  const [flagged, setFlagged] = useState({}); // { q1: true, ... }
  const [secondsRemaining, setSecondsRemaining] = useState(3600);
  const [timerVisible, setTimerVisible] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'unanswered' | 'flagged'
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(() => Date.now());

  // Split Screen Resize state
  const [splitRatio, setSplitRatio] = useState(50); // percentage 25 - 75
  const [isDragging, setIsDragging] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Passage Font Zoom (px)
  const [passageFontSize, setPassageFontSize] = useState(16.5);

  // Interactive Highlighter & Notes state
  const [notes, setNotes] = useState([]); // [{ id, text, x, y, passageIdx }]
  const [_activeNoteId, setActiveNoteId] = useState(null);
  const [selectionPopover, setSelectionPopover] = useState(null); // { x, y, selectedText }

  // Skimming Practice Mode
  const [isSkimming, setIsSkimming] = useState(false);
  const [skimmingSpeed, setSkimmingSpeed] = useState(1); // 1x, 1.5x, 2x

  // References
  const passageRef = useRef(null);
  const questionsContainerRef = useRef(null);
  const timerRef = useRef(null);
  const splitContainerRef = useRef(null);

  // ── 1. Load test data ──────────────────────────────────
  useEffect(() => {
    async function loadExam() {
      setLoading(true);
      try {
        if (!assignmentId || assignmentId === 'demo' || assignmentId === 'practice' || assignmentId === 'cambridge-20') {
          setAssignment({ id: 'demo', readingTestId: 'cambridge-20-test-2' });
          setTest(CAMBRIDGE_20_READING_TEST_2);
          setSecondsRemaining(60 * 60);
          const firstQ = CAMBRIDGE_20_READING_TEST_2.passages[0]?.questions?.[0];
          if (firstQ) setActiveQuestionId(firstQ.id);
          setLoading(false);
          return;
        }

        const assignments = await getMyReadingAssignments();
        const currentAssign = assignments.find(a => a.id === assignmentId);
        if (!currentAssign) {
          // If assignment not in DB, fallback to Cambridge 20 so students can still practice
          setAssignment({ id: assignmentId, readingTestId: 'cambridge-20-test-2' });
          setTest(CAMBRIDGE_20_READING_TEST_2);
          setSecondsRemaining(60 * 60);
          const firstQ = CAMBRIDGE_20_READING_TEST_2.passages[0]?.questions?.[0];
          if (firstQ) setActiveQuestionId(firstQ.id);
          setLoading(false);
          return;
        }

        if (currentAssign.status === 'submitted' || currentAssign.status === 'graded') {
          toast('You have already completed this exam.');
          navigate('/student/dashboard');
          return;
        }

        setAssignment(currentAssign);
        const testData = await getReadingTest(currentAssign.readingTestId);
        setTest(testData);

        const mins = testData.timeLimitMins || 60;
        setSecondsRemaining(mins * 60);

        const firstQ = testData.passages?.[0]?.questions?.[0];
        if (firstQ) setActiveQuestionId(firstQ.id);

      } catch (err) {
        console.warn('Failed to load exam from DB, loading Cambridge 20 test:', err);
        setAssignment({ id: assignmentId || 'demo', readingTestId: 'cambridge-20-test-2' });
        setTest(CAMBRIDGE_20_READING_TEST_2);
        setSecondsRemaining(60 * 60);
        const firstQ = CAMBRIDGE_20_READING_TEST_2.passages[0]?.questions?.[0];
        if (firstQ) setActiveQuestionId(firstQ.id);
      } finally {
        setLoading(false);
      }
    }
    loadExam();
  }, [assignmentId, navigate, toast]);

  // ── 2. Fullscreen Listener ────────────────────────────
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // ── 3. Split Screen Resizing ──────────────────────────
  const handleMouseDownResizer = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      const totalWidth = rect.width;
      const percent = (newWidth / totalWidth) * 100;
      // Clamp between 25% and 75%
      const clamped = Math.max(25, Math.min(75, percent));
      setSplitRatio(clamped);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Auto-submit ref to avoid circular state initialization
  const autoSubmitRef = useRef(null);

  // ── 4. Countdown Timer ─────────────────────────────────
  useEffect(() => {
    if (loading || !test || submitting) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (autoSubmitRef.current) {
            autoSubmitRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, test, submitting]);

  // ── 5. Flattened Questions List ────────────────────────
  const allQuestions = useMemo(() => {
    if (!test?.passages) return [];
    const list = [];
    test.passages.forEach((p, pIdx) => {
      (p.questions || []).forEach(q => {
        list.push({ ...q, passageIndex: pIdx, passageTitle: p.title });
      });
    });
    return list;
  }, [test]);

  const passages = test?.passages || [];
  const currentPassage = passages[activePassageIdx] || { title: '', text: '', questions: [] };

  // Calculate question range for current active passage
  const currentPassageQuestions = useMemo(() => currentPassage.questions || [], [currentPassage.questions]);
  const passageQStart = currentPassageQuestions[0]?.id?.replace(/^q/, '') || '1';
  const passageQEnd = currentPassageQuestions[currentPassageQuestions.length - 1]?.id?.replace(/^q/, '') || String(currentPassageQuestions.length);

  // Group questions into authentic CD IELTS sections
  const sections = useMemo(() => {
    return groupQuestionsIntoSections(currentPassageQuestions, activePassageIdx);
  }, [currentPassageQuestions, activePassageIdx]);

  // Formatted timer: MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const timerWarningClass = secondsRemaining <= 300
    ? 'timer-warning-red'
    : secondsRemaining <= 600
      ? 'timer-warning-amber'
      : '';

  // In official IELTS, in the last 10 minutes time is forced visible
  const isTimerForcedVisible = secondsRemaining <= 600;

  // Answer handler
  const handleAnswerChange = (qId, val) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  // Flag toggle
  const toggleFlag = (qId) => {
    setFlagged(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Jump to specific question
  const jumpToQuestion = (q) => {
    setActiveQuestionId(q.id);
    if (q.passageIndex !== activePassageIdx) {
      setActivePassageIdx(q.passageIndex);
    }
    setShowReviewModal(false);

    setTimeout(() => {
      const el = document.getElementById(`q-box-${q.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
  };

  // Navigate question (-1 or +1)
  const handleNavigateQuestion = (direction) => {
    const currentIndex = allQuestions.findIndex(q => q.id === activeQuestionId);
    if (currentIndex === -1) return;
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < allQuestions.length) {
      jumpToQuestion(allQuestions[nextIndex]);
    }
  };

  // ── 6. Text Highlighting & Selection Popover ──────────
  const handlePassageMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setSelectionPopover(null);
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect && rect.width > 0) {
        setSelectionPopover({
          x: Math.min(window.innerWidth - 180, Math.max(20, rect.left + rect.width / 2 - 80)),
          y: Math.max(10, rect.top - 44),
          selectedText: selection.toString().trim()
        });
      }
    } catch {
      setSelectionPopover(null);
    }
  }, []);

  const handleApplyHighlight = (color = '#fef08a') => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    try {
      const range = selection.getRangeAt(0);
      const span = document.createElement('mark');
      span.style.backgroundColor = color;
      span.style.borderRadius = '2px';
      span.style.padding = '1px 3px';
      span.className = 'ielts-highlight';
      range.surroundContents(span);
      selection.removeAllRanges();
      setSelectionPopover(null);
    } catch {
      // Cross-node selection gracefully ignored
    }
  };

  const handleClearHighlights = () => {
    if (!passageRef.current) return;
    const highlights = passageRef.current.querySelectorAll('.ielts-highlight');
    highlights.forEach(h => {
      const parent = h.parentNode;
      while (h.firstChild) parent.insertBefore(h.firstChild, h);
      parent.removeChild(h);
    });
    setSelectionPopover(null);
  };

  const handleAddNoteFromSelection = () => {
    if (!selectionPopover) return;
    const newNote = {
      id: `note-${Date.now()}`,
      passageIdx: activePassageIdx,
      x: selectionPopover.x,
      y: selectionPopover.y + 40,
      text: ''
    };
    setNotes(prev => [...prev, newNote]);
    setActiveNoteId(newNote.id);
    setSelectionPopover(null);
  };

  // ── 7. Submission Handler ─────────────────────────────
  const handleSubmitExam = async () => {
    setShowSubmitModal(false);
    setSubmitting(true);
    const timeSpentSecs = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    try {
      const studentId = session?.user?.id || profile?.id;
      const gradedSubmission = await gradeAndSubmitReadingTest({
        assignmentId,
        studentId,
        readingTest: test,
        answers,
        timeSpentSecs,
      });

      toast('🎉 IELTS Reading Exam submitted and graded successfully!');
      navigate(`/student/reading-results/${gradedSubmission.id}`);
    } catch (err) {
      console.error('Submission failed:', err);
      toast(err.message || 'Failed to submit exam', 'error');
      setSubmitting(false);
    }
  };

  useEffect(() => {
    autoSubmitRef.current = () => {
      toast('Time has expired! Submitting your exam answers now...', 'warning');
      handleSubmitExam();
    };
  });

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: '#ffffff', color: '#111827'
      }}>
        <Loader2 size={36} className="g-spin" color="#16a34a" style={{ marginBottom: 14 }} />
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>
          Loading Computer-Delivered IELTS Exam...
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
          Preparing reading passages, question items, and test environment
        </div>
      </div>
    );
  }

  // Answered stats
  const answeredCount = Object.keys(answers).filter(k => answers[k] && String(answers[k]).trim()).length;
  const unansweredCount = allQuestions.length - answeredCount;
  const flaggedCount = Object.keys(flagged).filter(k => flagged[k]).length;

  const currentQIndex = allQuestions.findIndex(q => q.id === activeQuestionId);
  const isFirstQuestion = currentQIndex <= 0;
  const isLastQuestion = currentQIndex >= allQuestions.length - 1;
  const isCurrentFlagged = Boolean(flagged[activeQuestionId]);

  return (
    <div className="cd-ielts-exam-root" onMouseUp={handlePassageMouseUp}>
      {/* ── Submitting Overlay with Gemini AI Grading ── */}
      {submitting && (
        <div className="cd-ielts-modal-overlay">
          <div style={{
            background: '#ffffff', borderRadius: 12, padding: '36px 40px',
            maxWidth: 480, textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }}>
            <Loader2 size={44} className="g-spin" color="#16a34a" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px', color: '#111827' }}>
              Grading Your IELTS Reading Test with AI...
            </h2>
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.5, margin: '0 0 16px' }}>
              Gemini AI is evaluating your answers against the official Cambridge IELTS answer keys, verifying semantic equivalence, and calculating your Band score.
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              padding: '6px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, color: '#15803d'
            }}>
              <span>Evaluating Band 1.0 – 9.0</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 1. Top Header (.ielts-reading-site-header) ── */}
      <header className="cd-ielts-header">
        {/* Left: Focus Mode & HomeTask CD Brand */}
        <div className="cd-ielts-header-left">
          <button
            type="button"
            className="cd-ielts-btn-focus"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Exam Mode'}
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            <span>{isFullscreen ? 'Exit Focus' : 'Focus'}</span>
          </button>

          <div className="cd-ielts-brand-badge">
            <img
              src="/assets/hometask-icon.png"
              alt="HomeTask"
              className="cd-ielts-brand-icon"
            />
            <span className="cd-ielts-brand-text">HomeTask</span>
            <span className="cd-ielts-cd-tag">IELTS CD</span>
          </div>

          <div className="cd-ielts-test-title" title={test?.title || 'Academic Reading Test'}>
            {test?.title || 'Academic Reading Test'}
          </div>
        </div>

        {/* Center: Official Countdown Timer */}
        <div className="cd-ielts-header-center">
          <div className={`cd-ielts-timer-box ${timerWarningClass}`}>
            <Clock size={16} />
            {timerVisible || isTimerForcedVisible ? (
              <span style={{ minWidth: 46, textAlign: 'center' }}>
                {formatTime(secondsRemaining)}
              </span>
            ) : (
              <span style={{ fontSize: 12, color: '#6b7280' }}>Time Hidden</span>
            )}

            {!isTimerForcedVisible && (
              <button
                type="button"
                className="cd-ielts-timer-toggle"
                onClick={() => setTimerVisible(!timerVisible)}
                title={timerVisible ? 'Hide timer' : 'Show timer'}
              >
                {timerVisible ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            )}
          </div>
        </div>

        {/* Right: Help, Review, and Finish Test */}
        <div className="cd-ielts-header-right">
          <button
            type="button"
            className="cd-ielts-btn-header"
            onClick={() => setShowHelpModal(true)}
          >
            <HelpCircle size={14} /> Help
          </button>

          <button
            type="button"
            className="cd-ielts-btn-finish-top"
            onClick={() => setShowSubmitModal(true)}
          >
            <CheckCircle2 size={14} /> Finish Test
          </button>
        </div>
      </header>

      {/* ── 2. Part Announcement Bar (.ielts-reading-part-announcement-container) ── */}
      <div className="cd-ielts-announcement-bar">
        <div className="cd-ielts-announcement-left">
          <span className="cd-ielts-announcement-part-label">
            Part {activePassageIdx + 1}
          </span>
          <span className="cd-ielts-announcement-range-text">
            Read the text and answer questions {passageQStart}–{passageQEnd}
          </span>
        </div>

        <div className="cd-ielts-announcement-right">
          {/* Skimming speed practice tool */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              className={`cd-ielts-btn-focus ${isSkimming ? 'is-skimming-active' : ''}`}
              onClick={() => setIsSkimming(!isSkimming)}
              style={{
                fontSize: 12, padding: '3px 8px',
                backgroundColor: isSkimming ? '#111827' : '#ffffff',
                color: isSkimming ? '#ffffff' : '#374151'
              }}
              title="Practice timed skimming reading pace"
            >
              Practice Skimming ({skimmingSpeed}x)
            </button>
            {isSkimming && (
              <div style={{ display: 'inline-flex', gap: 2 }}>
                <button
                  type="button"
                  className="cd-ielts-zoom-btn"
                  onClick={() => setSkimmingSpeed(s => Math.max(0.5, s - 0.5))}
                  title="Slower speed"
                >-</button>
                <button
                  type="button"
                  className="cd-ielts-zoom-btn"
                  onClick={() => setSkimmingSpeed(s => Math.min(3, s + 0.5))}
                  title="Faster speed"
                >+</button>
              </div>
            )}
          </div>

          {/* Text Font Sizer (A- / A+) */}
          <div className="cd-ielts-zoom-group">
            <button
              type="button"
              className="cd-ielts-zoom-btn"
              onClick={() => setPassageFontSize(s => Math.max(14, s - 1))}
              title="Decrease passage text size"
            >A-</button>
            <button
              type="button"
              className="cd-ielts-zoom-btn"
              onClick={() => setPassageFontSize(s => Math.min(21, s + 1))}
              title="Increase passage text size"
            >A+</button>
          </div>

          {/* Review Checkbox for current question */}
          <label className="cd-ielts-review-checkbox-label" title="Flag or unflag this question for review">
            <input
              type="checkbox"
              checked={isCurrentFlagged}
              onChange={() => toggleFlag(activeQuestionId)}
            />
            {isCurrentFlagged ? (
              <span className="cd-ielts-review-flag-indicator">
                <Flag size={13} fill="#d97706" /> Review
              </span>
            ) : (
              <span>Review</span>
            )}
          </label>
        </div>
      </div>

      {/* ── 3. Main Split View (.ielts-reading-page-content) ── */}
      <main ref={splitContainerRef} className="cd-ielts-split-view">
        {/* Left Column: Passage Text (.ielts-reading-test-transcripts) */}
        <section
          ref={passageRef}
          className="cd-ielts-passage-pane"
          style={{ width: `${splitRatio}%` }}
        >
          {/* Highlighting Toolbar */}
          <div className="cd-ielts-highlight-toolbar">
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Reading Passage {activePassageIdx + 1}
            </div>

            <div className="cd-ielts-highlight-tools">
              <button
                type="button"
                className="cd-ielts-tool-btn yellow-hl"
                onClick={() => handleApplyHighlight('#fef08a')}
                title="Select text in the passage and click to highlight"
              >
                <Highlighter size={13} /> Highlight
              </button>
              <button
                type="button"
                className="cd-ielts-tool-btn"
                onClick={handleClearHighlights}
                title="Clear all highlights in this passage"
              >
                <Eraser size={13} /> Clear
              </button>
            </div>
          </div>

          {/* Passage Title & Body */}
          <h1 className="cd-ielts-passage-subhead">
            {currentPassage.title || `Passage ${activePassageIdx + 1}`}
          </h1>

          <div
            className="cd-ielts-passage-body"
            style={{ fontSize: `${passageFontSize}px` }}
          >
            {currentPassage.text || 'No text provided for this passage.'}
          </div>

          {/* Sticky Notes attached to passage */}
          {notes.filter(n => n.passageIdx === activePassageIdx).map(note => (
            <div
              key={note.id}
              className="cd-ielts-note-box"
              style={{ left: note.x, top: note.y }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#854d0e' }}>IELTS Note</span>
                <button
                  type="button"
                  onClick={() => setNotes(prev => prev.filter(n => n.id !== note.id))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#b91c1c' }}
                  title="Delete note"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <textarea
                className="cd-ielts-note-textarea"
                placeholder="Type your note here..."
                value={note.text}
                onChange={e => {
                  const val = e.target.value;
                  setNotes(prev => prev.map(n => n.id === note.id ? { ...n, text: val } : n));
                }}
              />
            </div>
          ))}
        </section>

        {/* Center Draggable Resizer (.ielts-reading-resize-handle) */}
        <div
          className={`cd-ielts-resizer ${isDragging ? 'is-dragging' : ''}`}
          onMouseDown={handleMouseDownResizer}
          title="Drag to adjust split view width"
        >
          <div className="cd-ielts-resizer-handle-badge">
            <MoveHorizontal size={13} />
          </div>
        </div>

        {/* Right Column: Questions (.ielts-reading-question-container) */}
        <section
          ref={questionsContainerRef}
          className="cd-ielts-questions-pane"
          style={{ width: `${100 - splitRatio}%` }}
        >
          <div className="ielts-reading-question-sections">
            {sections.map((section, sIdx) => {
              const rangeText = section.startQNum === section.endQNum
                ? `Question ${section.startQNum}`
                : `Questions ${section.startQNum}–${section.endQNum}`;

              return (
                <div key={section.id || sIdx} id={`section-${sIdx}`} className="ielts-reading-question-section">
                  {/* Section Heading with Official Badge */}
                  <h2 className="ielts-reading-question-section-heading">
                    <span>{section.title || rangeText}</span>
                    <span
                      className="ielts-reading-practice-section-button"
                      title="Practice just this section"
                      onClick={() => toast(`Practicing ${rangeText}`)}
                    >
                      <Target size={12} /> Practice this section only
                    </span>
                  </h2>

                  {/* Section Instructions */}
                  <div className="ielts-reading-question-section-content">
                    {renderSectionInstructions(section, activePassageIdx)}
                  </div>

                  {/* Section Questions Content */}
                  {renderSectionContent(section, {
                    answers,
                    handleAnswerChange,
                    activeQuestionId,
                    setActiveQuestionId,
                  })}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* ── Contextual Highlight Popover on Text Selection ── */}
      {selectionPopover && (
        <div
          className="cd-ielts-selection-popover"
          style={{ left: selectionPopover.x, top: selectionPopover.y }}
        >
          <button
            type="button"
            className="cd-ielts-popover-btn"
            onClick={() => handleApplyHighlight('#fef08a')}
            style={{ color: '#854d0e', background: '#fef9c3' }}
          >
            <Highlighter size={12} /> Highlight
          </button>
          <button
            type="button"
            className="cd-ielts-popover-btn"
            onClick={handleAddNoteFromSelection}
          >
            <StickyNote size={12} /> Note
          </button>
          <button
            type="button"
            className="cd-ielts-popover-btn"
            onClick={() => setSelectionPopover(null)}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── 4. Bottom CD IELTS Navigation Panel (.ielts-reading-bottom-panel) ── */}
      <footer className="cd-ielts-bottom-panel">
        {/* Left: Previous & Next Question Navigation Arrows */}
        <div className="cd-ielts-bottom-nav-arrows">
          <button
            type="button"
            id="ielts-reading-previous-question-button"
            className="cd-ielts-nav-arrow-btn"
            disabled={isFirstQuestion}
            onClick={() => handleNavigateQuestion(-1)}
            title="Go to previous question"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            type="button"
            id="ielts-reading-next-question-button"
            className="cd-ielts-nav-arrow-btn"
            disabled={isLastQuestion}
            onClick={() => handleNavigateQuestion(1)}
            title="Go to next question"
          >
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Center: Question Palette (.ielts-reading-question-palette) */}
        <div className="cd-ielts-palette-container">
          {passages.map((p, pIdx) => {
            const pQuestions = p.questions || [];
            const isActivePart = activePassageIdx === pIdx;

            return (
              <div
                key={pIdx}
                className={`cd-ielts-palette-part-section ${isActivePart ? 'is-active-part' : ''}`}
                onClick={() => {
                  if (!isActivePart) {
                    setActivePassageIdx(pIdx);
                    if (pQuestions[0]) jumpToQuestion(pQuestions[0]);
                  }
                }}
              >
                <strong className="cd-ielts-palette-part-label">
                  Part {pIdx + 1}:
                </strong>

                {/* When this part is active: render all square question buttons */}
                {isActivePart ? (
                  pQuestions.map(q => {
                    const hasAnswer = Boolean(answers[q.id] && String(answers[q.id]).trim());
                    const isFlagged = Boolean(flagged[q.id]);
                    const isCurrent = activeQuestionId === q.id;
                    const qNum = q.id.replace(/^q/, '');

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          jumpToQuestion(q);
                        }}
                        className={`cd-ielts-palette-num-btn ${hasAnswer ? 'is-answered' : ''} ${isCurrent ? 'is-active' : ''} ${isFlagged ? 'is-flagged' : ''}`}
                        title={`Question ${qNum}${hasAnswer ? ' (Answered)' : ' (Not answered)'}${isFlagged ? ' (Review flagged)' : ''}`}
                      >
                        {qNum}
                      </button>
                    );
                  })
                ) : (
                  /* When this part is inactive: render questions count summary */
                  <span className="cd-ielts-palette-inactive-count">
                    {pQuestions.length} questions
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Review Modal Trigger & Submit Button */}
        <div className="cd-ielts-bottom-actions">
          <button
            type="button"
            id="ielts-reading-test-review-button"
            className="cd-ielts-btn-review"
            onClick={() => setShowReviewModal(true)}
            title="Open comprehensive question review list"
          >
            <ListOrdered size={14} /> Review
          </button>

          <button
            type="button"
            id="ielts-reading-test-submit-button"
            className="cd-ielts-btn-submit"
            onClick={() => setShowSubmitModal(true)}
            title="Submit exam for grading"
          >
            Submit <Send size={13} />
          </button>
        </div>
      </footer>

      {/* ── 5. Review Matrix Modal (.ielts-reading-preview-overlay) ── */}
      {showReviewModal && (
        <div className="cd-ielts-modal-overlay">
          <div className="cd-ielts-modal-dialog" style={{ maxWidth: 640 }}>
            <div className="cd-ielts-modal-header">
              <div>
                <h2 className="cd-ielts-modal-title">Review Questions</h2>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                  Answered: <strong>{answeredCount}</strong> of {allQuestions.length} | Flagged for review: <strong>{flaggedCount}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 6, padding: '10px 24px 0', borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
              {[
                { id: 'all', label: `All (${allQuestions.length})` },
                { id: 'unanswered', label: `Unanswered (${unansweredCount})` },
                { id: 'flagged', label: `Flagged (${flaggedCount})` },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setReviewFilter(f.id)}
                  style={{
                    background: 'none', border: 'none',
                    borderBottom: reviewFilter === f.id ? '2px solid #2563eb' : '2px solid transparent',
                    color: reviewFilter === f.id ? '#1d4ed8' : '#4b5563',
                    fontWeight: 600, fontSize: 13, padding: '8px 12px', cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Review Table */}
            <div className="cd-ielts-modal-body" style={{ padding: 0 }}>
              <table className="cd-ielts-review-table">
                <thead>
                  <tr>
                    <th style={{ width: 60, textAlign: 'center' }}>Q#</th>
                    <th>Part</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th style={{ width: 70, textAlign: 'center' }}>Review</th>
                    <th style={{ width: 80, textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allQuestions
                    .filter(q => {
                      const hasAns = Boolean(answers[q.id] && String(answers[q.id]).trim());
                      const isFlg = Boolean(flagged[q.id]);
                      if (reviewFilter === 'unanswered') return !hasAns;
                      if (reviewFilter === 'flagged') return isFlg;
                      return true;
                    })
                    .map(q => {
                      const hasAns = Boolean(answers[q.id] && String(answers[q.id]).trim());
                      const isFlg = Boolean(flagged[q.id]);
                      const qNum = q.id.replace(/^q/, '');

                      return (
                        <tr key={q.id}>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{qNum}</td>
                          <td>Part {q.passageIndex + 1}</td>
                          <td style={{ fontSize: 12.5, color: '#4b5563' }}>{formatQuestionTypeLabel(q.type)}</td>
                          <td>
                            {hasAns ? (
                              <span style={{ color: '#16a34a', fontWeight: 600, fontSize: 12.5 }}>Answered</span>
                            ) : (
                              <span style={{ color: '#dc2626', fontWeight: 600, fontSize: 12.5 }}>Unanswered</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {isFlg ? <Flag size={14} fill="#f59e0b" color="#d97706" /> : '—'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => jumpToQuestion(q)}
                              style={{
                                background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
                                borderRadius: 4, padding: '3px 8px', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                              }}
                            >
                              Go
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="cd-ielts-modal-footer">
              <button
                type="button"
                className="cd-ielts-btn-header"
                onClick={() => setShowReviewModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="cd-ielts-btn-finish-top"
                onClick={() => {
                  setShowReviewModal(false);
                  setShowSubmitModal(true);
                }}
              >
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Submit Confirmation Modal ── */}
      {showSubmitModal && (
        <div className="cd-ielts-modal-overlay">
          <div className="cd-ielts-modal-dialog" style={{ maxWidth: 480 }}>
            <div className="cd-ielts-modal-header">
              <h2 className="cd-ielts-modal-title">Submit IELTS Reading Exam?</h2>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="cd-ielts-modal-body">
              <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.5, margin: '0 0 16px' }}>
                Are you sure you want to finish the exam? Once submitted, your responses will be evaluated and graded automatically to determine your IELTS Band score.
              </p>

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                padding: '14px 16px', background: '#f8fafc', borderRadius: 8,
                border: '1px solid #e2e8f0', marginBottom: 16
              }}>
                <div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Answered:</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>
                    {answeredCount} / {allQuestions.length}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Unanswered:</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: unansweredCount > 0 ? '#ef4444' : '#16a34a' }}>
                    {unansweredCount}
                  </div>
                </div>
              </div>

              {unansweredCount > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 12.5, color: '#b45309', background: '#fffbeb',
                  padding: '10px 14px', borderRadius: 6, border: '1px solid #fde68a'
                }}>
                  <AlertTriangle size={16} flexShrink={0} />
                  <span>You still have {unansweredCount} unanswered questions. In IELTS, there is no negative marking for incorrect answers.</span>
                </div>
              )}
            </div>

            <div className="cd-ielts-modal-footer">
              <button
                type="button"
                className="cd-ielts-btn-header"
                onClick={() => setShowSubmitModal(false)}
              >
                Return to Exam
              </button>
              <button
                type="button"
                className="cd-ielts-btn-submit"
                onClick={handleSubmitExam}
              >
                Yes, Submit Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Help Modal ── */}
      {showHelpModal && (
        <div className="cd-ielts-modal-overlay">
          <div className="cd-ielts-modal-dialog" style={{ maxWidth: 520 }}>
            <div className="cd-ielts-modal-header">
              <h2 className="cd-ielts-modal-title">Computer-Delivered IELTS Instructions</h2>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="cd-ielts-modal-body">
              <ul style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
                <li><strong>Timing:</strong> You have 60 minutes to complete 40 questions across 3 reading passages.</li>
                <li><strong>Navigation:</strong> Use the <strong>&lt;</strong> and <strong>&gt;</strong> buttons at the bottom, or click any question number on the palette to jump directly to it.</li>
                <li><strong>Review Checkbox:</strong> Check the <strong>Review</strong> box in the top announcement bar or on a question card to mark questions you want to return to later.</li>
                <li><strong>Review Screen:</strong> Click the <strong>Review</strong> button at the bottom right at any time to see which questions you have answered, unanswered, or flagged.</li>
                <li><strong>Highlighting:</strong> Select any text in the reading passage to highlight key facts or add a personal sticky note.</li>
                <li><strong>Submission:</strong> When finished, click <strong>Submit</strong>. Your answers are auto-saved and evaluated with Gemini AI grading.</li>
              </ul>
            </div>

            <div className="cd-ielts-modal-footer">
              <button
                type="button"
                className="cd-ielts-btn-finish-top"
                onClick={() => setShowHelpModal(false)}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper: Group Questions into CD IELTS Sections ───────
function groupQuestionsIntoSections(questions, _passageIdx) {
  if (!Array.isArray(questions) || questions.length === 0) return [];

  const getTypeFamily = (q) => {
    const t = (q.type || '').toLowerCase();
    if (['fill_blank', 'sentence_completion', 'short_answer', 'summary'].includes(t)) return 'completion';
    if (t === 'true_false_ng') return 'tfng';
    if (t === 'yes_no_ng') return 'ynng';
    if (t === 'multiple_choice') return 'mcq';
    if (['matching', 'heading_match'].includes(t)) return 'matching';
    return 'completion';
  };

  const sections = [];
  let currentSec = null;

  questions.forEach((q, idx) => {
    const family = getTypeFamily(q);
    const qNum = parseInt(q.id?.replace(/^q/, '') || String(idx + 1), 10) || (idx + 1);
    const customSectionTitle = q.sectionTitle || q.groupTitle;

    const isNewSection = !currentSec ||
      (customSectionTitle && customSectionTitle !== currentSec.title) ||
      (!customSectionTitle && currentSec.family !== family);

    if (isNewSection) {
      currentSec = {
        id: `sec-${idx}`,
        family,
        startQNum: qNum,
        endQNum: qNum,
        title: customSectionTitle || null,
        instructions: q.instructions || null,
        questions: [q],
      };
      sections.push(currentSec);
    } else {
      currentSec.endQNum = qNum;
      currentSec.questions.push(q);
    }
  });

  return sections;
}

// ── Helper: Parse Sentence with Blank ─────────────────────
function parseSentenceBlank(text) {
  if (!text) return { before: '', after: '', hasBlank: false };

  let cleaned = text.trim();
  cleaned = cleaned.replace(/^[-•*]\s*/, '').replace(/^\d+[.)]\s*/, '').trim();

  const blankRegex = /(?:_{3,}|\[blank\]|\[input\]|\[\s*\d+\s*\]|\.{3,}|<blank>)/i;
  const match = cleaned.match(blankRegex);

  if (match) {
    const idx = match.index;
    const before = cleaned.slice(0, idx);
    const after = cleaned.slice(idx + match[0].length);
    return { before, after, hasBlank: true };
  }

  return { before: cleaned, after: '', hasBlank: false };
}

// ── Helper: Render Section Instructions ──────────────────
function renderSectionInstructions(section, passageIdx) {
  if (section.instructions) {
    return <div dangerouslySetInnerHTML={{ __html: section.instructions }} />;
  }

  switch (section.family) {
    case 'completion':
      return (
        <div>
          <p>Complete the notes below.</p>
          <p>Choose <strong>ONE WORD AND/OR A NUMBER</strong> from the passage for each answer.</p>
        </div>
      );
    case 'tfng':
      return (
        <div>
          <p>Do the following statements agree with the information given in Reading Passage {passageIdx + 1}?</p>
          <p>in boxes on your answer sheet, write</p>
          <p style={{ margin: '4px 0' }}><strong>TRUE</strong> &nbsp; if the statement agrees with the information</p>
          <p style={{ margin: '4px 0' }}><strong>FALSE</strong> &nbsp; if the statement contradicts the information</p>
          <p style={{ margin: '4px 0' }}><strong>NOT GIVEN</strong> &nbsp; if there is no information on this</p>
        </div>
      );
    case 'ynng':
      return (
        <div>
          <p>Do the following statements agree with the claims of the writer in Reading Passage {passageIdx + 1}?</p>
          <p>In boxes on your answer sheet, write</p>
          <p style={{ margin: '4px 0' }}><strong>YES</strong> &nbsp; if the statement agrees with the claims of the writer</p>
          <p style={{ margin: '4px 0' }}><strong>NO</strong> &nbsp; if the statement contradicts the claims of the writer</p>
          <p style={{ margin: '4px 0' }}><strong>NOT GIVEN</strong> &nbsp; if it is impossible to say what the writer thinks about this</p>
        </div>
      );
    case 'mcq':
      return (
        <div>
          <p>Choose the correct letter, <strong>A, B, C or D.</strong></p>
        </div>
      );
    case 'matching':
      return (
        <div>
          <p>Which paragraph contains the following information?</p>
          <p>Write the correct letter, <strong>A–F</strong>, in boxes on your answer sheet.</p>
          <p><strong>NB</strong> &nbsp; You may use any letter more than once.</p>
        </div>
      );
    default:
      return (
        <p>Read the questions below and answer based on Reading Passage {passageIdx + 1}.</p>
      );
  }
}

// ── Helper: Render Section Questions Content ─────────────
function renderSectionContent(section, { answers, handleAnswerChange, activeQuestionId, setActiveQuestionId }) {
  // 1. Completion / Notes / Sentence completion
  if (section.family === 'completion') {
    let lastCategory = null;

    return (
      <div className="ielts-reading-section-content-wrapper">
        {section.questions.map((q) => {
          const qNum = q.id.replace(/^q/, '');
          const currentAnswer = answers[q.id] || '';
          const hasAnswer = Boolean(currentAnswer && String(currentAnswer).trim());
          const isActive = activeQuestionId === q.id;

          const category = q.category || null;
          const showCategory = category && category !== lastCategory;
          if (category) lastCategory = category;

          const { before, after } = parseSentenceBlank(q.questionText);

          return (
            <React.Fragment key={q.id}>
              {/* Category Subheading (e.g. Appearance, Movement, Feeding, Breathing) */}
              {showCategory && (
                <p className="ielts-reading-category-heading">
                  <strong>{category}</strong>
                </p>
              )}

              {/* Context notes if provided */}
              {Array.isArray(q.contextNotes) && q.contextNotes.map((note, nIdx) => (
                <p key={nIdx} className="ielts-reading-note-line">
                  - {note}
                </p>
              ))}

              {/* Question note line with inline badge + input */}
              <p
                id={`q-box-${q.id}`}
                className={`ielts-reading-note-line ${isActive ? 'is-active-line' : ''}`}
                onClick={() => setActiveQuestionId(q.id)}
              >
                - {before}{before && !before.endsWith(' ') ? ' ' : ''}
                <span className="ielts-reading-question-inline">
                  <strong
                    id={`ielts-reading-question-number-${qNum}`}
                    className={`ielts-reading-question-number ${hasAnswer ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveQuestionId(q.id);
                    }}
                    title={`Question ${qNum}`}
                  >
                    {qNum}
                  </strong>
                  <input
                    type="text"
                    className="ielts-reading-input"
                    value={currentAnswer}
                    onChange={e => handleAnswerChange(q.id, e.target.value)}
                    onFocus={() => setActiveQuestionId(q.id)}
                    aria-label={`Question ${qNum}`}
                    spellCheck="false"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                  />
                </span>
                {after ? (after.startsWith(' ') ? after : ` ${after}`) : ''}
              </p>
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // 2. True / False / Not Given & Yes / No / Not Given
  if (section.family === 'tfng' || section.family === 'ynng') {
    const isYn = section.family === 'ynng';
    const defaultOptions = isYn ? ['YES', 'NO', 'NOT GIVEN'] : ['TRUE', 'FALSE', 'NOT GIVEN'];

    return (
      <div className="ielts-reading-questions">
        {section.questions.map((q) => {
          const qNum = q.id.replace(/^q/, '');
          const currentAnswer = answers[q.id] || '';
          const hasAnswer = Boolean(currentAnswer && String(currentAnswer).trim());
          const isActive = activeQuestionId === q.id;
          const options = Array.isArray(q.options) && q.options.length > 0 ? q.options : defaultOptions;
          const cleanPrompt = q.questionText.replace(/^\d+[.)]\s*/, '');

          return (
            <div
              key={q.id}
              id={`q-box-${q.id}`}
              className={`ielts-reading-question-item ${isActive ? 'is-active-item' : ''}`}
              onClick={() => setActiveQuestionId(q.id)}
            >
              <div className="ielts-reading-statement-line">
                <strong
                  id={`ielts-reading-question-number-${qNum}`}
                  className={`ielts-reading-question-number ${hasAnswer ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveQuestionId(q.id);
                  }}
                  title={`Question ${qNum}`}
                >
                  {qNum}
                </strong>
                <span className="ielts-reading-statement-text">{cleanPrompt}</span>
              </div>

              <div className="ielts-reading-options-group">
                {options.map((opt, oIdx) => {
                  const letter = String.fromCharCode(65 + oIdx);
                  const isSelected = (currentAnswer || '').trim().toUpperCase() === opt.trim().toUpperCase();

                  return (
                    <div
                      key={opt}
                      className={`ielts-reading-option ${isSelected ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnswerChange(q.id, opt);
                        setActiveQuestionId(q.id);
                      }}
                    >
                      <label className="ielts-reading-option-letter" htmlFor={`opt-${q.id}-${letter}`}>
                        {letter}
                      </label>
                      <input
                        type="radio"
                        name={`radio-${q.id}`}
                        id={`opt-${q.id}-${letter}`}
                        value={opt}
                        checked={isSelected}
                        onChange={() => {
                          handleAnswerChange(q.id, opt);
                          setActiveQuestionId(q.id);
                        }}
                      />
                      <span>{opt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 3. Multiple Choice
  if (section.family === 'mcq') {
    return (
      <div className="ielts-reading-questions">
        {section.questions.map((q) => {
          const qNum = q.id.replace(/^q/, '');
          const currentAnswer = answers[q.id] || '';
          const hasAnswer = Boolean(currentAnswer && String(currentAnswer).trim());
          const isActive = activeQuestionId === q.id;
          const options = Array.isArray(q.options) && q.options.length > 0
            ? q.options
            : ['Option A', 'Option B', 'Option C', 'Option D'];
          const cleanPrompt = q.questionText.replace(/^\d+[.)]\s*/, '');

          return (
            <div
              key={q.id}
              id={`q-box-${q.id}`}
              className={`ielts-reading-question-item ${isActive ? 'is-active-item' : ''}`}
              onClick={() => setActiveQuestionId(q.id)}
            >
              <div className="ielts-reading-statement-line">
                <strong
                  id={`ielts-reading-question-number-${qNum}`}
                  className={`ielts-reading-question-number ${hasAnswer ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveQuestionId(q.id);
                  }}
                  title={`Question ${qNum}`}
                >
                  {qNum}
                </strong>
                <span className="ielts-reading-statement-text">{cleanPrompt}</span>
              </div>

              <div className="ielts-reading-options-group">
                {options.map((opt, oIdx) => {
                  const defaultLetter = String.fromCharCode(65 + oIdx);
                  const letter = opt.match(/^([A-E])\./i)?.[1]?.toUpperCase() || defaultLetter;
                  const text = opt.replace(/^[A-E]\.\s*/i, '');
                  const isSelected = (currentAnswer || '').trim().toUpperCase() === letter;

                  return (
                    <div
                      key={letter}
                      className={`ielts-reading-option ${isSelected ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnswerChange(q.id, letter);
                        setActiveQuestionId(q.id);
                      }}
                    >
                      <label className="ielts-reading-option-letter" htmlFor={`opt-${q.id}-${letter}`}>
                        {letter}
                      </label>
                      <input
                        type="radio"
                        name={`radio-${q.id}`}
                        id={`opt-${q.id}-${letter}`}
                        value={letter}
                        checked={isSelected}
                        onChange={() => {
                          handleAnswerChange(q.id, letter);
                          setActiveQuestionId(q.id);
                        }}
                      />
                      <span>{text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 4. Matching / Heading Match (Table Layout)
  const matchingColumns = ['A', 'B', 'C', 'D', 'E', 'F'];
  return (
    <div className="ielts-reading-questions">
      <table className="ielts-reading-matching-table">
        <thead>
          <tr>
            <th></th>
            {matchingColumns.map(col => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {section.questions.map(q => {
            const qNum = q.id.replace(/^q/, '');
            const currentAnswer = (answers[q.id] || '').trim().toUpperCase();
            const hasAnswer = Boolean(currentAnswer);
            const isActive = activeQuestionId === q.id;
            const cleanPrompt = q.questionText.replace(/^\d+[.)]\s*/, '');

            return (
              <tr
                key={q.id}
                id={`q-box-${q.id}`}
                className={`ielts-reading-question-item ${isActive ? 'is-active-row' : ''}`}
                onClick={() => setActiveQuestionId(q.id)}
              >
                <td className="ielts-reading-matching-question-cell">
                  <strong
                    id={`ielts-reading-question-number-${qNum}`}
                    className={`ielts-reading-question-number ${hasAnswer ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveQuestionId(q.id);
                    }}
                    title={`Question ${qNum}`}
                  >
                    {qNum}
                  </strong>
                  <span>{cleanPrompt}</span>
                </td>
                {matchingColumns.map(col => (
                  <td key={col} className="ielts-reading-matching-option-cell">
                    <input
                      type="radio"
                      name={`match-q-${q.id}`}
                      value={col}
                      checked={currentAnswer === col}
                      onChange={() => {
                        handleAnswerChange(q.id, col);
                        setActiveQuestionId(q.id);
                      }}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
