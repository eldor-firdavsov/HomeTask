import React from 'react';
import { CheckCircle2, XCircle, Clock, Award, Target, TrendingUp } from 'lucide-react';
import { getBandColor, getBandLabel } from '../../lib/supabase/aiGrading';

/**
 * Displays AI-graded IELTS reading test results
 * 
 * @param {Object} submission - Graded submission object
 * @param {boolean} compact - Compact mode for lists
 */
export default function ResultsCard({ submission, compact = false }) {
  if (!submission || submission.bandScore == null) return null;

  const {
    correctCount, totalQuestions, bandScore, percentage,
    aiFeedback, timeSpentSecs, detailedResults
  } = submission;

  const bandColor = getBandColor(bandScore);
  const bandLabel = getBandLabel(bandScore);

  // Time formatting
  const mins = timeSpentSecs ? Math.floor(timeSpentSecs / 60) : 0;
  const secs = timeSpentSecs ? timeSpentSecs % 60 : 0;
  const timeStr = timeSpentSecs ? `${mins}m ${secs}s` : '—';

  if (compact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '10px 14px', borderRadius: 'var(--r-md)',
        background: 'rgba(255,255,255,0.45)',
        border: '1px solid rgba(255,255,255,0.60)',
      }}>
        {/* Band circle */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${bandColor}22, ${bandColor}44)`,
          border: `2px solid ${bandColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 800, color: bandColor,
        }}>
          {bandScore}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-primary)' }}>
            {correctCount}/{totalQuestions} correct · {percentage}%
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-secondary)' }}>
            {bandLabel} · {timeStr}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: 'var(--radius-xl, 18px)',
      background: 'var(--color-surface, #FFFFFF)',
      border: '1px solid var(--color-border, #DDE3DC)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
    }}>
      {/* Band Score Hero */}
      <div style={{
        textAlign: 'center', padding: '32px 24px 24px',
        background: `linear-gradient(135deg, ${bandColor}0a, ${bandColor}18)`,
        borderBottom: `1px solid var(--color-border, #DDE3DC)`,
      }}>
        {/* Large band circle */}
        <div style={{
          width: 104, height: 104, borderRadius: '50%', margin: '0 auto 16px',
          background: '#ffffff',
          border: `3px solid ${bandColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column',
          boxShadow: `0 4px 16px ${bandColor}20`,
        }}>
          <div style={{ fontSize: 34, fontWeight: 900, color: bandColor, lineHeight: 1 }}>
            {bandScore}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: bandColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Band
          </div>
        </div>

        <div style={{ fontSize: 18, fontWeight: 700, color: bandColor, marginBottom: 4 }}>
          {bandLabel}
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary, #5D685F)' }}>
          IELTS Academic Reading
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1,
        background: 'var(--color-border, #DDE3DC)',
      }}>
        {[
          { icon: <Target size={16} />, label: 'Score', value: `${correctCount}/${totalQuestions}`, color: bandColor },
          { icon: <TrendingUp size={16} />, label: 'Accuracy', value: `${percentage}%`, color: percentage >= 70 ? 'var(--color-success, #27734B)' : 'var(--color-warning, #956515)' },
          { icon: <Clock size={16} />, label: 'Time', value: timeStr, color: 'var(--color-text-secondary, #5D685F)' },
        ].map(stat => (
          <div key={stat.label} style={{
            textAlign: 'center', padding: '16px 10px',
            background: 'var(--color-surface, #FFFFFF)',
          }}>
            <div style={{ color: stat.color, marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary, #5D685F)', textTransform: 'uppercase' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* AI Feedback */}
      {aiFeedback && (
        <div style={{
          padding: '18px 22px', margin: '16px',
          background: 'var(--color-primary-soft, #E6EEE8)',
          borderRadius: 'var(--radius-md, 10px)',
          border: '1px solid var(--color-border, #DDE3DC)',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            color: 'var(--color-primary, #244A3A)', marginBottom: 8, letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Award size={13} /> AI Feedback & Diagnostic Analysis
          </div>
          <div style={{
            fontSize: 13.5, lineHeight: 1.7, color: 'var(--color-text, #202923)',
            whiteSpace: 'pre-line',
          }}>
            {aiFeedback}
          </div>
        </div>
      )}

      {/* Detailed Breakdown */}
      {detailedResults && detailedResults.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{
            fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
            color: 'var(--txt-secondary)', marginBottom: 10, letterSpacing: '0.04em',
          }}>
            Question Breakdown
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {detailedResults.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 12px', borderRadius: 'var(--r-sm)',
                background: r.isCorrect ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                border: `1px solid ${r.isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
                fontSize: 13,
              }}>
                <div style={{ flexShrink: 0, marginTop: 1 }}>
                  {r.isCorrect
                    ? <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                    : <XCircle size={15} style={{ color: '#ef4444' }} />
                  }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--txt-primary)', marginBottom: 2 }}>
                    Q{i + 1}. {r.questionText?.length > 60 ? r.questionText.slice(0, 60) + '…' : r.questionText}
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12 }}>
                    <span style={{ color: r.isCorrect ? '#10b981' : '#ef4444' }}>
                      Your answer: <strong>{r.studentAnswer}</strong>
                    </span>
                    {!r.isCorrect && (
                      <span style={{ color: '#10b981' }}>
                        Correct: <strong>{r.correctAnswer}</strong>
                      </span>
                    )}
                  </div>
                  {r.explanation && !r.isCorrect && (
                    <div style={{ fontSize: 11.5, color: 'var(--txt-secondary)', marginTop: 4, fontStyle: 'italic' }}>
                      {r.explanation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
