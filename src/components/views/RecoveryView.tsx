import React, { useState, useEffect, memo } from 'react';
import {
  ShieldCheck,
  Award,
  Flame,
  Plus,
  Trash2,
  Sparkles,
  History,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RecoveryState, RecoveryQuit, RecoveryLog } from '../../types';
import { MeridianStorage, fmtDateShort, todayStr, RECOVERY_MILESTONES } from '../../services/storage';

// Memoized ticking component so the entire Recovery page does not re-render every second
const CleanTimeClock: React.FC<{ quitTimestamp: number }> = memo(({ quitTimestamp }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const diff = Math.max(0, now - quitTimestamp);
  const totalSecs = Math.floor(diff / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  return (
    <div className="grid grid-cols-4 gap-2 text-center p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--md-sys-color-outline-variant)]">
      <div>
        <div className="text-2xl sm:text-3xl font-bold font-mono text-primary tabular-nums">{days}</div>
        <div className="text-[10px] uppercase font-mono text-on-surface-variant font-semibold">Days</div>
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-bold font-mono text-on-surface tabular-nums">{hours}</div>
        <div className="text-[10px] uppercase font-mono text-on-surface-variant font-semibold">Hours</div>
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-bold font-mono text-on-surface tabular-nums">{minutes}</div>
        <div className="text-[10px] uppercase font-mono text-on-surface-variant font-semibold">Minutes</div>
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-bold font-mono text-on-surface tabular-nums">{seconds}</div>
        <div className="text-[10px] uppercase font-mono text-on-surface-variant font-semibold">Seconds</div>
      </div>
    </div>
  );
});
CleanTimeClock.displayName = 'CleanTimeClock';

export const RecoveryView: React.FC = () => {
  const [state, setState] = useState<RecoveryState>(() => MeridianStorage.getRecovery());
  const [activeTab, setActiveTab] = useState<'quits' | 'vault' | 'history'>('quits');

  // Modal state for adding a new quit
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newQuitName, setNewQuitName] = useState('');
  const [newQuitCategory, setNewQuitCategory] = useState(state.categories[0]?.id || 'substance');
  const [newQuitReason, setNewQuitReason] = useState('');

  // Modal state for logging slip/reset
  const [resetModalQuitId, setResetModalQuitId] = useState<string | null>(null);
  const [resetNote, setResetNote] = useState('');

  const getDaysClean = (quitTimestamp: number) => {
    return Math.floor(Math.max(0, Date.now() - quitTimestamp) / 86400000);
  };

  const handleLogUrge = (quitId: string) => {
    const updatedQuits = state.quits.map(q =>
      q.id === quitId ? { ...q, urgesLogged: (q.urgesLogged || 0) + 1 } : q
    );
    const newLog: RecoveryLog = {
      id: 'rl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      quitId,
      date: todayStr(),
      type: 'urge',
      note: 'Craving overcome successfully with mindfulness.',
    };
    const newState: RecoveryState = {
      ...state,
      quits: updatedQuits,
      logs: [newLog, ...state.logs],
    };
    setState(newState);
    MeridianStorage.saveRecovery(newState);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
  };

  const handleConfirmReset = () => {
    if (!resetModalQuitId) return;

    const q = state.quits.find(item => item.id === resetModalQuitId);
    if (!q) return;

    const days = getDaysClean(q.quitTimestamp);
    const longest = Math.max(q.longestCleanDays || 0, days);

    const updatedQuits = state.quits.map(item =>
      item.id === resetModalQuitId
        ? {
            ...item,
            quitTimestamp: Date.now(),
            longestCleanDays: longest,
          }
        : item
    );

    const newLog: RecoveryLog = {
      id: 'rl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      quitId: resetModalQuitId,
      date: todayStr(),
      type: 'reset',
      note: resetNote.trim() || 'Timer reset logged.',
    };

    const newState: RecoveryState = {
      ...state,
      quits: updatedQuits,
      logs: [newLog, ...state.logs],
    };
    setState(newState);
    MeridianStorage.saveRecovery(newState);

    setResetModalQuitId(null);
    setResetNote('');
  };

  const handleAddQuit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuitName.trim()) return;

    const newQuit: RecoveryQuit = {
      id: 'q_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: newQuitName.trim(),
      categoryId: newQuitCategory,
      quitTimestamp: Date.now(),
      reason: newQuitReason.trim(),
      urgesLogged: 0,
      longestCleanDays: 0,
    };

    const newState: RecoveryState = {
      ...state,
      quits: [...state.quits, newQuit],
    };
    setState(newState);
    MeridianStorage.saveRecovery(newState);

    setNewQuitName('');
    setNewQuitReason('');
    setIsAddModalOpen(false);
  };

  const handleDeleteQuit = (id: string) => {
    if (confirm('Delete this habit tracker and all its associated logs?')) {
      const newState: RecoveryState = {
        ...state,
        quits: state.quits.filter(q => q.id !== id),
        logs: state.logs.filter(l => l.quitId !== id),
      };
      setState(newState);
      MeridianStorage.saveRecovery(newState);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto m3-fade-enter">
      {/* Navigation Pills */}
      <div
        className="p-1.5 rounded-2xl border flex items-center justify-between gap-1 overflow-x-auto"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        <div className="flex items-center gap-1">
          {[
            { id: 'quits', label: 'Active Quits', icon: ShieldCheck },
            { id: 'vault', label: 'Milestone Vault', icon: Award },
            { id: 'history', label: `Urge & Reset Log (${state.logs.length})`, icon: History },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap m3-pressable ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          type="button"
          className="px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 shrink-0 m3-pressable"
          style={{
            backgroundColor: 'var(--md-sys-color-primary)',
            color: 'var(--md-sys-color-on-primary)',
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Track New Habit</span>
        </button>
      </div>

      {/* TAB 1: ACTIVE QUITS & TIMERS */}
      {activeTab === 'quits' && (
        <div className="space-y-4">
          {state.quits.length === 0 ? (
            <div
              className="p-12 text-center rounded-3xl border space-y-3"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container)',
                borderColor: 'var(--md-sys-color-outline-variant)',
              }}
            >
              <ShieldCheck className="w-8 h-8 opacity-30 mx-auto text-amber-400" />
              <p className="text-sm font-medium text-on-surface-variant">
                No habits currently being tracked in Unbound.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                type="button"
                className="px-4 py-2 text-xs font-bold rounded-full bg-primary text-on-primary shadow-sm"
              >
                + Track First Habit
              </button>
            </div>
          ) : (
            state.quits.map(quit => {
              const cat = state.categories.find(c => c.id === quit.categoryId);

              return (
                <div
                  key={quit.id}
                  className="p-6 rounded-3xl border shadow-sm space-y-5"
                  style={{
                    backgroundColor: 'var(--md-sys-color-surface-container)',
                    borderColor: 'var(--md-sys-color-outline-variant)',
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2.5 py-0.5 text-[10px] font-mono uppercase font-bold rounded-full"
                          style={{
                            backgroundColor: cat ? cat.color + '22' : 'var(--md-sys-color-primary-container)',
                            color: cat ? cat.color : 'var(--md-sys-color-primary)',
                          }}
                        >
                          {cat?.name || 'Habit'}
                        </span>
                        {quit.longestCleanDays ? (
                          <span className="text-xs font-mono text-on-surface-variant">
                            Best: {quit.longestCleanDays}d
                          </span>
                        ) : null}
                      </div>
                      <h3 className="text-lg font-bold font-display text-on-surface mt-1">
                        {quit.name}
                      </h3>
                      {quit.reason && (
                        <p className="text-xs text-on-surface-variant italic mt-0.5">&ldquo;{quit.reason}&rdquo;</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteQuit(quit.id)}
                      className="text-xs text-on-surface-variant hover:text-rose-400 p-1 self-start sm:self-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Clean Time Tickers Isolated in Memoized Component */}
                  <CleanTimeClock quitTimestamp={quit.quitTimestamp} />

                  {/* Urge & Reset Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLogUrge(quit.id)}
                        className="px-4 py-2 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30 transition-all flex items-center gap-1.5 m3-pressable"
                      >
                        <Flame className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Log Urge Survived ({quit.urgesLogged || 0})</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setResetModalQuitId(quit.id)}
                      className="px-3.5 py-2 text-xs font-semibold rounded-full border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-all m3-pressable"
                    >
                      Log Slip / Reset Timer
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: MILESTONE MEDALLION VAULT */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          {state.quits.map(quit => {
            const days = getDaysClean(quit.quitTimestamp);

            return (
              <div
                key={quit.id}
                className="p-6 rounded-3xl border shadow-sm space-y-4"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold font-display text-on-surface">{quit.name}</h3>
                    <p className="text-xs text-on-surface-variant font-mono">
                      Current Streak: <strong className="text-primary font-bold">{days} days</strong>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {RECOVERY_MILESTONES.map(milestone => {
                    const isUnlocked = days >= milestone.days;

                    return (
                      <div
                        key={milestone.days}
                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between ${
                          isUnlocked
                            ? 'bg-primary-container border-primary shadow-xs'
                            : 'bg-black/5 dark:bg-white/5 border-outline-variant opacity-40 grayscale'
                        }`}
                      >
                        <div className="text-2xl mb-1">{milestone.icon}</div>
                        <div className="text-xs font-bold leading-tight">{milestone.label}</div>
                        <div className="text-[10px] font-mono text-on-surface-variant mt-1">
                          {isUnlocked ? 'Achieved' : `${milestone.days} days`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: URGE & RESET AUDIT TRAIL */}
      {activeTab === 'history' && (
        <div
          className="p-6 rounded-3xl border space-y-3"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-on-surface">Urge & Reset Audit Trail</h3>
            <span className="text-xs font-mono text-on-surface-variant">Telemetry log</span>
          </div>

          {state.logs.length === 0 ? (
            <p className="text-xs text-on-surface-variant py-4">No events logged yet.</p>
          ) : (
            <div className="space-y-2">
              {state.logs.map(log => {
                const quit = state.quits.find(q => q.id === log.quitId);
                const isUrge = log.type === 'urge';

                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isUrge ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                      <div>
                        <span className="font-semibold text-on-surface">{quit?.name || 'Habit'}</span>
                        <span className="text-on-surface-variant ml-2">
                          {isUrge ? 'Resisted temptation' : 'Timer reset'}
                        </span>
                        {log.note && <p className="text-[11px] text-on-surface-variant mt-0.5">{log.note}</p>}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-on-surface-variant shrink-0">{log.date}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Habit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm m3-fade-enter">
          <div
            className="w-full max-w-md rounded-3xl border p-6 space-y-4 shadow-xl"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            <h3 className="text-lg font-bold font-display text-on-surface">Track New Habit Cessation</h3>
            <form onSubmit={handleAddQuit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">Habit Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nicotine, Doomscrolling, Sugar"
                  value={newQuitName}
                  onChange={e => setNewQuitName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">Category</label>
                <select
                  value={newQuitCategory}
                  onChange={e => setNewQuitCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm"
                >
                  {state.categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">Personal &lsquo;Why&rsquo; (Reason)</label>
                <input
                  type="text"
                  placeholder="e.g. Cognitive clarity and peak stamina"
                  value={newQuitReason}
                  onChange={e => setNewQuitReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full text-xs font-bold bg-primary text-on-primary shadow-sm"
                >
                  Start Streak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slip / Reset Modal */}
      {resetModalQuitId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm m3-fade-enter">
          <div
            className="w-full max-w-md rounded-3xl border p-6 space-y-4 shadow-xl"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            <h3 className="text-lg font-bold font-display text-rose-400">Log Reset & Begin Anew</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              A reset is objective feedback, not moral failure. Document the trigger to upgrade your environmental strategy.
            </p>

            <div>
              <label className="text-xs font-semibold text-on-surface-variant block mb-1">Trigger / Context</label>
              <textarea
                rows={3}
                placeholder="What was the environmental trigger or emotional state?"
                value={resetNote}
                onChange={e => setResetNote(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setResetModalQuitId(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-5 py-2 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm"
              >
                Reset Timer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
