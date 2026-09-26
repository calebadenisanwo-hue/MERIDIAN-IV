import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  X,
  Star,
  Zap,
  Target,
  Wallet,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Plus,
  Clock,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MeridianStorage, todayStr, fmtNaira } from '../../services/storage';
import {
  PulseLog,
  PulseState,
  FinanceTransaction,
  FinanceState,
  JournalEntry,
} from '../../types';
import { Haptics } from '../../services/haptics';

interface DailyRitualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
  initialMode?: 'morning' | 'evening';
}

export const DailyRitualModal: React.FC<DailyRitualModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
  initialMode,
}) => {
  // Determine default mode based on time of day (morning < 14:00, evening >= 14:00)
  const [ritualMode, setRitualMode] = useState<'morning' | 'evening'>(() => {
    if (initialMode) return initialMode;
    const hour = new Date().getHours();
    return hour < 14 ? 'morning' : 'evening';
  });

  // Morning State
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [sleepQuality, setSleepQuality] = useState<number>(4);
  const [morningEnergy, setMorningEnergy] = useState<number>(4);
  const [coreFocusTarget, setCoreFocusTarget] = useState<string>('');
  const [morningIntention, setMorningIntention] = useState<string>('');

  // Evening State
  const [pulseState, setPulseState] = useState<PulseState>(() => MeridianStorage.getPulse());
  const [habitChecks, setHabitChecks] = useState<Record<string, boolean>>({});
  const [eveningMood, setEveningMood] = useState<number>(4);
  const [eveningReflection, setEveningReflection] = useState<string>('');
  const [spentMoneyToday, setSpentMoneyToday] = useState<boolean>(false);
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseCategory, setExpenseCategory] = useState<string>('Food & Dining');
  const [expenseNote, setExpenseNote] = useState<string>('');
  const [keptCleanStreak, setKeptCleanStreak] = useState<boolean>(true);

  // Load existing today's log if any
  useEffect(() => {
    if (!isOpen) return;
    const pulse = MeridianStorage.getPulse();
    setPulseState(pulse);

    const today = todayStr();
    const existingLog = pulse.logs.find(l => l.date === today);
    if (existingLog) {
      if (existingLog.sleepHours != null) setSleepHours(existingLog.sleepHours);
      if (existingLog.sleepQuality != null) setSleepQuality(existingLog.sleepQuality);
      if (existingLog.energy != null) setMorningEnergy(existingLog.energy);
      if (existingLog.mood != null) setEveningMood(existingLog.mood);
      if (existingLog.habits) setHabitChecks(existingLog.habits);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleHabit = (id: string) => {
    Haptics.selection();
    setHabitChecks(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSaveMorning = () => {
    Haptics.success();
    const today = todayStr();
    const currentPulse = MeridianStorage.getPulse();

    // 1. Update or create today's pulse log
    const existingIndex = currentPulse.logs.findIndex(l => l.date === today);
    const existingLog = existingIndex >= 0 ? currentPulse.logs[existingIndex] : null;

    const updatedLog: PulseLog = {
      date: today,
      sleepHours,
      sleepQuality,
      energy: morningEnergy,
      mood: existingLog?.mood ?? 4,
      focus: existingLog?.focus ?? 4,
      habits: existingLog?.habits ?? {},
      note: morningIntention.trim() || existingLog?.note,
      timestamp: new Date().toISOString(),
    };

    let updatedLogs = [...currentPulse.logs];
    if (existingIndex >= 0) {
      updatedLogs[existingIndex] = { ...existingLog, ...updatedLog };
    } else {
      updatedLogs = [updatedLog, ...updatedLogs];
    }

    MeridianStorage.savePulse({
      ...currentPulse,
      logs: updatedLogs,
    });

    // 2. Publish Morning Intention to Journal if provided
    if (morningIntention.trim() || coreFocusTarget.trim()) {
      try {
        const currentJournal = MeridianStorage.getJournal();
        const contentLines = [
          `**🌅 Morning Kick-off Intentions**`,
          `Sleep: ${sleepHours}h (${sleepQuality}/5 stars) · Morning Energy: ${morningEnergy}/5`,
        ];
        if (coreFocusTarget.trim()) {
          contentLines.push(`**Core Non-Negotiable Target:** ${coreFocusTarget.trim()}`);
        }
        if (morningIntention.trim()) {
          contentLines.push(`**Mindset:** ${morningIntention.trim()}`);
        }

        const newEntry: JournalEntry = {
          id: 'j_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          text: contentLines.join('\n\n'),
          tag: 'intentions',
          pinned: false,
          timestamp: Date.now(),
          dateStr: today,
        };
        MeridianStorage.saveJournal([newEntry, ...currentJournal]);
      } catch (e) {
        console.error('Failed to save morning journal:', e);
      }
    }

    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    onCompleted();
    onClose();
  };

  const handleSaveEvening = () => {
    Haptics.success();
    const today = todayStr();
    const currentPulse = MeridianStorage.getPulse();

    // 1. Update pulse log with habits and evening mood
    const existingIndex = currentPulse.logs.findIndex(l => l.date === today);
    const existingLog = existingIndex >= 0 ? currentPulse.logs[existingIndex] : null;

    const updatedLog: PulseLog = {
      date: today,
      sleepHours: existingLog?.sleepHours ?? 7.5,
      sleepQuality: existingLog?.sleepQuality ?? 4,
      energy: existingLog?.energy ?? 4,
      mood: eveningMood,
      focus: existingLog?.focus ?? 4,
      habits: { ...(existingLog?.habits || {}), ...habitChecks },
      note: eveningReflection.trim() || existingLog?.note,
      timestamp: new Date().toISOString(),
    };

    let updatedLogs = [...currentPulse.logs];
    if (existingIndex >= 0) {
      updatedLogs[existingIndex] = { ...existingLog, ...updatedLog };
    } else {
      updatedLogs = [updatedLog, ...updatedLogs];
    }

    MeridianStorage.savePulse({
      ...currentPulse,
      logs: updatedLogs,
    });

    // 2. If expenses logged, write transaction
    const parsedAmount = parseFloat(expenseAmount);
    if (spentMoneyToday && !isNaN(parsedAmount) && parsedAmount > 0) {
      try {
        const finance = MeridianStorage.getFinance();
        const primaryAccount = finance.accounts[0];
        const newTx: FinanceTransaction = {
          id: 'tx_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          type: 'expense',
          date: today,
          accountId: primaryAccount?.id || 'acc_primary',
          merchant: expenseNote.trim() || expenseCategory,
          note: `Evening debrief: ${expenseCategory}`,
          amount: Math.round(parsedAmount * 100), // convert to kobo
          timestamp: new Date().toISOString(),
        };
        MeridianStorage.saveFinance({
          ...finance,
          transactions: [newTx, ...finance.transactions],
        });
      } catch (e) {
        console.error('Failed to log evening expense:', e);
      }
    }

    // 3. Save Evening Reflection to Journal
    if (eveningReflection.trim()) {
      try {
        const currentJournal = MeridianStorage.getJournal();
        const habitsCount = Object.values(habitChecks).filter(Boolean).length;
        const totalHabits = (pulseState.habits || []).filter(h => !h.archived).length;

        const contentLines = [
          `**🌙 Evening Debrief & Golden Reflection**`,
          `Evening Mood: ${eveningMood}/5 · Habits Completed: ${habitsCount}/${totalHabits}`,
          `**Daily Takeaway:** ${eveningReflection.trim()}`,
        ];

        if (keptCleanStreak) {
          contentLines.push(`🛡️ Clean Sobriety Streak Preserved (+1 day)`);
        }

        const newEntry: JournalEntry = {
          id: 'j_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          text: contentLines.join('\n\n'),
          tag: 'debrief',
          pinned: false,
          timestamp: Date.now(),
          dateStr: today,
        };
        MeridianStorage.saveJournal([newEntry, ...currentJournal]);
      } catch (e) {
        console.error('Failed to save evening journal:', e);
      }
    }

    confetti({ particleCount: 65, spread: 75, origin: { y: 0.6 } });
    onCompleted();
    onClose();
  };

  const activeHabits = (pulseState.habits || []).filter(h => !h.archived);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl p-6 sm:p-7 border shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Ribbon & Mode Switcher */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                ritualMode === 'morning'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-indigo-500/20 text-indigo-400'
              }`}
            >
              {ritualMode === 'morning' ? (
                <Sun className="w-6 h-6 stroke-[2.2]" />
              ) : (
                <Moon className="w-6 h-6 stroke-[2.2]" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-on-surface">
                {ritualMode === 'morning' ? 'Morning Kick-off (60s)' : 'Evening Debrief (60s)'}
              </h3>
              <p className="text-xs text-on-surface-variant font-mono">
                Synchronize rest, focus & habits across all systems
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 text-on-surface-variant"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Morning vs Evening Mode Tabs */}
        <div className="flex p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant">
          <button
            type="button"
            onClick={() => {
              Haptics.selection();
              setRitualMode('morning');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              ritualMode === 'morning'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>🌅 Morning Kick-off</span>
          </button>
          <button
            type="button"
            onClick={() => {
              Haptics.selection();
              setRitualMode('evening');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              ritualMode === 'evening'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>🌙 Evening Debrief</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            MODE A: MORNING KICK-OFF
            ═══════════════════════════════════════════════════════════════ */}
        {ritualMode === 'morning' && (
          <div className="space-y-4 text-xs">
            {/* 1. Sleep Duration Stepper */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-on-surface flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Last Night's Sleep:</span>
                </span>
                <span className="font-mono text-base font-bold text-primary">{sleepHours} Hours</span>
              </div>
              {/* Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                {[6, 6.5, 7, 7.5, 8, 8.5, 9].map(hrs => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => {
                      Haptics.selection();
                      setSleepHours(hrs);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all ${
                      sleepHours === hrs
                        ? 'bg-primary-container text-on-primary-container border-primary'
                        : 'border-outline-variant text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {hrs}h
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Sleep Quality & Energy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-on-surface">Sleep Quality:</span>
                  <span className="font-mono font-bold text-primary">{sleepQuality}/5</span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSleepQuality(star)}
                      className={`flex-1 py-1.5 rounded-lg border flex items-center justify-center ${
                        star <= sleepQuality
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'border-outline-variant text-slate-500'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${star <= sleepQuality ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-on-surface">Morning Energy:</span>
                  <span className="font-mono font-bold text-primary">{morningEnergy}/5</span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setMorningEnergy(star)}
                      className={`flex-1 py-1.5 rounded-lg border flex items-center justify-center ${
                        star <= morningEnergy
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'border-outline-variant text-slate-500'
                      }`}
                    >
                      <Zap className={`w-3.5 h-3.5 ${star <= morningEnergy ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Core Commitment for Today */}
            <div className="space-y-1.5">
              <label className="font-semibold text-on-surface flex items-center gap-1.5">
                <Target className="w-4 h-4 text-primary" />
                <span>Today's Core Non-Negotiable Commitment:</span>
              </label>
              <input
                type="text"
                value={coreFocusTarget}
                onChange={e => setCoreFocusTarget(e.target.value)}
                placeholder="e.g. Complete 2 Study Sprints on Upper Limb Anatomy"
                className="w-full p-3 rounded-2xl border text-xs bg-black/5 dark:bg-white/5 border-outline-variant text-on-surface focus:outline-hidden focus:border-primary"
              />
            </div>

            {/* 4. Mindset / Intention */}
            <div className="space-y-1.5">
              <label className="font-semibold text-on-surface flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Morning Affirmation or Focus Rule:</span>
              </label>
              <input
                type="text"
                value={morningIntention}
                onChange={e => setMorningIntention(e.target.value)}
                placeholder="e.g. Single-tasking with calm execution; no social feeds before noon."
                className="w-full p-3 rounded-2xl border text-xs bg-black/5 dark:bg-white/5 border-outline-variant text-on-surface focus:outline-hidden focus:border-primary"
              />
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            MODE B: EVENING DEBRIEF
            ═══════════════════════════════════════════════════════════════ */}
        {ritualMode === 'evening' && (
          <div className="space-y-4 text-xs">
            {/* 1. Daily Habit Checklist */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-on-surface flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Today's Habit Streak Checklist:</span>
                </span>
                <span className="font-mono text-xs text-on-surface-variant">
                  {Object.values(habitChecks).filter(Boolean).length}/{activeHabits.length} Done
                </span>
              </div>

              {activeHabits.length === 0 ? (
                <p className="text-on-surface-variant italic">No habits configured yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {activeHabits.map(habit => {
                    const isChecked = !!habitChecks[habit.id];
                    return (
                      <button
                        key={habit.id}
                        type="button"
                        onClick={() => handleToggleHabit(habit.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isChecked
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-on-surface'
                            : 'border-outline-variant text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <span className="font-medium truncate mr-2">{habit.name}</span>
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            isChecked
                              ? 'bg-emerald-500 text-black border-emerald-500'
                              : 'border-outline'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Rapid Expense Check */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-on-surface flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-sky-400" />
                  <span>Any cash outflows today?</span>
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={spentMoneyToday}
                    onChange={e => setSpentMoneyToday(e.target.checked)}
                    className="accent-primary rounded"
                  />
                  <span className="font-mono text-xs font-semibold">
                    {spentMoneyToday ? 'Yes, Log It' : '₦0 (No Spend Day!)'}
                  </span>
                </label>
              </div>

              {spentMoneyToday && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <input
                    type="number"
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(e.target.value)}
                    placeholder="Amount (₦)"
                    className="p-2.5 rounded-xl border bg-black/10 dark:bg-white/5 border-outline-variant text-xs text-on-surface font-mono"
                  />
                  <select
                    value={expenseCategory}
                    onChange={e => setExpenseCategory(e.target.value)}
                    className="p-2.5 rounded-xl border bg-black/10 dark:bg-white/5 border-outline-variant text-xs text-on-surface font-medium"
                  >
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Academic Materials">Academic Materials</option>
                    <option value="Utilities">Utilities & Airtime</option>
                    <option value="Personal Care">Personal Care</option>
                  </select>
                  <input
                    type="text"
                    value={expenseNote}
                    onChange={e => setExpenseNote(e.target.value)}
                    placeholder="Merchant or note"
                    className="p-2.5 rounded-xl border bg-black/10 dark:bg-white/5 border-outline-variant text-xs text-on-surface"
                  />
                </div>
              )}
            </div>

            {/* 3. Golden Reflection (1-Sentence Win) */}
            <div className="space-y-1.5">
              <label className="font-semibold text-on-surface flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-primary" />
                <span>1-Sentence Golden Reflection (Wins, gratitude, or lessons):</span>
              </label>
              <textarea
                value={eveningReflection}
                onChange={e => setEveningReflection(e.target.value)}
                placeholder="e.g. Mastered brachial plexus cords without looking; felt energized after afternoon water intake..."
                rows={2}
                className="w-full p-3 rounded-2xl border text-xs bg-black/5 dark:bg-white/5 border-outline-variant text-on-surface focus:outline-hidden focus:border-primary resize-none"
              />
            </div>

            {/* 4. Sobriety Clean Day Check */}
            <label className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-semibold text-on-surface">Maintained Unbound Clean Streak</div>
                  <div className="text-[11px] text-on-surface-variant">No resets today · Integrity preserved</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={keptCleanStreak}
                onChange={e => setKeptCleanStreak(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
            </label>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-on-surface-variant hover:text-on-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={ritualMode === 'morning' ? handleSaveMorning : handleSaveEvening}
            className="px-6 py-2.5 rounded-2xl text-xs font-bold text-on-primary shadow-md flex items-center gap-2"
            style={{ backgroundColor: 'var(--md-sys-color-primary)' }}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>
              {ritualMode === 'morning' ? 'Lock In Morning Plan' : 'Close Today’s Ledger'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
