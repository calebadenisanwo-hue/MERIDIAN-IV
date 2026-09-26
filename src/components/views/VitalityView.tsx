import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  Moon,
  Sun,
  Smile,
  Zap,
  CheckCircle2,
  Calendar,
  History,
  Trash2,
  Sparkles,
  Award,
  Flame,
  Plus,
  AlertCircle,
  Timer,
  Clock,
  Heart,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PulseState, PulseLog, HabitItem, RecoveryState, RecoveryQuit, RecoveryLog } from '../../types';
import { MeridianStorage, fmtDateShort, todayStr, daysAgoStr, RECOVERY_MILESTONES } from '../../services/storage';
import { Haptics } from '../../services/haptics';

interface VitalityViewProps {
  initialSubTab?: 'habits' | 'recovery';
}

export const VitalityView: React.FC<VitalityViewProps> = ({ initialSubTab = 'habits' }) => {
  const [subTab, setSubTab] = useState<'habits' | 'recovery'>(initialSubTab);

  // Pulse State
  const [pulseState, setPulseState] = useState<PulseState>(() => MeridianStorage.getPulse());
  const [pulseActiveView, setPulseActiveView] = useState<'today' | 'habits_grid' | 'history'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [sleepQuality, setSleepQuality] = useState<number>(4);
  const [mood, setMood] = useState<number>(4);
  const [energy, setEnergy] = useState<number>(4);
  const [focus, setFocus] = useState<number>(4);
  const [note, setNote] = useState<string>('');
  const [habitChecks, setHabitChecks] = useState<Record<string, boolean>>({});

  // Recovery State
  const [recoveryState, setRecoveryState] = useState<RecoveryState>(() => MeridianStorage.getRecovery());
  const [recoveryActiveView, setRecoveryActiveView] = useState<'overview' | 'urges' | 'milestones'>('overview');
  const [urgeModalOpen, setUrgeModalOpen] = useState(false);
  const [urgeIntensity, setUrgeIntensity] = useState(3);
  const [urgeTrigger, setUrgeTrigger] = useState('');
  const [urgeCountdownSeconds, setUrgeCountdownSeconds] = useState(300); // 5 min delay
  const [isCountingDown, setIsCountingDown] = useState(false);

  // Sync today's log if available
  useEffect(() => {
    const today = todayStr();
    const existing = pulseState.logs.find(l => l.date === today);
    if (existing) {
      if (existing.sleepHours != null) setSleepHours(existing.sleepHours);
      if (existing.sleepQuality != null) setSleepQuality(existing.sleepQuality);
      if (existing.mood != null) setMood(existing.mood);
      if (existing.energy != null) setEnergy(existing.energy);
      if (existing.focus != null) setFocus(existing.focus);
      if (existing.note) setNote(existing.note);
      if (existing.habits) setHabitChecks(existing.habits);
    }
  }, [pulseState.logs]);

  // Urge Countdown Timer
  useEffect(() => {
    let t: any = null;
    if (isCountingDown && urgeCountdownSeconds > 0) {
      t = setInterval(() => setUrgeCountdownSeconds(s => s - 1), 1000);
    } else if (urgeCountdownSeconds === 0 && isCountingDown) {
      setIsCountingDown(false);
      Haptics.success();
      confetti({ particleCount: 40, spread: 60 });
    }
    return () => {
      if (t) clearInterval(t);
    };
  }, [isCountingDown, urgeCountdownSeconds]);

  // Clean time calculations
  const activeQuit = recoveryState.quits?.[0] || {
    id: 'default_sobriety',
    title: 'Digital & Behavioral Sobriety',
    quitTimestamp: Date.now() - 7 * 86400000,
    targetDays: 90,
  };

  const daysClean = Math.max(
    0,
    Math.floor((Date.now() - activeQuit.quitTimestamp) / (1000 * 60 * 60 * 24))
  );

  const handleSavePulseLog = (e: React.FormEvent) => {
    e.preventDefault();
    Haptics.success();

    const existingIndex = pulseState.logs.findIndex(l => l.date === selectedDate);
    const existing = existingIndex >= 0 ? pulseState.logs[existingIndex] : null;

    const newLog: PulseLog = {
      date: selectedDate,
      sleepHours,
      sleepQuality,
      mood,
      energy,
      focus,
      habits: { ...(existing?.habits || {}), ...habitChecks },
      note: note.trim() || undefined,
      timestamp: new Date().toISOString(),
    };

    let updatedLogs = [...pulseState.logs];
    if (existingIndex >= 0) {
      updatedLogs[existingIndex] = { ...existing, ...newLog };
    } else {
      updatedLogs = [newLog, ...updatedLogs];
    }

    const newState = {
      ...pulseState,
      logs: updatedLogs,
    };
    setPulseState(newState);
    MeridianStorage.savePulse(newState);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
  };

  const handleToggleHabit = (habitId: string) => {
    Haptics.selection();
    const newChecks = { ...habitChecks, [habitId]: !habitChecks[habitId] };
    setHabitChecks(newChecks);

    const today = todayStr();
    const existingIndex = pulseState.logs.findIndex(l => l.date === today);
    let updatedLogs = [...pulseState.logs];
    if (existingIndex >= 0) {
      updatedLogs[existingIndex] = {
        ...updatedLogs[existingIndex],
        habits: newChecks,
      };
    } else {
      updatedLogs.unshift({
        date: today,
        habits: newChecks,
        sleepHours: 7.5,
        mood: 4,
        energy: 4,
        focus: 4,
      });
    }

    const newState = { ...pulseState, logs: updatedLogs };
    setPulseState(newState);
    MeridianStorage.savePulse(newState);
  };

  const handleLogUrge = () => {
    Haptics.medium();
    const newLog: RecoveryLog = {
      id: 'rl_' + Date.now().toString(36),
      quitId: activeQuit.id,
      timestamp: Date.now(),
      type: 'urge',
      intensity: urgeIntensity,
      trigger: urgeTrigger.trim() || 'Urge successfully delayed and resisted',
    };
    const newState = {
      ...recoveryState,
      logs: [newLog, ...recoveryState.logs],
    };
    setRecoveryState(newState);
    MeridianStorage.saveRecovery(newState);
    setUrgeModalOpen(false);
    setUrgeTrigger('');
    confetti({ particleCount: 40, spread: 65, origin: { y: 0.6 } });
  };

  const activeHabits = (pulseState.habits || []).filter(h => !h.archived);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ═══════════════════════════════════════════════════════════════
          MATERIAL 3 EXPRESSIVE HERO BANNER & DOMAIN SWITCHER
          ═══════════════════════════════════════════════════════════════ */}
      <div
        className="p-6 sm:p-7 rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm relative overflow-hidden transition-all"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">
                Vitality & Behavioral Resilience
              </span>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                Active System
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-on-surface tracking-tight">
              Health, Habits & Sobriety
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-lg leading-relaxed">
              Maintain recursive daily discipline, track sleep restoration, and protect clean streaks with impulse resistance.
            </p>
          </div>

          {/* Clean Streak Telemetry Pill */}
          <div className="flex items-center gap-3">
            <div className="p-3.5 px-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant text-center">
              <div className="text-[10px] font-mono uppercase text-on-surface-variant font-bold">Clean Streak</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">{daysClean}d</div>
              <div className="text-[10px] font-mono text-on-surface-variant">Milestone: 30d</div>
            </div>
            <div className="p-3.5 px-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant text-center">
              <div className="text-[10px] font-mono uppercase text-on-surface-variant font-bold">Habits Today</div>
              <div className="text-2xl font-bold font-mono text-primary mt-0.5">
                {Object.values(habitChecks).filter(Boolean).length}/{activeHabits.length}
              </div>
              <div className="text-[10px] font-mono text-on-surface-variant">Completed</div>
            </div>
          </div>
        </div>

        {/* Expressive Segmented Hub Switcher */}
        <div className="flex p-1.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant mt-6 gap-1.5">
          <button
            type="button"
            onClick={() => {
              Haptics.selection();
              setSubTab('habits');
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              subTab === 'habits'
                ? 'bg-primary-container text-on-primary-container shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Daily Habits & Sleep Telemetry</span>
          </button>

          <button
            type="button"
            onClick={() => {
              Haptics.selection();
              setSubTab('recovery');
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              subTab === 'recovery'
                ? 'bg-primary-container text-on-primary-container shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Unbound & Sobriety Fortress</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: DAILY HABITS & SLEEP RESTORATION
          ═══════════════════════════════════════════════════════════════ */}
      {subTab === 'habits' && (
        <div className="space-y-6">
          {/* Quick Habit Streak Grid */}
          <div
            className="p-6 rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm space-y-4"
            style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-display text-on-surface">Daily Recursive Habits</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Tap to verify completion for today ({todayStr()})
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-primary">
                {Object.values(habitChecks).filter(Boolean).length} of {activeHabits.length} Done
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {activeHabits.map(habit => {
                const isChecked = !!habitChecks[habit.id];
                return (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() => handleToggleHabit(habit.id)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all m3-pressable ${
                      isChecked
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-on-surface shadow-xs'
                        : 'bg-surface-container-high border-outline-variant text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-on-surface truncate">{habit.name}</div>
                      <div className="text-[10px] font-mono text-on-surface-variant uppercase mt-0.5">
                        Target: {habit.targetDaysPerWeek}d/week · {habit.category}
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                        isChecked
                          ? 'bg-emerald-500 text-black border-emerald-500'
                          : 'border-outline-variant hover:border-primary'
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sleep & Biometrics Check-in Form */}
          <form
            onSubmit={handleSavePulseLog}
            className="p-6 rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm space-y-5"
            style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold font-display text-on-surface">Rest & Energy Telemetry</h3>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-1 text-xs rounded-xl border border-outline-variant bg-black/5 dark:bg-white/5 font-mono text-on-surface"
              />
            </div>

            {/* Sleep Presets */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-on-surface">Sleep Duration:</span>
                <span className="font-mono text-primary font-bold text-sm">{sleepHours} Hours</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[6, 6.5, 7, 7.5, 8, 8.5, 9].map(hrs => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => {
                      Haptics.selection();
                      setSleepHours(hrs);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                      sleepHours === hrs
                        ? 'bg-primary-container text-on-primary-container border-primary shadow-xs'
                        : 'border-outline-variant text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {hrs}h
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders / Ratings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">Morning Energy</span>
                  <span className="font-mono font-bold text-primary">{energy}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={energy}
                  onChange={e => setEnergy(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="space-y-1.5 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">Overall Mood</span>
                  <span className="font-mono font-bold text-primary">{mood}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={mood}
                  onChange={e => setMood(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="space-y-1.5 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">Cognitive Focus</span>
                  <span className="font-mono font-bold text-primary">{focus}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={focus}
                  onChange={e => setFocus(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface">Daily Rest & Habit Observations:</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Woke up without alarm; 20 minutes sunlight before checking notifications..."
                rows={2}
                className="w-full p-3 rounded-2xl border text-xs bg-black/5 dark:bg-white/5 border-outline-variant text-on-surface focus:outline-hidden focus:border-primary resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl text-xs font-bold text-on-primary shadow-md flex items-center justify-center gap-2 m3-pressable"
              style={{ backgroundColor: 'var(--md-sys-color-primary)' }}
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Save Health & Sleep Log</span>
            </button>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: UNBOUND & SOBRIETY FORTRESS
          ═══════════════════════════════════════════════════════════════ */}
      {subTab === 'recovery' && (
        <div className="space-y-6">
          {/* Main Clean Time Counter */}
          <div
            className="p-7 rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm text-center space-y-5"
            style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-primary tracking-widest">
                Fortress of Self-Command
              </span>
              <div className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE INTEGRITY
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-5xl sm:text-6xl font-bold font-mono text-on-surface tracking-tight">
                {daysClean} <span className="text-2xl sm:text-3xl text-primary">DAYS</span>
              </div>
              <p className="text-xs font-mono text-on-surface-variant">
                Continuous clean discipline on {activeQuit.title}
              </p>
            </div>

            {/* Urge Delay Button (High Leverage) */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  Haptics.medium();
                  setUrgeModalOpen(true);
                  setIsCountingDown(true);
                  setUrgeCountdownSeconds(300);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-bold border border-amber-500/40 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 shadow-xs flex items-center justify-center gap-2 m3-pressable"
              >
                <Timer className="w-4 h-4" />
                <span>5-Minute Urge Delay Lock</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  Haptics.selection();
                  alert('Take 3 deep, slow breaths. Cravings peak and dissipate in under 5 minutes. You are in command.');
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-bold border border-outline-variant hover:bg-black/5 dark:hover:bg-white/5 text-on-surface-variant flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 text-primary" />
                <span>Grounding Protocol</span>
              </button>
            </div>
          </div>

          {/* Milestones Roadmap */}
          <div
            className="p-6 rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm space-y-4"
            style={{ backgroundColor: 'var(--md-sys-color-surface-container)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-display text-on-surface">Sobriety Milestones</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Dopamine receptors & neuroplastic baseline recovery
                </p>
              </div>
              <Award className="w-5 h-5 text-amber-400" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {RECOVERY_MILESTONES.map(m => {
                const reached = daysClean >= m.days;
                return (
                  <div
                    key={m.days}
                    className={`p-3.5 rounded-2xl border text-center space-y-1 transition-all ${
                      reached
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-on-surface'
                        : 'bg-black/5 dark:bg-white/5 border-outline-variant text-on-surface-variant'
                    }`}
                  >
                    <div className="text-lg font-bold font-mono">
                      {reached ? '🏆' : '🔒'} {m.days}d
                    </div>
                    <div className="text-xs font-bold truncate">{m.label}</div>
                    <div className="text-[10px] opacity-75">{m.reward}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          URGE DELAY TIMER MODAL
          ═══════════════════════════════════════════════════════════════ */}
      {urgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md rounded-3xl p-6 border border-outline-variant shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)' }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold font-display text-on-surface">5-Minute Urge Delay</h3>
              </div>
              <button
                type="button"
                onClick={() => setUrgeModalOpen(false)}
                className="text-xs text-on-surface-variant hover:text-on-surface p-1"
              >
                ✕
              </button>
            </div>

            {/* Countdown Clock */}
            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
              <div className="text-4xl font-bold font-mono text-amber-400">
                {Math.floor(urgeCountdownSeconds / 60)}:
                {String(urgeCountdownSeconds % 60).padStart(2, '0')}
              </div>
              <p className="text-xs text-on-surface-variant">
                Urge neurochemistry dissipates rapidly. Breathe deeply.
              </p>
            </div>

            {/* Intensity Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-on-surface">Caving Urge Intensity:</span>
                <span className="font-mono text-amber-400 font-bold">{urgeIntensity}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={urgeIntensity}
                onChange={e => setUrgeIntensity(parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Trigger Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface">What triggered this urge? (Optional)</label>
              <input
                type="text"
                value={urgeTrigger}
                onChange={e => setUrgeTrigger(e.target.value)}
                placeholder="e.g. Late night fatigue, social media feed, stress..."
                className="w-full p-2.5 rounded-xl border text-xs bg-black/5 dark:bg-white/5 border-outline-variant text-on-surface"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUrgeModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleLogUrge}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-black shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>I Prevailed / Log Urge Resisted</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
