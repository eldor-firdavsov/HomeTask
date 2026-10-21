import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, CheckCircle2, Flame, Award, Timer, ShieldCheck, Zap } from 'lucide-react';

const MOTIVATIONAL_QUOTES = [
  { text: "Teaching is the greatest act of optimism.", author: "Colleen Wilcox" },
  { text: "Education is not the learning of facts, but the training of the mind to think.", author: "Albert Einstein" },
  { text: "Small daily efforts lead to monumental results.", author: "Focus Principle" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" }
];

export default function AuthShowcase({ activeRole = 'teacher' }) {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const quote = MOTIVATIONAL_QUOTES[quoteIndex];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px 12px',
      position: 'relative',
    }}>
      {/* Brand Header */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 52,
            height: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <img
              src="/assets/hometask-icon.png"
              alt="HomeTask crest"
              style={{ width: 52, height: 52, objectFit: 'contain' }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text, #202923)' }}>
                HomeTask
              </span>
              <span style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: 'var(--color-accent, #B08A4A)',
                color: '#fff',
                padding: '2.5px 8px',
                borderRadius: 999,
                boxShadow: '0 1px 4px rgba(176, 138, 74, 0.3)',
              }}>
                Academic
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary, #5D685F)', fontWeight: 500 }}>
              IELTS & Classroom Assessment Platform
            </p>
          </div>
        </div>

        <h2 style={{
          fontSize: 32,
          fontWeight: 800,
          color: 'var(--color-text, #202923)',
          letterSpacing: '-0.03em',
          lineHeight: 1.22,
          margin: '0 0 14px',
        }}>
          {activeRole === 'teacher' ? (
            <>
              Elevate your classroom.<br />
              <span style={{
                color: 'var(--color-primary, #244A3A)',
              }}>
                Inspire student success.
              </span>
            </>
          ) : (
            <>
              Stay focused today.<br />
              <span style={{
                color: 'var(--color-primary, #244A3A)',
              }}>
                Achieve your study goals.
              </span>
            </>
          )}
        </h2>

        <p style={{
          fontSize: 14.5,
          color: 'var(--color-text-secondary, #5D685F)',
          lineHeight: 1.6,
          maxWidth: 460,
          margin: '0 0 28px',
        }}>
          {activeRole === 'teacher'
            ? 'Effortlessly curate homework assignments, author IELTS reading exams, review AI diagnostic evaluations, and track student mastery in real time.'
            : 'Track assignments, complete timed IELTS reading exams, and receive instant AI feedback and diagnostic scores.'}
        </p>
      </div>

      {/* Floating Interactive Academic Cards Showcase */}
      <div style={{ position: 'relative', margin: '16px 0 28px', minHeight: 220 }}>
        {/* Card 1: Assignment Card */}
        <div
          className="auth-floating-card-1"
          style={{
            background: 'var(--color-surface, #FFFFFF)',
            border: '1px solid var(--color-border, #DDE3DC)',
            borderRadius: 'var(--radius-lg, 14px)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-card)',
            maxWidth: 380,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-primary, #244A3A)',
              background: 'var(--color-primary-soft, #E6EEE8)',
              padding: '3px 9px',
              borderRadius: 6,
            }}>
              IELTS Reading
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--color-success, #27734B)',
              background: 'var(--color-success-soft, #E7F3EA)',
              border: '1px solid var(--color-border, #DDE3DC)',
              padding: '2.5px 8px',
              borderRadius: 999,
            }}>
              <CheckCircle2 size={12} strokeWidth={2.4} /> Band 8.5 · 38/40
            </span>
          </div>

          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--color-text, #202923)', marginBottom: 8 }}>
            Academic Reading Practice: Climate Systems
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            background: 'var(--color-surface-muted, #F0F3EE)',
            borderRadius: 'var(--radius-sm, 6px)',
            border: '1px solid var(--color-border, #DDE3DC)',
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'var(--color-primary, #244A3A)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
            }}>
              AK
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text, #202923)' }}>
                Ahmadjon Karimov
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary, #5D685F)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                "High precision in True/False/Not Given & Heading matching."
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Momentum / Focus Pill */}
        <div
          className="auth-floating-card-2"
          style={{
            background: 'var(--color-surface, #FFFFFF)',
            border: '1px solid var(--color-border, #DDE3DC)',
            borderRadius: 'var(--radius-md, 10px)',
            padding: '12px 16px',
            boxShadow: 'var(--shadow-modal)',
            maxWidth: 300,
            position: 'absolute',
            right: 12,
            bottom: -16,
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--color-warning-soft, #FBF1DB)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Flame size={20} color="var(--color-accent, #B08A4A)" />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text, #202923)' }}>
              Official 60m CD Simulation
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary, #5D685F)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Timer size={11} /> Real IELTS Exam Engine
            </div>
          </div>
        </div>
      </div>

      {/* Rotating Inspiration Banner */}
      <div style={{
        marginTop: 18,
        padding: '14px 18px',
        background: 'var(--color-surface-muted, #F0F3EE)',
        border: '1px solid var(--color-border, #DDE3DC)',
        borderRadius: 'var(--radius-md, 10px)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}>
        <div style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          background: 'var(--color-primary-soft, #E6EEE8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2,
        }}>
          <Sparkles size={14} color="var(--color-primary, #244A3A)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontStyle: 'italic', color: 'var(--color-text, #202923)', lineHeight: 1.45 }}>
            "{quote.text}"
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent, #B08A4A)', marginTop: 3 }}>
            — {quote.author}
          </div>
        </div>
      </div>

      {/* Feature Badges Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        marginTop: 24,
        paddingTop: 16,
        borderTop: '1px solid var(--color-border, #DDE3DC)',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--color-text-secondary, #5D685F)', fontWeight: 500 }}>
          <ShieldCheck size={14} color="var(--color-primary, #244A3A)" />
          Secure Supabase Auth
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--color-text-secondary, #5D685F)', fontWeight: 500 }}>
          <Zap size={14} color="var(--color-accent, #B08A4A)" />
          Realtime Updates
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--color-text-secondary, #5D685F)', fontWeight: 500 }}>
          <Award size={14} color="var(--color-primary, #244A3A)" />
          Instant AI Grading
        </div>
      </div>
    </div>
  );
}
