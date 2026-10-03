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
            width: 48,
            height: 48,
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.24) 0%, rgba(139,92,246,0.28) 100%)',
            border: '1px solid rgba(255,255,255,0.7)',
            boxShadow: '0 8px 24px rgba(99,102,241,0.22), inset 0 1px 0 rgba(255,255,255,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <BookOpen size={24} color="#4f46e5" strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--txt-primary)' }}>
                Homework
              </span>
              <span style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                padding: '2.5px 8px',
                borderRadius: 999,
                boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
              }}>
                Pro
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--txt-secondary)', fontWeight: 500 }}>
              Classroom & Student Workflow OS
            </p>
          </div>
        </div>

        <h2 style={{
          fontSize: 32,
          fontWeight: 800,
          color: 'var(--txt-primary)',
          letterSpacing: '-0.03em',
          lineHeight: 1.22,
          margin: '0 0 14px',
        }}>
          {activeRole === 'teacher' ? (
            <>
              Elevate your classroom.<br />
              <span style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Inspire student success.
              </span>
            </>
          ) : (
            <>
              Stay focused today.<br />
              <span style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Achieve your study goals.
              </span>
            </>
          )}
        </h2>

        <p style={{
          fontSize: 14.5,
          color: 'var(--txt-secondary)',
          lineHeight: 1.6,
          maxWidth: 460,
          margin: '0 0 28px',
        }}>
          {activeRole === 'teacher'
            ? 'Effortlessly curate homework assignments, grade submissions with personalized audio & text feedback, and track student mastery in real time.'
            : 'Track today’s assignments, launch focused 25-minute Pomodoro study sprints, and submit your work seamlessly to receive instant feedback.'}
        </p>
      </div>

      {/* Floating Interactive Glass Cards Showcase */}
      <div style={{ position: 'relative', margin: '16px 0 28px', minHeight: 220 }}>
        {/* Card 1: Assignment Card */}
        <div
          className="auth-floating-card-1"
          style={{
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.85)',
            borderRadius: 'var(--r-lg)',
            padding: '18px 20px',
            boxShadow: '0 16px 36px rgba(30, 40, 100, 0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
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
              color: '#4f46e5',
              background: 'rgba(99,102,241,0.12)',
              padding: '3px 9px',
              borderRadius: 6,
            }}>
              Writing Task
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--clr-done-txt)',
              background: 'var(--clr-done)',
              border: '1px solid var(--clr-done-bd)',
              padding: '2.5px 8px',
              borderRadius: 999,
            }}>
              <CheckCircle2 size={12} strokeWidth={2.4} /> Reviewed · 98% (A+)
            </span>
          </div>

          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--txt-primary)', marginBottom: 8 }}>
            How Technology Transforms Modern Learning
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            background: 'rgba(255, 255, 255, 0.5)',
            borderRadius: 'var(--r-sm)',
            border: '1px solid rgba(255, 255, 255, 0.65)',
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
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
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-primary)' }}>
                Ahmadjon Karimov
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                "Well-structured body arguments and clear conclusion."
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Momentum / Focus Pill */}
        <div
          className="auth-floating-card-2"
          style={{
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            borderRadius: 'var(--r-md)',
            padding: '12px 16px',
            boxShadow: '0 12px 28px rgba(30, 40, 100, 0.09)',
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
            background: 'rgba(245, 158, 11, 0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Flame size={20} color="#d97706" />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--txt-primary)' }}>
              7-Day Streak Active
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Timer size={11} /> 25m Focus Sprint ready
            </div>
          </div>
        </div>
      </div>

      {/* Rotating Inspiration Banner */}
      <div style={{
        marginTop: 18,
        padding: '14px 18px',
        background: 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.6)',
        borderRadius: 'var(--r-md)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}>
        <div style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          background: 'rgba(99,102,241,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2,
        }}>
          <Sparkles size={14} color="#6366f1" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontStyle: 'italic', color: 'var(--txt-primary)', lineHeight: 1.45 }}>
            "{quote.text}"
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-text)', marginTop: 3 }}>
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
        borderTop: '1px solid rgba(255, 255, 255, 0.45)',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--txt-secondary)', fontWeight: 500 }}>
          <ShieldCheck size={14} color="#10b981" />
          Secure Supabase Auth
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--txt-secondary)', fontWeight: 500 }}>
          <Zap size={14} color="#6366f1" />
          Realtime Updates
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--txt-secondary)', fontWeight: 500 }}>
          <Award size={14} color="#8b5cf6" />
          Instant Feedback
        </div>
      </div>
    </div>
  );
}
