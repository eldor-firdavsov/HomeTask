import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import {
  Award, Clock, CheckCircle2, XCircle, ArrowLeft, Sparkles,
  BookOpen, ChevronRight, TrendingUp, AlertCircle, Check, Shield, AlertTriangle
} from 'lucide-react';
import {
  getReadingSubmissionById,
  getReadingTest,
  getMyReadingAssignments
} from '../../lib/supabase/readingTests';
import { getBandColor, getBandLabel } from '../../lib/supabase/aiGrading';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { CAMBRIDGE_20_READING_TEST_2 } from '../../data/cambridge20Test';

export default function StudentReadingResult() {
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePassage, setActivePassage] = useState(0);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'wrong' | 'correct'

  useEffect(() => {
    async function loadResult() {
      setLoading(true);
      try {
        const sub = await getReadingSubmissionById(submissionId);
        setSubmission(sub);

        if (sub?.test?.passages?.length) {
          setTest(sub.test);
        } else if (sub?.assignmentId) {
          try {
            const assignments = await getMyReadingAssignments();
            const assignment = assignments?.find(a => a.id === sub.assignmentId);
            if (assignment?.readingTestId) {
              const t = await getReadingTest(assignment.readingTestId);
              if (t) setTest(t);
            }
          } catch (assignErr) {
            console.warn('Assignment lookup failed, falling back to bundled test:', assignErr);
          }
        }

        // Final fallback if test is still null
        setTest(prev => {
          if (prev?.passages?.length) return prev;
          return CAMBRIDGE_20_READING_TEST_2;
        });
      } catch (err) {
        console.error('Failed to load result:', err);
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [submissionId]);

  if (loading) {
    return (
      <div className="g-page" style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--color-text-secondary)' }}>
        <div className="g-spin" style={{ display: 'inline-block', marginBottom: 12 }}>
          <Sparkles size={28} color="var(--color-primary)" />
        </div>
        <div>Calculating official IELTS Band score...</div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="g-page" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <AlertCircle size={36} color="#ef4444" style={{ marginBottom: 12 }} />
        <h2>Result not found</h2>
        <Link to="/student/dashboard" className="g-btn g-btn-primary" style={{ marginTop: 14 }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const band = submission.bandScore != null ? Number(submission.bandScore) : 0;
  const bandColor = getBandColor(band);
  const bandLabel = getBandLabel(band);
  const timeMins = submission.timeSpentSecs ? Math.round(submission.timeSpentSecs / 60) : '—';
  const passages = test?.passages || [];
  const detailedResults = submission.detailedResults || [];
  const isExam = (submission.mode || 'exam') === 'exam';
  const infractions = Number(submission.tabSwitchCount || 0);

  const currentPassage = passages[activePassage] || { title: `Passage ${activePassage + 1}`, text: '', questions: [] };
  const currentPassageQIds = new Set((currentPassage.questions || []).map(q => q.id));

  const filteredResults = (passages.length > 0
    ? detailedResults.filter(r => currentPassageQIds.has(r.questionId))
    : detailedResults
  ).filter(r => {
    if (filterMode === 'wrong') return !r.isCorrect;
    if (filterMode === 'correct') return r.isCorrect;
    return true;
  });

  return (
    <div className="g-page">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/student/dashboard' },
          { label: 'My Homework', to: '/student/tasks' },
          { label: `${test?.title || 'IELTS Reading'} – Band Evaluation`, current: true },
        ]}
      />

      {/* ── Band Score Hero Banner ── */}
      <div className="glass-1" style={{
        borderRadius: 'var(--radius-xl, 18px)', padding: '32px 36px', marginBottom: 24,
        background: `linear-gradient(135deg, ${bandColor}12, rgba(36, 74, 58, 0.05))`,
        border: `1px solid ${bandColor}35`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 24
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `${bandColor}25`, color: bandColor,
              padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800,
              letterSpacing: '0.04em', textTransform: 'uppercase'
            }}>
              <Award size={14} /> Official IELTS Band Evaluation
            </div>

            {/* Mode badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
              background: isExam ? 'rgba(239, 68, 68, 0.12)' : 'rgba(37, 99, 235, 0.12)',
              color: isExam ? '#dc2626' : '#2563eb'
            }}>
              {isExam ? <Shield size={13} /> : <Clock size={13} />}
              {isExam ? 'Strict Exam Mode' : 'Practice Mode'}
            </div>

            {/* Anti-cheat result if exam */}
            {isExam && infractions > 0 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700,
                background: '#fee2e2', color: '#b91c1c'
              }}>
                <AlertTriangle size={13} /> {infractions} Tab Switch{infractions > 1 ? 'es' : ''} Logged
              </div>
            )}
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--txt-primary)', margin: '0 0 6px' }}>
            {test?.title || 'IELTS Academic Reading Test'}
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--txt-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span>Completed on {new Date(submission.submittedAt).toLocaleDateString()}</span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Clock size={14} /> {timeMins} minutes taken
              {submission.targetTimeMins && ` (target: ${submission.targetTimeMins}m)`}
            </span>
          </p>
        </div>

        {/* Giant Band Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 18,
          padding: '16px 28px', borderRadius: 'var(--r-xl)',
          background: '#ffffff', boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)'
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Overall Band
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: bandColor, marginTop: 2 }}>
              {bandLabel}
            </div>
          </div>
          <div style={{
            fontSize: 48, fontWeight: 900, color: bandColor, lineHeight: 1,
            letterSpacing: '-0.03em'
          }}>
            {band.toFixed(1)}
          </div>
        </div>
      </div>

      {/* ── Key Performance Indicators ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16, marginBottom: 24
      }}>
        <div className="glass-1" style={{ borderRadius: 'var(--r-lg)', padding: '18px 22px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase' }}>
            Total Score
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--txt-primary)', marginTop: 4 }}>
            {submission.correctCount || 0} / {submission.totalQuestions || 40}
          </div>
          <div style={{ fontSize: 12, color: 'var(--txt-secondary)', marginTop: 2 }}>
            Raw marks earned
          </div>
        </div>

        <div className="glass-1" style={{ borderRadius: 'var(--r-lg)', padding: '18px 22px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase' }}>
            Accuracy
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
            {submission.percentage || 0}%
          </div>
          <div style={{ fontSize: 12, color: 'var(--txt-secondary)', marginTop: 2 }}>
            Correct answers
          </div>
        </div>

        <div className="glass-1" style={{ borderRadius: 'var(--r-lg)', padding: '18px 22px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase' }}>
            Time Spent
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--txt-primary)', marginTop: 4 }}>
            {timeMins} mins
          </div>
          <div style={{ fontSize: 12, color: 'var(--txt-secondary)', marginTop: 2 }}>
            Out of 60 minutes
          </div>
        </div>
      </div>

      {/* ── AI Evaluator Feedback ── */}
      <div className="glass-1" style={{
        borderRadius: 'var(--radius-xl)', padding: '24px 28px', marginBottom: 26,
        background: 'var(--color-primary-soft)',
        border: '1px solid rgba(36, 74, 58, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Sparkles size={18} color="var(--color-primary)" />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Gemini AI Evaluator Feedback
          </h2>
        </div>
        <div style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {submission.aiFeedback || 'You have successfully completed this reading simulation.'}
        </div>
      </div>

      {/* ── Test Review Section ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, flexWrap: 'wrap', gap: 12
      }}>
        {/* Passage selection tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {passages.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setActivePassage(idx)}
              style={{
                padding: '8px 18px', borderRadius: 'var(--radius-md)', border: 'none',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: activePassage === idx ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                color: activePassage === idx ? '#ffffff' : 'var(--color-text)',
                transition: 'all 0.15s',
              }}
            >
              Passage {idx + 1}
            </button>
          ))}
        </div>

        {/* Filter questions */}
        <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.04)', padding: 3, borderRadius: 8 }}>
          {['all', 'wrong', 'correct'].map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              style={{
                padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600,
                cursor: 'pointer',
                background: filterMode === mode ? '#ffffff' : 'transparent',
                color: filterMode === mode ? 'var(--txt-primary)' : 'var(--txt-secondary)',
                boxShadow: filterMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {mode === 'wrong' ? '❌ Incorrect only' : mode === 'correct' ? '✅ Correct only' : 'All questions'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Split Layout: Passage Text (Left) & Answers (Right) ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(340px, 1.1fr) minmax(340px, 1fr)',
        gap: 20, alignItems: 'start'
      }}>
        {/* Left: Passage Reader */}
        <div className="glass-1" style={{
          borderRadius: 'var(--r-xl)', padding: '24px 28px',
          maxHeight: '75vh', overflowY: 'auto'
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt-primary)', margin: '0 0 16px' }}>
            {currentPassage.title || `Passage ${activePassage + 1}`}
          </h2>
          <div style={{
            fontSize: 14.5, lineHeight: 1.85, color: 'var(--txt-primary)',
            whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif'
          }}>
            {currentPassage.text || 'No passage text available.'}
          </div>
        </div>

        {/* Right: Question Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '75vh', overflowY: 'auto' }}>
          {filteredResults.length === 0 ? (
            <div className="glass-1" style={{ padding: '30px 20px', textAlign: 'center', borderRadius: 'var(--r-xl)', color: 'var(--txt-secondary)' }}>
              No questions found for this filter.
            </div>
          ) : (
            filteredResults.map((result, idx) => {
              const isCorrect = result.isCorrect;
              return (
                <div
                  key={result.questionId || idx}
                  className="glass-1"
                  style={{
                    borderRadius: 'var(--r-lg)', padding: '16px 20px',
                    borderLeft: `4px solid ${isCorrect ? '#10b981' : '#ef4444'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.4 }}>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 700, marginRight: 6 }}>
                        #{result.questionId?.replace(/^q/, '') || idx + 1}.
                      </span>
                      {result.questionText}
                    </div>
                    {isCorrect ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 11.5, fontWeight: 700, color: '#10b981',
                        background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: 999
                      }}>
                        <CheckCircle2 size={13} /> Correct
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 11.5, fontWeight: 700, color: '#ef4444',
                        background: 'rgba(239,68,68,0.1)', padding: '3px 8px', borderRadius: 999
                      }}>
                        <XCircle size={13} /> Incorrect
                      </span>
                    )}
                  </div>

                  {/* Student vs Correct Answer */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
                    padding: '8px 12px', borderRadius: 'var(--r-sm)',
                    background: 'rgba(0,0,0,0.02)', margin: '8px 0', fontSize: 12.5
                  }}>
                    <div>
                      <span style={{ color: 'var(--txt-secondary)', display: 'block', fontSize: 11, marginBottom: 2 }}>
                        Your Answer:
                      </span>
                      <span style={{ fontWeight: 600, color: isCorrect ? '#10b981' : '#ef4444' }}>
                        {result.studentAnswer || '(no answer)'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--txt-secondary)', display: 'block', fontSize: 11, marginBottom: 2 }}>
                        Correct Answer:
                      </span>
                      <span style={{ fontWeight: 600, color: '#10b981' }}>
                        {result.correctAnswer}
                      </span>
                    </div>
                  </div>

                  {/* AI Explanation */}
                  {result.explanation && (
                    <div style={{
                      fontSize: 12, color: 'var(--color-text-secondary)',
                      background: 'var(--color-surface-muted)', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                      marginTop: 8, borderLeft: '2px solid var(--color-primary)'
                    }}>
                      💡 {result.explanation}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
