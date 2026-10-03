import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useData, useToast } from '../../context/DataContext';
import { updateAssignmentStatus } from '../../lib/supabase/assignments.js';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Coffee,
  Sparkles,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  ArrowRight,
  BookOpen,
  Flame,
  Check,
  Search,
  ExternalLink,
} from 'lucide-react';
import { TypeChip, StatusBadge, isOverdue } from '../../utils/helpers.jsx';

/* ── Web Audio Chime Synthesis (Zero asset dependencies) ── */
let sharedAudioCtx = null;
function initAudio() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function playAudioChime(type = 'focusEnd') {
  try {
    const ctx = initAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'focusEnd') {
      [528, 660, 792, 1056].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
        gain.gain.setValueAtTime(0.24, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + 3.0);
      });
    } else {
      [440, 554, 659.25, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.2, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + 2.4);
      });
    }
  } catch {
    // audio fallback
  }
}

export default function StudentPomodoro() {
  const { data, session, refreshData } = useData();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTaskId = searchParams.get('taskId');

  // Filter student assignments
  const myAssignments = useMemo(
    () => (data?.assignments || []).filter(a => a.studentId === session?.user?.id),
    [data?.assignments, session?.user?.id]
  );

  // Active task selection
  const [selectedTaskId, setSelectedTaskId] = useState(() => {
    if (requestedTaskId && myAssignments.some(a => a.id === requestedTaskId)) {
      return requestedTaskId;
    }
    const urgent = myAssignments.find(a => isOverdue(a) || a.status === 'NEEDS_REVISION');
    if (urgent) return urgent.id;
    const inProgress = myAssignments.find(a => a.status === 'IN_PROGRESS');
    if (inProgress) return inProgress.id;
    return myAssignments[0]?.id || 'general';
  });

  // Sync when query param changes
  useEffect(() => {
    if (requestedTaskId && myAssignments.some(a => a.id === requestedTaskId)) {
      setSelectedTaskId(requestedTaskId);
    }
  }, [requestedTaskId, myAssignments]);

  const selectedTask = useMemo(
    () => myAssignments.find(a => a.id === selectedTaskId),
    [myAssignments, selectedTaskId]
  );

  // Timer configuration
  const [focusDurationMinutes, setFocusDurationMinutes] = useState(25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);

  // Timer states: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK'
  const [phase, setPhase] = useState('FOCUS');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [round, setRound] = useState(1);
  const [completedSessions, setCompletedSessions] = useState(0);

  // Sound and Fullscreen
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [taskFilter, setTaskFilter] = useState('active'); // 'active' | 'all'
  const [taskSearch, setTaskSearch] = useState('');
  const [markingDone, setMarkingDone] = useState(false);

  // Target timestamp ref to eliminate clock drift & background tab freezing
  const targetEndTimeRef = useRef(null);

  // Auto-hide controls in deep focus dark mode after 3.2 seconds of inactivity
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimeoutRef = useRef(null);

  // Total seconds of the current phase
  const currentTotalSeconds = useMemo(() => {
    if (phase === 'FOCUS') return focusDurationMinutes * 60;
    if (phase === 'SHORT_BREAK') return shortBreakMinutes * 60;
    return longBreakMinutes * 60;
  }, [phase, focusDurationMinutes, shortBreakMinutes, longBreakMinutes]);

  // Sync timeLeft when focus duration preset changes and not running
  const handleSelectPreset = (mins) => {
    if (isRunning) return;
    setFocusDurationMinutes(mins);
    if (phase === 'FOCUS') {
      setTimeLeft(mins * 60);
    }
  };

  // Accurate timestamp-based countdown effect (No clock drift)
  useEffect(() => {
    if (!isRunning) {
      targetEndTimeRef.current = null;
      return;
    }

    if (!targetEndTimeRef.current) {
      targetEndTimeRef.current = Date.now() + timeLeft * 1000;
    }

    const checkTick = () => {
      if (!targetEndTimeRef.current) return;
      const remainingMs = targetEndTimeRef.current - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
      setTimeLeft(remainingSec);

      if (remainingMs <= 0) {
        targetEndTimeRef.current = null;
        handlePhaseComplete();
      }
    };

    const intervalId = setInterval(checkTick, 250);

    const onVisibilityChange = () => {
      if (!document.hidden && targetEndTimeRef.current) {
        checkTick();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isRunning, phase]);

  // Handle phase completion transition
  const handlePhaseComplete = async () => {
    targetEndTimeRef.current = null;
    setIsRunning(false);

    if (soundEnabled) {
      playAudioChime(phase === 'FOCUS' ? 'focusEnd' : 'breakEnd');
    }

    if (phase === 'FOCUS') {
      const newCompleted = completedSessions + 1;
      setCompletedSessions(newCompleted);

      // Check if task was PENDING, promote to IN_PROGRESS
      if (selectedTask && selectedTask.status === 'PENDING') {
        try {
          await updateAssignmentStatus(selectedTask.id, 'IN_PROGRESS');
          refreshData?.();
          toast(`Marked "${selectedTask.title}" as In Progress`);
        } catch (err) {
          console.warn('Could not auto-update assignment status:', err);
        }
      }

      toast(`🎉 Focus sprint completed! Time to rest.`);

      // Decide whether next is long break (every 4 rounds) or short break
      if (round >= 4) {
        setPhase('LONG_BREAK');
        setTimeLeft(longBreakMinutes * 60);
        setRound(1);
      } else {
        setPhase('SHORT_BREAK');
        setTimeLeft(shortBreakMinutes * 60);
        setRound(prev => prev + 1);
      }
    } else {
      // Break completed, back to Focus mode
      toast(`✨ Break ended! Ready for the next focus sprint?`);
      setPhase('FOCUS');
      setTimeLeft(focusDurationMinutes * 60);
    }
  };

  const handleStart = async () => {
    initAudio();
    targetEndTimeRef.current = Date.now() + timeLeft * 1000;
    setIsRunning(true);

    // If starting on a PENDING task, automatically promote to IN_PROGRESS
    if (phase === 'FOCUS' && selectedTask && selectedTask.status === 'PENDING') {
      try {
        await updateAssignmentStatus(selectedTask.id, 'IN_PROGRESS');
        refreshData?.();
      } catch (err) {
        console.warn('Could not update status on start:', err);
      }
    }
  };

  const handlePause = () => {
    if (targetEndTimeRef.current) {
      const remainingSec = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remainingSec);
    }
    targetEndTimeRef.current = null;
    setIsRunning(false);
  };

  const handleReset = () => {
    targetEndTimeRef.current = null;
    setIsRunning(false);
    setTimeLeft(currentTotalSeconds);
  };

  const handleSkipPhase = () => {
    targetEndTimeRef.current = null;
    setIsRunning(false);
    if (phase === 'FOCUS') {
      setPhase('SHORT_BREAK');
      setTimeLeft(shortBreakMinutes * 60);
    } else {
      setPhase('FOCUS');
      setTimeLeft(focusDurationMinutes * 60);
    }
  };

  // Mark task as done directly from Pomodoro
  const handleMarkTaskDone = async () => {
    if (!selectedTask || selectedTask.id === 'general') return;
    try {
      setMarkingDone(true);
      await updateAssignmentStatus(selectedTask.id, 'DONE');
      refreshData?.();
      toast(`🎉 Completed "${selectedTask.title}"! Outstanding work!`);
      if (soundEnabled) {
        playAudioChime('breakEnd');
      }
      handlePause();
    } catch (err) {
      toast(err.message || 'Could not update task status', 'error');
    } finally {
      setMarkingDone(false);
    }
  };

  // Keyboard shortcut listener (Space = play/pause, R = reset, F = fullscreen)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isRunning) {
          handlePause();
        } else {
          handleStart();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleBrowserFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, phase, timeLeft, selectedTask]);

  // Browser Fullscreen toggle
  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Format mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Mouse activity in dark mode (fade controls when idle)
  const handleMouseMoveInDark = () => {
    setControlsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3200);
  };

  // Progress percentage
  const progressPercent = Math.min(100, Math.max(0, ((currentTotalSeconds - timeLeft) / currentTotalSeconds) * 100));

  // Filter tasks list
  const filteredAssignments = useMemo(() => {
    let list = [...myAssignments];
    if (taskFilter === 'active') {
      list = list.filter(a => a.status !== 'DONE');
    }
    if (taskSearch.trim()) {
      const q = taskSearch.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(q));
    }
    return list;
  }, [myAssignments, taskFilter, taskSearch]);

  const isDarkModeActive = isRunning && phase === 'FOCUS';

  return (
    <div className="g-page" style={{ paddingBottom: 60, position: 'relative' }}>
      {/* ═══════════════════════════════════════════════════════════
         PURE DEEP FOCUS DARK MODE OVERLAY
         (Smooth non-unmounting overlay: fades in on start, fades out on pause/stop/break)
         Completely dark background (#040407) · Huge running time · Zero distractions
      ═══════════════════════════════════════════════════════════ */}
      <div
        className="pomodoro-dark-overlay"
        onMouseMove={handleMouseMoveInDark}
        onTouchStart={handleMouseMoveInDark}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          background: '#040407',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          padding: '24px 16px',
          cursor: controlsVisible ? 'default' : 'none',
          opacity: isDarkModeActive ? 1 : 0,
          visibility: isDarkModeActive ? 'visible' : 'hidden',
          pointerEvents: isDarkModeActive ? 'auto' : 'none',
          transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.4s ease',
          transform: isDarkModeActive ? 'scale(1)' : 'scale(1.025)',
          overflow: 'hidden',
        }}
      >
        {/* Subtle breathing background ambient aura */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '70vw',
          height: '70vw',
          maxWidth: 600,
          maxHeight: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
          filter: 'blur(45px)',
        }} />

        {/* Minimal top status: Current Task Whisper & Round */}
        <div style={{
          position: 'absolute',
          top: 'max(20px, env(safe-area-inset-top, 20px))',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          opacity: controlsVisible ? 1 : 0.35,
          transition: 'opacity 0.4s ease',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            padding: '6px 16px',
            borderRadius: 999,
            fontSize: 13,
            color: 'rgba(255, 255, 255, 0.90)',
            letterSpacing: '0.015em',
            maxWidth: '85vw',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            <span style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#6366f1',
              boxShadow: '0 0 10px #6366f1',
            }} />
            <span>
              {selectedTask ? selectedTask.title : 'General Deep Focus'}
            </span>
          </div>

          <span style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.45)', whiteSpace: 'nowrap' }}>
            · Round {round}/4
          </span>
        </div>

        {/* ── THE MASSIVE RUNNING TIME (Centered, HUGE, Zero Distractions) ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 'auto',
          textAlign: 'center',
        }}>
          <div
            style={{
              fontSize: 'clamp(96px, 24vw, 250px)',
              fontWeight: 800,
              fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.045em',
              lineHeight: 0.92,
              color: '#ffffff',
              textShadow: '0 0 60px rgba(99, 102, 241, 0.40)',
              transition: 'all 0.15s ease',
            }}
          >
            {formatTime(timeLeft)}
          </div>

          {/* Minimal Breathing Focus Line */}
          <div style={{
            fontSize: 'clamp(12px, 2.4vw, 15px)',
            color: 'rgba(255, 255, 255, 0.42)',
            marginTop: 22,
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            Pure Focus Mode · Zero Distractions
          </div>
        </div>

        {/* Minimal Controls Bar (Fades softly when idle) */}
        <div style={{
          position: 'absolute',
          bottom: 'max(28px, env(safe-area-inset-bottom, 28px))',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
          opacity: controlsVisible ? 1 : 0.15,
          transition: 'opacity 0.4s ease',
        }}>
          <button
            onClick={handlePause}
            className="g-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.14)',
              border: '1px solid rgba(255, 255, 255, 0.28)',
              color: '#ffffff',
              padding: '12px 26px',
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
              cursor: 'pointer',
            }}
          >
            <Pause size={17} />
            Pause Sprint (Space)
          </button>

          {selectedTask && selectedTask.id !== 'general' && selectedTask.status !== 'DONE' && (
            <button
              onClick={handleMarkTaskDone}
              disabled={markingDone}
              className="g-btn"
              style={{
                background: 'rgba(16, 185, 129, 0.22)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                padding: '12px 20px',
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
              title="Mark homework assignment as completed"
            >
              <CheckCircle2 size={16} />
              {markingDone ? 'Completing…' : 'Mark Task Done'}
            </button>
          )}

          <button
            onClick={handleReset}
            className="g-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              color: 'rgba(255, 255, 255, 0.75)',
              padding: '12px 18px',
              fontSize: 13,
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
            title="Stop Timer (R)"
          >
            <RotateCcw size={15} />
            Stop
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="g-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              color: soundEnabled ? '#34d399' : 'rgba(255, 255, 255, 0.5)',
              padding: '12px',
              borderRadius: 999,
              cursor: 'pointer',
            }}
            title={soundEnabled ? 'Chime sound is on' : 'Sound muted'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            onClick={toggleBrowserFullscreen}
            className="g-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              color: 'rgba(255, 255, 255, 0.75)',
              padding: '12px',
              borderRadius: 999,
              cursor: 'pointer',
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen (F)'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>

        {/* Ambient Bottom Progress Line */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'rgba(255, 255, 255, 0.08)',
        }}>
          <div style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: 'linear-gradient(90deg, #6366f1, #818cf8)',
            boxShadow: '0 0 10px rgba(99, 102, 241, 0.8)',
            transition: 'width 0.4s linear',
          }} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
         NORMAL VIEW
         (Visible when paused, stopped, during rest break, or configuring)
      ═══════════════════════════════════════════════════════════ */}
      {/* ── Page Header ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 14,
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
            <Flame size={13} color="#f59e0b" />
            <span>Task-Driven Pomodoro · Sprint Focus</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--txt-primary)', margin: 0, letterSpacing: '-0.025em' }}>
            Focus Sprint Timer
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--txt-secondary)', margin: '4px 0 0' }}>
            Pick a task, enter deep focus with zero distractions, and finish homework faster.
          </p>
        </div>

        {/* Global Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="g-btn g-btn-secondary"
            style={{ padding: '8px 12px', fontSize: 12, gap: 6 }}
            title={soundEnabled ? 'Chime sound is enabled' : 'Muted'}
          >
            {soundEnabled ? <Volume2 size={15} color="#10b981" /> : <VolumeX size={15} />}
            <span>{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          <button
            onClick={toggleBrowserFullscreen}
            className="g-btn g-btn-ghost"
            style={{ padding: '8px 12px', fontSize: 12, gap: 6 }}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>

      {/* ── REST / BREAK ALERT BANNER (If in break mode) ── */}
      {phase !== 'FOCUS' && (
        <div
          className="glass-card"
          style={{
            background: 'linear-gradient(135deg, rgba(236,253,245,0.92) 0%, rgba(209,250,229,0.78) 100%)',
            border: '1px solid rgba(52,211,153,0.4)',
            padding: '20px 24px',
            borderRadius: 'var(--r-xl)',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.12)',
            animation: 'modalPopupSpring 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              background: 'rgba(16,185,129,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              flexShrink: 0,
            }}>
              <Coffee size={24} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#065f46' }}>
                {phase === 'SHORT_BREAK' ? 'Short Rest Break · 5 Mins' : 'Long Rest Break · 15 Mins'}
              </div>
              <div style={{ fontSize: 13, color: '#047857', marginTop: 2 }}>
                Step away from the screen, stretch, drink water, and recharge your mind!
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#059669',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {formatTime(timeLeft)}
            </span>

            <button
              onClick={handleSkipPhase}
              className="g-btn g-btn-primary"
              style={{
                background: '#059669',
                borderColor: '#047857',
                padding: '9px 16px',
                fontSize: 13,
                gap: 6,
              }}
            >
              Skip Break &amp; Focus
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Main Workspace Grid: Timer Card (Left) + Task Picker (Right) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
        gap: 24,
        alignItems: 'start',
      }}>
        {/* ── Left Column: Pomodoro Console & Presets ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Main Dial Glass Card */}
          <div
            className="glass-card"
            style={{
              padding: '32px 28px',
              borderRadius: 'var(--r-xl)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(245,247,255,0.58) 100%)',
            }}
          >
            {/* Phase Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <span style={{
                fontSize: 11.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '4px 12px',
                borderRadius: 999,
                background: phase === 'FOCUS' ? 'rgba(99,102,241,0.14)' : 'rgba(16,185,129,0.16)',
                color: phase === 'FOCUS' ? '#4f46e5' : '#059669',
                border: phase === 'FOCUS' ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(16,185,129,0.3)',
              }}>
                {phase === 'FOCUS' ? (isRunning ? 'Sprint Active' : 'Focus Session') : 'Recharge Break'}
              </span>
            </div>

            {/* Selected Task Highlight Card inside Dial */}
            <div style={{
              background: 'rgba(255,255,255,0.60)',
              border: '1px solid rgba(255,255,255,0.85)',
              borderRadius: 'var(--r-md)',
              padding: '12px 16px',
              marginBottom: 24,
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--txt-tertiary)', letterSpacing: '0.04em' }}>
                  Target Assignment
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                  {selectedTask ? selectedTask.title : 'General Study & Free Practice'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {selectedTask && (
                  <TypeChip type={selectedTask.type} />
                )}
                {selectedTask && selectedTask.id !== 'general' && selectedTask.status !== 'DONE' && (
                  <button
                    onClick={handleMarkTaskDone}
                    disabled={markingDone}
                    className="g-btn"
                    style={{
                      background: 'rgba(16, 185, 129, 0.14)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#059669',
                      padding: '5px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 'var(--r-pill)',
                    }}
                    title="Mark task completed"
                  >
                    <CheckCircle2 size={12} />
                    Done
                  </button>
                )}
              </div>
            </div>

            {/* Timer Digits Display */}
            <div
              style={{
                fontSize: 'clamp(54px, 12vw, 84px)',
                fontWeight: 800,
                fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace',
                fontVariantNumeric: 'tabular-nums',
                color: phase === 'FOCUS' ? 'var(--txt-primary)' : '#059669',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                marginBottom: 20,
              }}
            >
              {formatTime(timeLeft)}
            </div>

            {/* Progress Bar */}
            <div style={{
              height: 8,
              background: 'rgba(0,0,0,0.06)',
              borderRadius: 4,
              overflow: 'hidden',
              marginBottom: 24,
            }}>
              <div style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: phase === 'FOCUS'
                  ? 'linear-gradient(90deg, #6366f1, #818cf8)'
                  : 'linear-gradient(90deg, #10b981, #059669)',
                borderRadius: 4,
                transition: 'width 0.3s ease',
              }} />
            </div>

            {/* Main Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              {phase === 'FOCUS' ? (
                <button
                  onClick={isRunning ? handlePause : handleStart}
                  className="g-btn g-btn-primary"
                  style={{
                    padding: '14px 32px',
                    fontSize: 15,
                    fontWeight: 700,
                    borderRadius: 'var(--r-md)',
                    background: isRunning
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    boxShadow: '0 6px 20px rgba(99, 102, 241, 0.35)',
                    gap: 8,
                  }}
                >
                  {isRunning ? (
                    <>
                      <Pause size={18} />
                      Pause Sprint
                    </>
                  ) : (
                    <>
                      <Play size={18} fill="#fff" />
                      {timeLeft < focusDurationMinutes * 60 ? 'Resume Focus (Dark Mode)' : 'Start Focus (Dark Mode)'}
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={isRunning ? handlePause : handleStart}
                  className="g-btn g-btn-primary"
                  style={{
                    padding: '14px 32px',
                    fontSize: 15,
                    fontWeight: 700,
                    borderRadius: 'var(--r-md)',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                    gap: 8,
                  }}
                >
                  {isRunning ? <Pause size={18} /> : <Play size={18} fill="#fff" />}
                  {isRunning ? 'Pause Break' : 'Resume Break'}
                </button>
              )}

              <button
                onClick={handleReset}
                className="g-btn g-btn-secondary"
                style={{ padding: '14px 18px', fontSize: 14 }}
                title="Reset timer"
              >
                <RotateCcw size={16} />
              </button>

              <button
                onClick={handleSkipPhase}
                className="g-btn g-btn-ghost"
                style={{ padding: '14px 18px', fontSize: 13, color: 'var(--txt-secondary)' }}
                title="Skip to next phase"
              >
                Skip ↷
              </button>
            </div>

            {/* Sprint Info Banner */}
            <p style={{ fontSize: 12, color: 'var(--txt-secondary)', marginTop: 20, marginBottom: 0 }}>
              💡 Starting immediately enters pure dark mode. Pausing or resting returns to normal screen. Press <strong>[Space]</strong> to pause/resume.
            </p>
          </div>

          {/* Focus Presets & Custom Duration Card */}
          <div className="glass-card" style={{ padding: '20px 24px', borderRadius: 'var(--r-lg)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--txt-secondary)', marginBottom: 12 }}>
              Focus Presets
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[15, 25, 45, 60].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleSelectPreset(mins)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--r-sm)',
                    border: focusDurationMinutes === mins ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.7)',
                    background: focusDurationMinutes === mins ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.45)',
                    color: focusDurationMinutes === mins ? 'var(--accent-text)' : 'var(--txt-primary)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {mins} min
                </button>
              ))}
            </div>

            {/* Rounds Progress Tracker */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 18,
              paddingTop: 14,
              borderTop: '1px solid rgba(255,255,255,0.5)',
            }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--txt-primary)' }}>
                  Round {round} of 4
                </div>
                <div style={{ fontSize: 11, color: 'var(--txt-secondary)' }}>
                  {completedSessions} focus sprints finished today
                </div>
              </div>

              {/* Round Beads */}
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 4].map(r => (
                  <div
                    key={r}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: r < round ? '#10b981' : r === round ? 'var(--accent)' : 'rgba(0,0,0,0.12)',
                      boxShadow: r === round ? '0 0 8px rgba(99,102,241,0.5)' : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Task Selector (Choose your assignment) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass-card" style={{ padding: '22px 24px', borderRadius: 'var(--r-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt-primary)', margin: 0 }}>
                  Choose Your Assignment
                </h2>
                <p style={{ fontSize: 12, color: 'var(--txt-secondary)', margin: '2px 0 0' }}>
                  Select the homework to focus on during this sprint
                </p>
              </div>

              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  onClick={() => setTaskFilter('active')}
                  className={`g-tab${taskFilter === 'active' ? ' active' : ''}`}
                  style={{ fontSize: 11.5, padding: '4px 10px' }}
                >
                  Active ({myAssignments.filter(a => a.status !== 'DONE').length})
                </button>
                <button
                  type="button"
                  onClick={() => setTaskFilter('all')}
                  className={`g-tab${taskFilter === 'all' ? ' active' : ''}`}
                  style={{ fontSize: 11.5, padding: '4px 10px' }}
                >
                  All ({myAssignments.length})
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="g-search-wrap" style={{ marginBottom: 14, width: '100%' }}>
              <span className="g-search-icon"><Search size={13} /></span>
              <input
                className="g-search"
                placeholder="Search assignments…"
                value={taskSearch}
                onChange={e => setTaskSearch(e.target.value)}
                style={{ padding: '6px 10px 6px 30px', fontSize: 12, width: '100%' }}
              />
            </div>

            {/* General Study Option */}
            <div
              onClick={() => setSelectedTaskId('general')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--r-md)',
                border: selectedTaskId === 'general' ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.6)',
                background: selectedTaskId === 'general' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                marginBottom: 10,
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(99,102,241,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-text)',
                }}>
                  <Sparkles size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--txt-primary)' }}>
                    General Study &amp; Notes
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--txt-secondary)' }}>
                    Self-guided reading, revision, or flashcards
                  </div>
                </div>
              </div>

              {selectedTaskId === 'general' && (
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Check size={13} strokeWidth={2.5} />
                </div>
              )}
            </div>

            {/* Assignments List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto', paddingRight: 2 }}>
              {filteredAssignments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--txt-secondary)', fontSize: 12.5 }}>
                  No matching tasks found.
                </div>
              ) : (
                filteredAssignments.map(task => {
                  const isSelected = selectedTaskId === task.id;
                  const overdue = isOverdue(task);

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--r-md)',
                        border: isSelected
                          ? '2px solid var(--accent)'
                          : '1px solid rgba(255,255,255,0.65)',
                        background: isSelected
                          ? 'rgba(99,102,241,0.12)'
                          : 'rgba(255,255,255,0.45)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <TypeChip type={task.type} />
                          <StatusBadge assignment={task} />
                          {overdue && (
                            <span className="g-badge g-badge-overdue" style={{ fontSize: 9.5 }}>Overdue</span>
                          )}
                        </div>

                        {isSelected && (
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)',
                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}>
                            <Check size={12} strokeWidth={2.5} />
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--txt-primary)', margin: '4px 0 2px' }}>
                        {task.title}
                      </div>

                      {task.instructions && (
                        <div style={{
                          fontSize: 11.5,
                          color: 'var(--txt-secondary)',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {task.instructions}
                        </div>
                      )}

                      {/* Bottom row: deadline and link */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 8,
                        paddingTop: 6,
                        borderTop: '1px solid rgba(0,0,0,0.04)',
                        fontSize: 11,
                      }}>
                        <span style={{ color: overdue ? '#b91c1c' : 'var(--txt-tertiary)' }}>
                          {task.deadline ? `Due ${new Date(task.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'No deadline'}
                        </span>

                        <Link
                          to={`/student/tasks/${task.id}`}
                          onClick={e => e.stopPropagation()}
                          style={{
                            color: 'var(--accent-text)',
                            textDecoration: 'none',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          View Details <ExternalLink size={10} />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick study tips */}
          <div className="glass-card" style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.45)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} color="#6366f1" /> Why the Pomodoro Technique Works
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--txt-secondary)', margin: 0, lineHeight: 1.5 }}>
              25-minute sprints train your brain to resist distractions. Our pure dark mode shuts out visual clutter so you can achieve peak flow state.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
