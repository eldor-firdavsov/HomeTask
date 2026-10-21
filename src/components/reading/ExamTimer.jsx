import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

/**
 * IELTS Exam Countdown Timer
 * 
 * @param {number} totalSeconds - Total exam time in seconds
 * @param {function} onTimeUp - Called when time runs out
 * @param {boolean} running - Whether the timer is active
 * @param {function} onTick - Optional callback with remaining seconds
 */
export default function ExamTimer({ totalSeconds, onTimeUp, running = true, onTick }) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const intervalRef = useRef(null);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        const next = prev - 1;
        if (onTick) onTick(next);
        if (next <= 0) {
          clearInterval(intervalRef.current);
          setTimeout(() => onTimeUpRef.current?.(), 0);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running, onTick]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = (remaining / totalSeconds) * 100;

  // Color based on time remaining
  const isWarning = remaining <= 600 && remaining > 120; // last 10 min
  const isDanger = remaining <= 120; // last 2 min

  const barColor = isDanger
    ? '#dc2626'
    : isWarning
      ? '#d97706'
      : 'var(--color-primary)';

  const textColor = isDanger
    ? '#b91c1c'
    : isWarning
      ? '#92400e'
      : 'var(--color-text)';

  return (
    <div className="exam-timer" style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 16px', borderRadius: 'var(--radius-lg)',
      background: isDanger
        ? 'rgba(239, 68, 68, 0.10)'
        : isWarning
          ? 'rgba(245, 158, 11, 0.10)'
          : 'var(--color-primary-soft)',
      border: `1px solid ${isDanger ? 'rgba(239,68,68,0.3)' : isWarning ? 'rgba(245,158,11,0.25)' : 'rgba(36,74,58,0.2)'}`,
      transition: 'all 0.5s ease',
    }}>
      {isDanger ? (
        <AlertTriangle size={18} style={{ color: '#ef4444', animation: 'pulse 1s infinite' }} />
      ) : (
        <Clock size={18} style={{ color: barColor }} />
      )}

      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 22, fontWeight: 800, fontFamily: 'monospace',
          color: textColor, letterSpacing: '0.05em', lineHeight: 1,
          animation: isDanger ? 'pulse 1s infinite' : 'none',
        }}>
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%', height: 3, borderRadius: 2,
          background: 'rgba(255,255,255,0.1)', marginTop: 4,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: 2,
            background: barColor,
            transition: 'width 1s linear, background 0.5s',
          }} />
        </div>
      </div>
    </div>
  );
}
