import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import {
  Sparkles, Flame, Clock, AlertTriangle, CheckCircle2, ArrowRight,
  RefreshCw, BookOpen, Target, Award, Play, Pause, RotateCcw,
  Search, ChevronRight, Check, Trophy
} from 'lucide-react';
import {
  StatusBadge, TypeChip, isOverdue,
  calcAverageGrade, gradeColor,
} from '../../utils/helpers.jsx';

/* ── Curated Student Motivational Quotes ─────── */
const MOTIVATIONAL_QUOTES = [
  {
    quote: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma",
    tag: "Consistency",
    emoji: "🌱"
  },
  {
    quote: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
    tag: "Action",
    emoji: "🚀"
  },
  {
    quote: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
    tag: "Perseverance",
    emoji: "✨"
  },
  {
    quote: "The expert in anything was once a beginner.",
    author: "Helen Hayes",
    tag: "Growth",
    emoji: "💡"
  },
  {
    quote: "Focus on progress, not perfection.",
    author: "Bill Phillips",
    tag: "Mindset",
    emoji: "🎯"
  },
  {
    quote: "Success is the sum of small efforts, repeated day in and day out.",
    author: "Robert Collier",
    tag: "Habits",
    emoji: "🔥"
  },
  {
    quote: "Education is not the learning of facts, but the training of the mind to think.",
    author: "Albert Einstein",
    tag: "Wisdom",
    emoji: "🧠"
  },
  {
    quote: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
    tag: "Confidence",
    emoji: "⚡"
  },
  {
    quote: "Do what you can, with what you have, where you are.",
    author: "Theodore Roosevelt",
    tag: "Focus",
    emoji: "🌟"
  },
  {
    quote: "Action is the foundational key to all success.",
    author: "Pablo Picasso",
    tag: "Momentum",
    emoji: "🎨"
  },
  {
    quote: "Your future is created by what you do today, not tomorrow.",
    author: "Robert Kiyosaki",
    tag: "Today",
    emoji: "⏳"
  }
];

/* ── Date Helpers ────────────────────────────── */
function isDueToday(deadlineStr) {
  if (!deadlineStr) return false;
  const d = new Date(deadlineStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function getTimeUrgency(assignment) {
  if (!assignment.deadline) return null;
  const dl = new Date(assignment.deadline);
  const now = new Date();
  const diffMs = dl - now;
  const overdue = diffMs < 0;

  if (overdue) {
    const diffHours = Math.abs(Math.round(diffMs / (1000 * 60 * 60)));
    if (diffHours < 24) {
      return { text: `Late by ${diffHours}h`, isOverdue: true, critical: true };
    }
    const diffDays = Math.abs(Math.round(diffMs / (1000 * 60 * 60 * 24)));
    return { text: `Late by ${diffDays}d`, isOverdue: true, critical: true };
  }

  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours <= 3) {
    return { text: `Due in ${Math.max(1, diffHours)}h!`, isDueSoon: true, critical: true };
  }
  if (diffHours <= 12) {
    return { text: `Due in ${diffHours}h`, isDueSoon: true, critical: false };
  }
  if (isDueToday(assignment.deadline)) {
    const timeStr = dl.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { text: `Due today at ${timeStr}`, isDueToday: true, critical: false };
  }
  if (diffMs < 1000 * 60 * 60 * 48) {
    return { text: `Due tomorrow`, isUpcoming: true, critical: false };
  }
  return {
    text: `Due ${dl.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
    isUpcoming: true,
    critical: false
  };
}

function getGreeting(name) {
  const hour = new Date().getHours();
  let timeGreeting = 'Good morning';
  if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
  else if (hour >= 17 && hour < 22) timeGreeting = 'Good evening';
  else if (hour >= 22 || hour < 5) timeGreeting = 'Night focus';

  return `${timeGreeting}, ${name || 'Student'}! 👋`;
}

/* ── Focus Timer Component ───────────────────── */
function FocusTimer({ tasks }) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [completedSessions, setCompletedSessions] = useState(0);

  const activeTaskId = selectedTaskId || tasks[0]?.id || '';

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(s => s - 1);
        } else if (minutes > 0) {
          setMinutes(m => m - 1);
          setSeconds(59);
        } else {
          setIsRunning(false);
          setCompletedSessions(c => c + 1);
          setMinutes(25);
          setSeconds(0);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, minutes, seconds]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setMinutes(25);
    setSeconds(0);
  };

  const selectedTask = tasks.find(t => t.id === activeTaskId);
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalSeconds = 25 * 60;
  const currentSeconds = minutes * 60 + seconds;
  const progressPercent = Math.round(((totalSeconds - currentSeconds) / totalSeconds) * 100);

  return (
    <div
      className="glass-card"
      style={{
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: isRunning ? 'rgba(99,102,241,0.20)' : 'rgba(99,102,241,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent-text)',
          }}>
            <Target size={15} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt-primary)' }}>Study Timer</div>
            <div style={{ fontSize: 11, color: 'var(--txt-secondary)' }}>25-min study block</div>
          </div>
        </div>
        {completedSessions > 0 && (
          <span className="g-chip" style={{ fontSize: 10.5, color: '#059669', borderColor: 'rgba(5,150,105,0.25)', background: 'rgba(5,150,105,0.08)' }}>
            🔥 {completedSessions} done
          </span>
        )}
      </div>

      {/* Timer Display */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.40)',
        border: '1px solid rgba(255,255,255,0.65)',
        borderRadius: 'var(--r-md)',
        padding: '12px 18px',
      }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.05em', color: isRunning ? 'var(--accent-text)' : 'var(--txt-primary)' }}>
            {timeFormatted}
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-tertiary)', marginTop: 2 }}>
            {isRunning ? 'Locked in · Studying' : 'Ready to start'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={toggleTimer}
            className={`g-btn ${isRunning ? 'g-btn-secondary' : 'g-btn-primary'}`}
            style={{ padding: '8px 14px', fontSize: 12.5 }}
            title={isRunning ? 'Pause' : 'Start Study Timer'}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={resetTimer}
            className="g-btn g-btn-ghost"
            style={{ padding: '8px 10px' }}
            title="Reset timer"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div style={{ height: 4, background: 'rgba(99,102,241,0.12)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.5s' }} />
      </div>

      {/* Select task to focus on */}
      {tasks.length > 0 && (
        <div style={{ fontSize: 11.5, color: 'var(--txt-secondary)' }}>
          Studying:{' '}
          <select
            value={activeTaskId}
            onChange={e => setSelectedTaskId(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              fontWeight: 600,
              color: 'var(--accent-text)',
              cursor: 'pointer',
              outline: 'none',
              maxWidth: 180,
              textOverflow: 'ellipsis',
            }}
          >
            {tasks.map(t => (
              <option key={t.id} value={t.id} style={{ color: '#1e2235' }}>
                {t.title}
              </option>
            ))}
          </select>
          {selectedTask && (
            <Link
              to={`/student/pomodoro?taskId=${selectedTask.id}`}
              style={{ marginLeft: 8, color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 600, fontSize: 11.5 }}
            >
              Open Fullscreen Timer ⏱
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Student Dashboard Page ──────────────── */
export default function StudentDashboard() {
  const { data, session } = useData();
  const user = session?.user;

  // Filter tasks assigned to current student
  const myAssignments = useMemo(
    () => (data?.assignments || []).filter(a => a.studentId === user?.id),
    [data?.assignments, user?.id]
  );

  // Motivational quote state
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
  const [quoteSpinning, setQuoteSpinning] = useState(false);
  const currentQuote = MOTIVATIONAL_QUOTES[quoteIdx];

  const handleNextQuote = () => {
    setQuoteSpinning(true);
    setQuoteIdx(prev => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    setTimeout(() => setQuoteSpinning(false), 400);
  };

  // Today's date string
  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Categorize tasks
  // 1. "Do Now / Urgent Priority": Overdue OR Due Today OR Needs Revision
  const nowTasks = useMemo(() => {
    return myAssignments
      .filter(a => {
        if (a.status === 'DONE') return false;
        if (a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW') return false;
        const overdue = isOverdue(a);
        const dueToday = isDueToday(a.deadline);
        const needsRev = a.status === 'NEEDS_REVISION';
        return overdue || dueToday || needsRev;
      })
      .sort((a, b) => {
        // Order: Overdue first, then Needs Revision, then deadline soonest
        const aOver = isOverdue(a);
        const bOver = isOverdue(b);
        if (aOver && !bOver) return -1;
        if (!aOver && bOver) return 1;

        const aRev = a.status === 'NEEDS_REVISION';
        const bRev = b.status === 'NEEDS_REVISION';
        if (aRev && !bRev) return -1;
        if (!aRev && bRev) return 1;

        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      });
  }, [myAssignments]);

  // Tasks in progress (started, not done)
  const inProgressTasks = useMemo(
    () => myAssignments.filter(a => a.status === 'IN_PROGRESS'),
    [myAssignments]
  );

  // Completed tasks
  const doneTasks = useMemo(
    () => myAssignments.filter(a => a.status === 'DONE'),
    [myAssignments]
  );

  // Tasks with feedback/grades
  const feedbackTasks = useMemo(() => {
    return myAssignments
      .filter(a => typeof a.grade === 'number' || a.feedback)
      .slice(0, 3);
  }, [myAssignments]);

  // Statistics
  const totalTasks = myAssignments.length;
  const doneCount = doneTasks.length;
  const urgentCount = nowTasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
  const avgGrade = useMemo(() => user?.id ? calcAverageGrade(user.id, myAssignments) : null, [user, myAssignments]);

  // Tab & dropdown filtering for "Today's Plan" section
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [timeframeFilter, setTimeframeFilter] = useState('all');

  const displayTasks = useMemo(() => {
    let list = myAssignments;

    if (activeTab === 'urgent') {
      list = nowTasks;
    } else if (activeTab === 'in_progress') {
      list = inProgressTasks;
    } else if (activeTab === 'today') {
      list = myAssignments.filter(a => isDueToday(a.deadline) || isOverdue(a));
    } else if (activeTab === 'done') {
      list = doneTasks;
    } else {
      // 'all' actionable: uncompleted first, then completed
      list = [...myAssignments].sort((a, b) => {
        if (a.status === 'DONE' && b.status !== 'DONE') return 1;
        if (a.status !== 'DONE' && b.status === 'DONE') return -1;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      });
    }

    // Type filter
    if (typeFilter !== 'All Types') {
      list = list.filter(a => (a.type || '').toUpperCase() === typeFilter.toUpperCase());
    }

    // Timeframe filter
    if (timeframeFilter !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999);

      if (timeframeFilter === 'today') {
        list = list.filter(a => isDueToday(a.deadline));
      } else if (timeframeFilter === 'this_week') {
        list = list.filter(a => {
          if (!a.deadline) return false;
          const dl = new Date(a.deadline);
          return dl >= startOfToday && dl <= endOfWeek;
        });
      } else if (timeframeFilter === 'overdue') {
        list = list.filter(isOverdue);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        (a.instructions && a.instructions.toLowerCase().includes(q))
      );
    }

    return list;
  }, [myAssignments, activeTab, nowTasks, inProgressTasks, doneTasks, typeFilter, timeframeFilter, searchQuery]);

  // Motivational cheer based on completion
  const motivationalMessage = useMemo(() => {
    if (totalTasks === 0) return "No homework assigned yet. Check back soon or enjoy your day!";
    if (progressPercent === 100) return "🎉 100% Complete! You've crushed all your homework! Great work!";
    if (progressPercent >= 75) return "🔥 You're on fire! Just the final stretch left—finish strong!";
    if (progressPercent >= 50) return "⚡ Over halfway through! Maintain this brilliant momentum!";
    if (urgentCount > 0) return `⏰ You have ${urgentCount} urgent homework ${urgentCount === 1 ? 'assignment' : 'assignments'} waiting. Jump in and knock it out!`;
    return "✨ Ready to make today count? Pick your first homework assignment below and get started!";
  }, [totalTasks, progressPercent, urgentCount]);

  return (
    <div className="g-page" style={{ paddingBottom: 60 }}>
      {/* ── Top Bar / Header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--accent-text)',
            background: 'rgba(99,102,241,0.12)',
            padding: '4px 10px',
            borderRadius: 'var(--r-pill)',
            marginBottom: 8,
          }}>
            <Sparkles size={12} />
            <span>Today's Plan · {todayStr}</span>
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            color: 'var(--txt-primary)',
            margin: 0,
            letterSpacing: '-0.025em'
          }}>
            {getGreeting(user?.firstName)}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--txt-secondary)', margin: '4px 0 0' }}>
            {motivationalMessage}
          </p>
        </div>

        {/* Quick Action Button to all tasks */}
        <Link
          to="/student/tasks"
          className="g-btn g-btn-secondary"
          style={{ padding: '9px 16px', gap: 8, borderRadius: 'var(--r-md)' }}
        >
          <BookOpen size={15} />
          View All Homework ({totalTasks})
        </Link>
      </div>

      {/* ── Hero Row: Motivation & Daily Progress ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        {/* Card 1: Quick Little Motivation */}
        <div
          className="glass-card"
          style={{
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(238,242,255,0.50) 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle decorative glow */}
          <div style={{
            position: 'absolute', top: -20, right: -20, width: 90, height: 90,
            background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16 }}>{currentQuote.emoji}</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: 'var(--accent-text)',
                }}>
                  Daily Motivation · {currentQuote.tag}
                </span>
              </div>
              <button
                onClick={handleNextQuote}
                className="g-btn g-btn-ghost"
                style={{ padding: '4px 8px', fontSize: 11.5, gap: 5, borderRadius: 'var(--r-pill)' }}
                title="Shuffle inspiring quote"
              >
                <RefreshCw size={12} className={quoteSpinning ? 'animate-spin' : ''} />
                <span>Next quote</span>
              </button>
            </div>

            <blockquote style={{
              margin: '0 0 10px',
              fontSize: 14.5,
              fontWeight: 500,
              fontStyle: 'italic',
              color: 'var(--txt-primary)',
              lineHeight: 1.5,
            }}>
              "{currentQuote.quote}"
            </blockquote>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.60)',
            paddingTop: 10,
            marginTop: 6
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-secondary)' }}>
              — {currentQuote.author}
            </span>
            <span style={{ fontSize: 11, color: 'var(--txt-tertiary)' }}>
              Stay inspired ✨
            </span>
          </div>
        </div>

        {/* Card 2: Today's Completion & Momentum */}
        <div
          className="glass-card"
          style={{
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.52)',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#059669',
                }}>
                  <Flame size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt-primary)' }}>Daily Progress</div>
                  <div style={{ fontSize: 11, color: 'var(--txt-secondary)' }}>Overall homework completed</div>
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: progressPercent === 100 ? '#059669' : 'var(--accent-text)' }}>
                {progressPercent}%
              </div>
            </div>

            {/* Progress bar */}
            <div style={{
              height: 10,
              background: 'rgba(0,0,0,0.06)',
              borderRadius: 5,
              overflow: 'hidden',
              marginBottom: 10,
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)'
            }}>
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: progressPercent === 100
                    ? 'linear-gradient(90deg, #10b981, #059669)'
                    : 'linear-gradient(90deg, #6366f1, #818cf8)',
                  borderRadius: 5,
                  transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: 'var(--txt-secondary)',
            borderTop: '1px solid rgba(255,255,255,0.60)',
            paddingTop: 10,
          }}>
            <span>
              <strong>{doneCount}</strong> of <strong>{totalTasks}</strong> completed
            </span>
            {avgGrade != null ? (
              <span style={{ fontWeight: 600, color: gradeColor(avgGrade) }}>
                Avg: {avgGrade}/100 🎯
              </span>
            ) : (
              <span style={{ color: 'var(--txt-tertiary)' }}>Keep learning</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Key Metrics Summary Bar ── */}
      <div className="g-metrics-grid" style={{ marginBottom: 28 }}>
        {/* Do Now (Urgent) */}
        <div className="glass-card" style={{
          padding: '14px 18px',
          borderLeft: urgentCount > 0 ? '3px solid #ef4444' : '3px solid transparent',
          background: urgentCount > 0 ? 'rgba(254,242,242,0.45)' : undefined
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: urgentCount > 0 ? '#b91c1c' : 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Due Soon / Late
            </span>
            <AlertTriangle size={15} style={{ color: urgentCount > 0 ? '#ef4444' : 'var(--txt-tertiary)' }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: urgentCount > 0 ? '#b91c1c' : 'var(--txt-primary)', marginTop: 4 }}>
            {urgentCount}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--txt-secondary)' }}>
            {urgentCount === 0 ? 'All caught up' : 'Needs attention'}
          </div>
        </div>

        {/* In Progress */}
        <div className="glass-card" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--clr-progress-txt)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              In Progress
            </span>
            <Clock size={15} style={{ color: 'var(--clr-progress-txt)' }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--txt-primary)', marginTop: 4 }}>
            {inProgressTasks.length}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--txt-secondary)' }}>
            Currently working on
          </div>
        </div>

        {/* Pending Review */}
        <div className="glass-card" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--clr-submitted-txt)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Checking
            </span>
            <BookOpen size={15} style={{ color: 'var(--clr-submitted-txt)' }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--txt-primary)', marginTop: 4 }}>
            {myAssignments.filter(a => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--txt-secondary)' }}>
            Waiting for teacher
          </div>
        </div>

        {/* Completed */}
        <div className="glass-card" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Completed
            </span>
            <CheckCircle2 size={15} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--txt-primary)', marginTop: 4 }}>
            {doneCount}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--txt-secondary)' }}>
            {avgGrade != null ? `Avg score: ${avgGrade}/100` : 'Finished homework'}
          </div>
        </div>
      </div>

      {/* ── SECTION: WHAT HAS TO BE DONE NOW (Urgent Priority) ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: urgentCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99,102,241,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: urgentCount > 0 ? '#dc2626' : 'var(--accent-text)',
            }}>
              <AlertTriangle size={14} />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--txt-primary)', margin: 0 }}>
              Homework Due Soon
            </h2>
            {urgentCount > 0 && (
              <span className="g-badge g-badge-overdue" style={{ fontSize: 10.5 }}>
                {urgentCount} needs attention
              </span>
            )}
          </div>
          <span style={{ fontSize: 12, color: 'var(--txt-secondary)' }}>
            Assignments with upcoming due dates
          </span>
        </div>

        {nowTasks.length === 0 ? (
          <div className="glass-card" style={{
            padding: '24px',
            textAlign: 'center',
            background: 'rgba(240, 253, 244, 0.50)',
            border: '1px solid rgba(187, 247, 208, 0.60)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'rgba(16,185,129,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#059669',
            }}>
              <Check size={20} strokeWidth={2.5} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#065f46' }}>
              No Urgent Homework Right Now!
            </div>
            <div style={{ fontSize: 12.5, color: '#047857', maxWidth: 420 }}>
              You don't have any late homework, assignments needing changes, or due dates closing in today. Great job staying ahead of schedule!
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 14 }}>
            {nowTasks.map(task => {
              const urgency = getTimeUrgency(task);
              const overdueA = isOverdue(task);
              const isRevision = task.status === 'NEEDS_REVISION';

              return (
                <div
                  key={task.id}
                  className="glass-card"
                  style={{
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderLeft: `4px solid ${overdueA ? '#ef4444' : isRevision ? '#f97316' : '#6366f1'}`,
                    background: overdueA
                      ? 'rgba(254,242,242,0.55)'
                      : isRevision
                        ? 'rgba(255,247,237,0.55)'
                        : 'rgba(255,255,255,0.60)',
                    transition: 'transform var(--t-fast), box-shadow var(--t-fast)',
                  }}
                >
                  <div>
                    {/* Top Tag Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TypeChip type={task.type} />
                        {isRevision ? (
                          <span className="g-badge g-badge-revision" style={{ fontSize: 10 }}>Needs Changes</span>
                        ) : overdueA ? (
                          <span className="g-badge g-badge-overdue" style={{ fontSize: 10 }}>Late</span>
                        ) : (
                          <span className="g-badge g-badge-progress" style={{ fontSize: 10 }}>Due Today</span>
                        )}
                      </div>

                      {urgency && (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: urgency.isOverdue ? '#b91c1c' : urgency.critical ? '#c2410c' : 'var(--accent-text)',
                        }}>
                          {urgency.text}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 style={{
                      fontSize: 15.5,
                      fontWeight: 700,
                      color: 'var(--txt-primary)',
                      margin: '0 0 6px',
                      lineHeight: 1.3
                    }}>
                      {task.title}
                    </h3>

                    {/* Brief instructions snippet */}
                    {task.instructions && (
                      <p style={{
                        fontSize: 12,
                        color: 'var(--txt-secondary)',
                        margin: '0 0 14px',
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {task.instructions}
                      </p>
                    )}
                  </div>

                  {/* Bottom Action Row */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                    paddingTop: 12,
                    marginTop: 6
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--txt-tertiary)' }}>
                      {task.status === 'IN_PROGRESS' ? 'Started · Continue work' : 'Action required'}
                    </div>

                    <Link
                      to={`/student/tasks/${task.id}`}
                      className="g-btn g-btn-primary"
                      style={{
                        padding: '7px 14px',
                        fontSize: 12,
                        gap: 6,
                        background: isRevision
                          ? 'var(--clr-revision-txt)'
                          : overdueA
                            ? '#dc2626'
                            : 'var(--accent)',
                      }}
                    >
                      {isRevision ? 'Fix Homework' : task.status === 'IN_PROGRESS' ? 'Continue Homework' : 'Start Homework'}
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Main Workspace Grid: Action Plan (What to do today) + Focus Timer ── */}
      <div className="g-student-workspace-grid" style={{ marginBottom: 28 }}>
        {/* Left Column: What to do today (Task Checklist & Schedule) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--txt-primary)', margin: 0 }}>
                What To Do Today
              </h2>
              <p style={{ fontSize: 12, color: 'var(--txt-secondary)', margin: '2px 0 0' }}>
                Your study plan and assigned homework
              </p>
            </div>

            {/* Search Input */}
            <div className="g-search-wrap" style={{ minWidth: 200 }}>
              <span className="g-search-icon"><Search size={13} /></span>
              <input
                className="g-search"
                placeholder="Search plan…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '7px 12px 7px 32px', fontSize: 12 }}
              />
            </div>
          </div>

          {/* Filter Tabs & Secondary Dropdowns */}
          <div className="glass-2" style={{ borderRadius: 'var(--r-lg)', padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
              <div className="g-tabs" style={{ gap: 4 }}>
                {[
                  { id: 'all', label: `All (${myAssignments.length})` },
                  { id: 'urgent', label: `Do Now (${urgentCount})` },
                  { id: 'in_progress', label: `In Progress (${inProgressTasks.length})` },
                  { id: 'done', label: `Completed (${doneCount})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    className={`g-tab${activeTab === tab.id ? ' active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    style={{ fontSize: 12, padding: '5px 11px' }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {(searchQuery || typeFilter !== 'All Types' || timeframeFilter !== 'all' || activeTab !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('All Types');
                    setTimeframeFilter('all');
                    setActiveTab('all');
                  }}
                  className="g-btn g-btn-ghost"
                  style={{ fontSize: 11, padding: '4px 8px', color: 'var(--accent-text)' }}
                >
                  Reset filters
                </button>
              )}
            </div>

            {/* Quick dropdown filters */}
            <div style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'wrap',
              borderTop: '1px solid rgba(255,255,255,0.40)',
              paddingTop: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt-secondary)' }}>Subject:</span>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="g-select"
                  style={{ fontSize: 11.5, padding: '4px 8px' }}
                >
                  {['All Types', 'Vocabulary', 'Writing', 'Reading', 'Listening', 'Speaking', 'Grammar', 'Keyword', 'Summary', 'Other'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt-secondary)' }}>Due:</span>
                <select
                  value={timeframeFilter}
                  onChange={e => setTimeframeFilter(e.target.value)}
                  className="g-select"
                  style={{ fontSize: 11.5, padding: '4px 8px' }}
                >
                  <option value="all">Anytime</option>
                  <option value="today">Due Today</option>
                  <option value="this_week">Due This Week</option>
                  <option value="overdue">Late Only</option>
                </select>
              </div>

              <span style={{ fontSize: 11, color: 'var(--txt-tertiary)', marginLeft: 'auto' }}>
                {displayTasks.length} {displayTasks.length === 1 ? 'homework' : 'homeworks'} found
              </span>
            </div>
          </div>

          {/* Task Plan List */}
          {displayTasks.length === 0 ? (
            <div className="glass-section" style={{ borderRadius: 'var(--r-xl)', padding: '36px 20px', textAlign: 'center' }}>
              <div style={{ color: 'var(--txt-tertiary)', marginBottom: 8 }}>
                <CheckCircle2 size={32} style={{ margin: '0 auto', opacity: 0.6 }} />
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--txt-primary)', margin: '0 0 4px' }}>
                No homework matches this filter
              </h4>
              <p style={{ fontSize: 12, color: 'var(--txt-secondary)', margin: 0 }}>
                {searchQuery ? 'Try clearing your search query.' : 'You have no homework in this view.'}
              </p>
            </div>
          ) : (
            <div className="glass-section" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
              {displayTasks.map((task, i) => {
                const overdueA = isOverdue(task);
                const urgency = getTimeUrgency(task);
                const isDone = task.status === 'DONE';

                return (
                  <Link
                    key={task.id}
                    to={`/student/tasks/${task.id}`}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <div
                      className="glass-row"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '14px 18px',
                        borderBottom: i < displayTasks.length - 1 ? '1px solid rgba(255,255,255,0.40)' : 'none',
                        opacity: isDone ? 0.75 : 1,
                      }}
                    >
                      {/* Status indicator dot */}
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: isDone
                          ? '#10b981'
                          : overdueA
                            ? '#ef4444'
                            : task.status === 'IN_PROGRESS'
                              ? '#3b82f6'
                              : 'rgba(99,102,241,0.5)',
                        flexShrink: 0
                      }} />

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'var(--txt-primary)',
                            textDecoration: isDone ? 'line-through' : 'none'
                          }}>
                            {task.title}
                          </span>
                          <TypeChip type={task.type} />
                        </div>

                        <div style={{ fontSize: 11.5, color: overdueA ? 'var(--clr-overdue-txt)' : 'var(--txt-secondary)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {urgency ? (
                            <span>{urgency.text}</span>
                          ) : (
                            <span>No due date set</span>
                          )}
                          {typeof task.grade === 'number' && (
                            <span style={{ fontWeight: 700, color: '#059669' }}>· Grade: {task.grade}/100</span>
                          )}
                        </div>
                      </div>

                      {/* Right side: Badge and arrow */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                        <StatusBadge assignment={task} />
                        <ChevronRight size={14} style={{ color: 'var(--txt-tertiary)' }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Focus Timer & Teacher Feedback */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Focus Timer Widget */}
          <FocusTimer tasks={nowTasks.length > 0 ? nowTasks : myAssignments.filter(a => a.status !== 'DONE')} />

          {/* Quick Study Motivation Card */}
          <div className="glass-card" style={{ padding: '18px 20px', background: 'rgba(255,255,255,0.48)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: 'rgba(245,158,11,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#d97706',
              }}>
                <Trophy size={14} />
              </div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt-primary)', margin: 0 }}>
                Today's Mindset
              </h3>
            </div>
            <p style={{ fontSize: 12, color: 'var(--txt-secondary)', margin: '0 0 10px', lineHeight: 1.45 }}>
              Break complex tasks into 20-minute chunks. When you finish one task today, check it off and take a brief 5-minute break to recharge!
            </p>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-text)' }}>
              Tip: Start with the most urgent task first! ⚡
            </div>
          </div>

          {/* Recent Teacher Feedback & Notes */}
          {feedbackTasks.length > 0 && (
            <div className="glass-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 7,
                  background: 'rgba(16,185,129,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#059669',
                }}>
                  <Award size={14} />
                </div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt-primary)', margin: 0 }}>
                  Recent Teacher Feedback
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {feedbackTasks.map(t => (
                  <Link
                    key={t.id}
                    to={`/student/tasks/${t.id}`}
                    style={{
                      textDecoration: 'none',
                      display: 'block',
                      background: 'rgba(255,255,255,0.40)',
                      border: '1px solid rgba(255,255,255,0.60)',
                      borderRadius: 'var(--r-sm)',
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.title}
                      </span>
                      {typeof t.grade === 'number' && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: gradeColor(t.grade) }}>
                          {t.grade}/100
                        </span>
                      )}
                    </div>
                    {t.feedback ? (
                      <p style={{ fontSize: 11.5, color: 'var(--txt-secondary)', margin: 0, fontStyle: 'italic', lineHeight: 1.4 }}>
                        "{t.feedback}"
                      </p>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--txt-tertiary)' }}>Graded · Tap to view details</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
