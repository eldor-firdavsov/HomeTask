import React from 'react';
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

/**
 * Renders IELTS question types dynamically
 * 
 * @param {Object} question - Question object
 * @param {string} answer - Current answer value
 * @param {function} onChange - Called with (questionId, value)
 * @param {boolean} disabled - Whether inputs are disabled
 * @param {Object} result - Grading result (for review mode)
 * @param {boolean} showCorrect - Whether to show correct answers
 */
export default function QuestionRenderer({ question, answer, onChange, disabled = false, result, showCorrect = false }) {
  const { id, type, questionText, options } = question;
  const isReview = !!result;

  const handleChange = (value) => {
    if (!disabled) onChange(id, value);
  };

  // Review indicator
  const ReviewIcon = isReview ? (
    result.isCorrect
      ? <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
      : <XCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
  ) : null;

  const containerStyle = {
    padding: '14px 16px',
    borderRadius: 'var(--radius-md)',
    background: isReview
      ? result.isCorrect
        ? 'rgba(16, 185, 129, 0.06)'
        : 'rgba(239, 68, 68, 0.06)'
      : 'var(--color-surface)',
    border: `1px solid ${isReview
      ? result.isCorrect
        ? 'rgba(16, 185, 129, 0.25)'
        : 'rgba(239, 68, 68, 0.25)'
      : 'var(--color-border)'}`,
    marginBottom: 10,
    transition: 'all 0.2s',
  };

  const labelStyle = {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--color-text)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  };

  // Render different question types
  switch ((type || '').toLowerCase()) {
    case 'true_false_ng':
      return (
        <div style={containerStyle}>
          <div style={labelStyle}>
            {ReviewIcon}
            <span>{questionText}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['TRUE', 'FALSE', 'NOT GIVEN'].map(opt => (
              <label key={opt} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                cursor: disabled ? 'default' : 'pointer',
                fontSize: 13, fontWeight: 600,
                background: answer === opt
                  ? isReview
                    ? result.isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'
                    : 'var(--color-primary-soft)'
                  : 'var(--color-surface)',
                border: `1px solid ${answer === opt
                  ? isReview
                    ? result.isCorrect ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'
                    : 'var(--color-primary)'
                  : 'var(--color-border)'}`,
                color: answer === opt ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                transition: 'all 0.15s',
              }}>
                <input
                  type="radio"
                  name={`q-${id}`}
                  value={opt}
                  checked={answer === opt}
                  onChange={() => handleChange(opt)}
                  disabled={disabled}
                  style={{ display: 'none' }}
                />
                {opt}
              </label>
            ))}
          </div>
          {isReview && !result.isCorrect && showCorrect && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-success)', fontWeight: 600 }}>
              ✓ Correct: {result.correctAnswer}
            </div>
          )}
          {isReview && result.explanation && !result.isCorrect && (
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
              {result.explanation}
            </div>
          )}
        </div>
      );

    case 'yes_no_ng':
      return (
        <div style={containerStyle}>
          <div style={labelStyle}>
            {ReviewIcon}
            <span>{questionText}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['YES', 'NO', 'NOT GIVEN'].map(opt => (
              <label key={opt} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                cursor: disabled ? 'default' : 'pointer',
                fontSize: 13, fontWeight: 600,
                background: answer === opt ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                border: `1px solid ${answer === opt ? 'var(--color-primary)' : 'var(--color-border)'}`,
                color: answer === opt ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                transition: 'all 0.15s',
              }}>
                <input
                  type="radio"
                  name={`q-${id}`}
                  value={opt}
                  checked={answer === opt}
                  onChange={() => handleChange(opt)}
                  disabled={disabled}
                  style={{ display: 'none' }}
                />
                {opt}
              </label>
            ))}
          </div>
          {isReview && !result.isCorrect && showCorrect && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-success)', fontWeight: 600 }}>
              ✓ Correct: {result.correctAnswer}
            </div>
          )}
          {isReview && result.explanation && !result.isCorrect && (
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
              {result.explanation}
            </div>
          )}
        </div>
      );

    case 'multiple_choice':
      return (
        <div style={containerStyle}>
          <div style={labelStyle}>
            {ReviewIcon}
            <span>{questionText}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(options || ['A', 'B', 'C', 'D']).map((opt, i) => {
              const letter = String.fromCharCode(65 + i); // A, B, C, D
              const val = opt.startsWith(letter + '.') || opt.startsWith(letter + ')') ? letter : opt;
              const isSelected = answer === val || answer === opt;
              return (
                <label key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                  cursor: disabled ? 'default' : 'pointer',
                  fontSize: 13,
                  background: isSelected ? 'var(--color-primary-soft)' : 'transparent',
                  border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  transition: 'all 0.15s',
                }}>
                  <input
                    type="radio"
                    name={`q-${id}`}
                    value={val}
                    checked={isSelected}
                    onChange={() => handleChange(val)}
                    disabled={disabled}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span style={{ color: 'var(--txt-primary)' }}>{opt}</span>
                </label>
              );
            })}
          </div>
          {isReview && !result.isCorrect && showCorrect && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#10b981', fontWeight: 600 }}>
              ✓ Correct: {result.correctAnswer}
            </div>
          )}
          {isReview && result.explanation && !result.isCorrect && (
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--txt-secondary)', fontStyle: 'italic' }}>
              {result.explanation}
            </div>
          )}
        </div>
      );

    case 'fill_blank':
    case 'short_answer':
    case 'sentence_completion':
      return (
        <div style={containerStyle}>
          <div style={labelStyle}>
            {ReviewIcon}
            <span>{questionText}</span>
          </div>
          <input
            type="text"
            value={answer || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            placeholder="Type your answer..."
            className="g-input"
            style={{
              width: '100%', maxWidth: 400, fontSize: 14, padding: '8px 12px',
              borderColor: isReview
                ? result.isCorrect ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'
                : undefined,
            }}
          />
          {isReview && !result.isCorrect && showCorrect && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#10b981', fontWeight: 600 }}>
              ✓ Correct: {result.correctAnswer}
            </div>
          )}
          {isReview && result.explanation && !result.isCorrect && (
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--txt-secondary)', fontStyle: 'italic' }}>
              {result.explanation}
            </div>
          )}
        </div>
      );

    case 'matching':
    case 'heading_match':
      return (
        <div style={containerStyle}>
          <div style={labelStyle}>
            {ReviewIcon}
            <span>{questionText}</span>
          </div>
          <select
            value={answer || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className="g-input"
            style={{
              width: '100%', maxWidth: 300, fontSize: 14, padding: '8px 12px',
            }}
          >
            <option value="">— Select —</option>
            {(options || []).map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
          {isReview && !result.isCorrect && showCorrect && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#10b981', fontWeight: 600 }}>
              ✓ Correct: {result.correctAnswer}
            </div>
          )}
          {isReview && result.explanation && !result.isCorrect && (
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--txt-secondary)', fontStyle: 'italic' }}>
              {result.explanation}
            </div>
          )}
        </div>
      );

    default:
      // Generic text input fallback
      return (
        <div style={containerStyle}>
          <div style={labelStyle}>
            {ReviewIcon}
            <span>{questionText}</span>
          </div>
          <input
            type="text"
            value={answer || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            placeholder="Type your answer..."
            className="g-input"
            style={{ width: '100%', maxWidth: 400, fontSize: 14, padding: '8px 12px' }}
          />
          {isReview && !result.isCorrect && showCorrect && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#10b981', fontWeight: 600 }}>
              ✓ Correct: {result.correctAnswer}
            </div>
          )}
        </div>
      );
  }
}
