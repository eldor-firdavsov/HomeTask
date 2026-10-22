import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import {
  ArrowLeft, Award, Clock, CheckCircle2, XCircle, AlertCircle,
  BookOpen, Sparkles, User, FileText, ChevronRight, Shield, AlertTriangle
} from 'lucide-react';
import {
  getReadingSubmissionById,
  getReadingTest,
  getTeacherReadingAssignments
} from '../../lib/supabase/readingTests';
import { getBandColor, getBandLabel } from '../../lib/supabase/aiGrading';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { CAMBRIDGE_20_READING_TEST_2 } from '../../data/cambridge20Test';

export default function ReadingSubmissionReview() {
  const { submissionId } = useParams();
  const { data } = useData();

  const [submission, setSubmission] = useState(null);
  const [test, setTest] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePassage, setActivePassage] = useState(0);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'wrong' | 'correct'

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const sub = await getReadingSubmissionById(submissionId);
        setSubmission(sub);

        if (sub) {
          // Find student
          const st = (data?.users || []).find(u => u.id === sub.studentId);
          setStudent(st);

          if (sub.test?.passages?.length) {
            setTest(sub.test);
          } else {
            // Find assignment & test
            try {
              const assignments = await getTeacherReadingAssignments();
              const assignment = assignments.find(a => a.id === sub.assignmentId);
              if (assignment?.readingTestId) {
                const t = await getReadingTest(assignment.readingTestId);
                setTest(t);
              }
            } catch (err) {
              console.warn('Teacher reading assignment lookup error:', err);
            }
          }

          setTest(prev => prev || CAMBRIDGE_20_READING_TEST_2);
        }
      } catch (err) {
        console.error('Error loading submission details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [submissionId, data]);

  if (loading) {
    return (
      <div className="g-page" style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--color-text-secondary)' }}>
        <div className="g-spin" style={{ display: 'inline-block', marginBottom: 12 }}>
          <Sparkles size={28} color="var(--color-primary)" />
        </div>
        <div>Loading exam submission details...</div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="g-page" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <AlertCircle size={36} color="#ef4444" style={{ marginBottom: 12 }} />
        <h2>Submission not found</h2>
        <Link to="/teacher/reading-tests" className="g-btn g-btn-primary" style={{ marginTop: 14 }}>
          Back to Reading Tests
        </Link>
      </div>
    );
  }

  const band = submission.bandScore != null ? Number(submission.bandScore) : null;
  const bandColor = band ? getBandColor(band) : 'var(--color-primary)';
  const bandLabel = band ? getBandLabel(band) : '';
  const timeMins = submission.timeSpentSecs ? Math.round(submission.timeSpentSecs / 60) : '—';
  const passages = test?.passages || [];
  const detailedResults = submission.detailedResults || [];
  const isExam = (submission.mode || 'exam') === 'exam';
  const infractions = submission.tabSwitchCount || 0;

  const currentPassage = passages[activePassage] || { title: `Passage ${activePassage + 1}`, text: '', questions: [] };

  // Filter questions for the current passage (or all results if passages not loaded)
  const currentPassageQIds = new Set((currentPassage.questions || []).map(q => q.id));
  const currentPassageResults = (passages.length > 0
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
          { label: 'Dashboard', to: '/teacher/dashboard' },
          { label: 'IELTS Reading', to: '/teacher/reading-tests' },
          { label: `${student ? `${student.firstName} ${student.lastName} – ` : ''}${test?.title || 'Submission Assessment'}`, current: true },
        ]}
      />

      {/* ── Student & Exam Banner ── */}
      <div className="g-card" style={{
        padding: '24px 28px', marginBottom: 20,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'var(--color-primary)',
            boxShadow: '0 2px 8px rgba(36,74,58,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 18, fontWeight: 700
          }}>
            {student ? `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}` : <User size={22} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt-primary)' }}>
                {student ? `${student.firstName} ${student.lastName}` : 'Student'}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 700,
                background: isExam ? 'rgba(239, 68, 68, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                color: isExam ? '#dc2626' : '#2563eb'
              }}>
                {isExam ? <Shield size={12} /> : <Clock size={12} />}
                {isExam ? 'Strict Exam Mode' : 'Practice Mode'}
              </span>
              {isExam && infractions > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 700,
                  background: '#fee2e2', color: '#b91c1c'
                }}>
                  <AlertTriangle size={12} /> {infractions} Tab Switch{infractions > 1 ? 'es' : ''}
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: 'var(--txt-secondary)', display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
              <span>{test?.title || 'IELTS Reading Test'}</span>
              <span>•</span>
              <span>{submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : ''}</span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Clock size={13} /> {timeMins} mins
                {submission.targetTimeMins && ` (target: ${submission.targetTimeMins}m)`}
                {submission.overtimeSecs > 0 && ` • +${Math.round(submission.overtimeSecs / 60)}m overtime`}
              </span>
            </div>
          </div>
        </div>

        {/* Band score badge */}
        {band != null && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 20px', borderRadius: 'var(--r-lg)',
            background: `${bandColor}12`, border: `1px solid ${bandColor}35`
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: bandColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                IELTS Band
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-secondary)' }}>
                {bandLabel}
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: bandColor, lineHeight: 1 }}>
              {band.toFixed(1)}
            </div>
          </div>
        )}
      </div>

      {/* ── Score Metrics & AI Evaluator Feedback ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 22 }}>
        {/* Metrics card */}
        <div className="glass-1" style={{ borderRadius: 'var(--r-xl)', padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Performance Metrics
            </div>
            {isExam ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 11.5, fontWeight: 700,
                color: infractions > 0 ? '#dc2626' : '#16a34a'
              }}>
                {infractions > 0 ? <AlertTriangle size={13} /> : <Shield size={13} />}
                {infractions > 0 ? `${infractions} Tab Violations` : 'Clean Anti-Cheat Session'}
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: '#2563eb' }}>
                <Clock size={13} /> Self-Paced Practice
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--txt-secondary)' }}>Raw Score</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--txt-primary)', marginTop: 2 }}>
                {submission.correctCount || 0} / {submission.totalQuestions || 40}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--txt-secondary)' }}>Accuracy</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginTop: 2 }}>
                {submission.percentage || 0}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--txt-secondary)' }}>Correct Answers</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981', marginTop: 2 }}>
                {submission.correctCount || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--txt-secondary)' }}>Incorrect / Skipped</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444', marginTop: 2 }}>
                {(submission.totalQuestions || 40) - (submission.correctCount || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* AI Evaluator Feedback */}
        <div className="glass-1" style={{
          borderRadius: 'var(--radius-xl)', padding: '20px 24px',
          background: 'var(--color-primary-soft)',
          border: '1px solid rgba(36, 74, 58, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Sparkles size={16} color="var(--color-primary)" />
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Gemini AI Evaluator Feedback
            </div>
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--color-text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {submission.aiFeedback || 'Overall performance has been graded according to official IELTS Academic reading standards.'}
          </div>
        </div>
      </div>

      {/* ── Passage Tabs & Filters ── */}
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
                padding: '8px 16px', borderRadius: 'var(--radius-md)', border: 'none',
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

        {/* Question filter (All / Wrong / Correct) */}
        <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.04)', padding: 3, borderRadius: 8 }}>
          {['all', 'wrong', 'correct'].map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              style={{
                padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', textTransform: 'capitalize',
                background: filterMode === mode ? '#ffffff' : 'transparent',
                color: filterMode === mode ? 'var(--txt-primary)' : 'var(--txt-secondary)',
                boxShadow: filterMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {mode === 'wrong' ? '❌ Wrong only' : mode === 'correct' ? '✅ Correct only' : 'All questions'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Split Layout: Passage Text (Left) & Graded Questions (Right) ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(350px, 1.1fr) minmax(350px, 1fr)',
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
            fontSize: 14, lineHeight: 1.8, color: 'var(--txt-primary)',
            whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif'
          }}>
            {currentPassage.text || 'No passage text provided.'}
          </div>
        </div>

        {/* Right: Questions & Explanations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '75vh', overflowY: 'auto' }}>
          {currentPassageResults.length === 0 ? (
            <div className="glass-1" style={{ padding: '30px 20px', textAlign: 'center', borderRadius: 'var(--r-xl)', color: 'var(--txt-secondary)' }}>
              No questions matching this filter in Passage {activePassage + 1}.
            </div>
          ) : (
            currentPassageResults.map((result, idx) => {
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

                  {/* Answers Comparison */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
                    padding: '8px 12px', borderRadius: 'var(--r-sm)',
                    background: 'rgba(0,0,0,0.02)', margin: '8px 0', fontSize: 12.5
                  }}>
                    <div>
                      <span style={{ color: 'var(--txt-secondary)', display: 'block', fontSize: 11, marginBottom: 2 }}>
                        Student Answer:
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

                  {/* Explanation if wrong */}
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
