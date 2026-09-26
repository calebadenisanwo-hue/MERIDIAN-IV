import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Wallet,
  Activity,
  Target,
  Sparkles,
  TrendingUp,
  Sun,
  Moon,
  CheckCircle2,
} from 'lucide-react';
import { ModuleRoute } from '../../types';
import {
  MeridianStorage,
  fmtNaira,
  todayStr,
  daysAgoStr,
  fmtDateShort,
} from '../../services/storage';
import {
  computeSystemScores,
  computeWeightedComposite,
  computeWeeklyScoreboard,
  buildTodaysMove,
  buildActivityMatrix,
  computeCrossCorrelations,
} from '../../services/metrics';
import { Haptics } from '../../services/haptics';
import { DailyRitualModal } from '../common/DailyRitualModal';

interface OverviewViewProps {
  onNavigate: (route: ModuleRoute) => void;
  onOpenDayDetail: (date: string) => void;
  onOpenTimelineWithTag: (tag: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onOpenDayDetail,
}) => {
  const [rangeDays, setRangeDays] = useState<number>(60);
  const [isRitualModalOpen, setIsRitualModalOpen] = useState(false);
  const [ritualMode, setRitualMode] = useState<'morning' | 'evening'>('morning');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Memoized storage reads
  const { journal, study, recovery, finance, pulse, goals, weights } = useMemo(() => ({
    journal: MeridianStorage.getJournal(),
    study: MeridianStorage.getStudy(),
    recovery: MeridianStorage.getRecovery(),
    finance: MeridianStorage.getFinance(),
    pulse: MeridianStorage.getPulse(),
    goals: MeridianStorage.getGoals(),
    weights: MeridianStorage.getWeights(),
  }), [refreshTrigger]);

  // Memoized metrics calculations
  const scores = useMemo(
    () => computeSystemScores(journal, study, recovery, finance, pulse, goals),
    [journal, study, recovery, finance, pulse, goals]
  );
  const composite = useMemo(
    () => computeWeightedComposite(scores, weights),
    [scores, weights]
  );
  const scoreboard = useMemo(
    () => computeWeeklyScoreboard(journal, study, recovery, finance, pulse, goals),
    [journal, study, recovery, finance, pulse, goals]
  );
  const todaysMove = useMemo(
    () => buildTodaysMove(scores, scoreboard),
    [scores, scoreboard]
  );
  const activityMatrix = useMemo(
    () => buildActivityMatrix(journal, study, recovery, finance, pulse, goals, rangeDays),
    [journal, study, recovery, finance, pulse, goals, rangeDays]
  );
  const crossCorrelations = useMemo(
    () => computeCrossCorrelations(study, recovery, pulse, finance),
    [study, recovery, pulse, finance]
  );

  // Consistency metrics
  const { journalConsistency, studyConsistency, pulseConsistency } = useMemo(() => {
    const totalDays = Math.max(1, rangeDays);
    const jActive = new Set(
      journal.filter(j => j.timestamp.slice(0, 10) >= daysAgoStr(rangeDays)).map(j => j.timestamp.slice(0, 10))
    ).size;
    const sActive = new Set(
      study.logs.filter(l => l.date >= daysAgoStr(rangeDays)).map(l => l.date)
    ).size;
    const pActive = new Set(
      pulse.logs.filter(l => l.date >= daysAgoStr(rangeDays)).map(l => l.date)
    ).size;

    return {
      journalConsistency: Math.round((jActive / totalDays) * 100),
      studyConsistency: Math.round((sActive / totalDays) * 100),
      pulseConsistency: Math.round((pActive / totalDays) * 100),
    };
  }, [journal, study, pulse, rangeDays]);

  // System Modules roster
  const systems = useMemo(
    () => [
      {
        route: 'journal' as ModuleRoute,
        title: 'Mindful Logbook',
        desc: `${journal.length} entries recorded`,
        icon: BookOpen,
        color: '#805B9A',
        score: scores.journalScore,
      },
      {
        route: 'study' as ModuleRoute,
        title: 'Study Ledger',
        desc: `${(study.logs.reduce((s, l) => s + (l.durationMins || 0), 0) / 60).toFixed(1)}h total deep work`,
        icon: GraduationCap,
        color: '#2D6A4F',
        score: scores.studyScore,
      },
      {
        route: 'recovery' as ModuleRoute,
        title: 'Unbound Recovery',
        desc: `${recovery.quits.length} habits tracked · ${recovery.quits.reduce((s, q) => s + (q.urgesLogged || 0), 0)} urges won`,
        icon: ShieldCheck,
        color: '#D3A346',
        score: scores.recoveryScore,
      },
      {
        route: 'finance' as ModuleRoute,
        title: 'Finance Ledger',
        desc: `Net runway ${fmtNaira(finance.accounts.reduce((s, a) => s + a.opening, 0))}`,
        icon: Wallet,
        color: '#4FA9E0',
        score: scores.financeScore,
      },
      {
        route: 'checkin' as ModuleRoute,
        title: 'Pulse Vitality',
        desc: `${pulse.logs.length} check-ins · ${pulse.habits.length} daily habits`,
        icon: Activity,
        color: '#E0574B',
        score: scores.checkinScore,
      },
      {
        route: 'goals' as ModuleRoute,
        title: 'Milestones & Goals',
        desc: `${goals.goals.filter(g => !g.archived).length} active targets`,
        icon: Target,
        color: '#E8B368',
        score: scores.goalsScore,
      },
    ],
    [journal, study, recovery, finance, pulse, goals, scores]
  );

  const todayDate = todayStr();
  const todayPulseLog = pulse.logs.find(l => l.date === todayDate);
  const isMorningDone = !!(todayPulseLog && todayPulseLog.sleepHours != null);
  const isEveningDone = !!(todayPulseLog && todayPulseLog.habits && Object.keys(todayPulseLog.habits).length > 0);
  const currentHour = new Date().getHours();
  const isTimeForEvening = currentHour >= 14;

  return (
    <div className="space-y-6 m3-fade-enter">
      {/* ═══════════════════════════════════════════════════════════════
          0. UNIFIED 60-SECOND DAILY RITUAL DISPATCH
          ═══════════════════════════════════════════════════════════════ */}
      <div
        className="p-5 sm:p-6 rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm relative overflow-hidden transition-all"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                isTimeForEvening
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {isTimeForEvening ? (
                <Moon className="w-6 h-6 stroke-[2.2]" />
              ) : (
                <Sun className="w-6 h-6 stroke-[2.2]" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                  60-Second Daily Ritual
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-on-surface-variant">
                  {isTimeForEvening ? 'Evening Phase' : 'Morning Phase'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold font-display text-on-surface">
                {isTimeForEvening
                  ? isEveningDone
                    ? 'Evening debrief logged for today.'
                    : 'Time for evening review & daily closing.'
                  : isMorningDone
                  ? 'Morning kick-off intentions locked in.'
                  : 'Prime today’s rest, energy & commitments.'}
              </h3>
              <p className="text-xs text-on-surface-variant max-w-lg">
                {isTimeForEvening
                  ? 'Verify daily habits, rapid-fire cash outflows, and preserve clean streak.'
                  : 'Log sleep duration & quality, check morning readiness, and set core non-negotiable target.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                Haptics.selection();
                setRitualMode('morning');
                setIsRitualModalOpen(true);
              }}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                isMorningDone
                  ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                  : 'border-outline-variant text-on-surface hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Morning</span>
              {isMorningDone && <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />}
            </button>

            <button
              type="button"
              onClick={() => {
                Haptics.selection();
                setRitualMode('evening');
                setIsRitualModalOpen(true);
              }}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                isEveningDone
                  ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                  : 'border-outline-variant text-on-surface hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Evening</span>
              {isEveningDone && <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />}
            </button>

            <button
              type="button"
              onClick={() => {
                Haptics.medium();
                setRitualMode(isTimeForEvening ? 'evening' : 'morning');
                setIsRitualModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-on-primary shadow-md flex items-center gap-1.5 transition-all transform active:scale-95"
              style={{ backgroundColor: 'var(--md-sys-color-primary)' }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Flow</span>
            </button>
          </div>
        </div>
      </div>
      {/* ═══════════════════════════════════════════════════════════════
          1. MATERIAL 3 HERO: COMPOSITE LIFE INDEX
          ═══════════════════════════════════════════════════════════════ */}
      <div
        className="rounded-3xl p-6 sm:p-8 border border-[var(--md-sys-color-outline-variant)] shadow-sm relative overflow-hidden transition-colors"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span
                className="px-3 py-1 text-xs font-mono font-bold uppercase rounded-full"
                style={{
                  backgroundColor: 'var(--md-sys-color-secondary-container)',
                  color: 'var(--md-sys-color-on-secondary-container)',
                }}
              >
                Personal Health Index
              </span>
              <span className="text-xs text-on-surface-variant">Live cross-module read</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-display text-on-surface tracking-tight">
              Executing with steady momentum.
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Your 6 operational domains are synchronized. Rest and study habits are generating reliable cognitive stamina this week.
            </p>
          </div>

          {/* Hero Gauge Score */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center p-2 shadow-xs border-4"
              style={{
                borderColor: 'var(--md-sys-color-primary)',
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
              }}
            >
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-on-surface tabular-nums">
                {composite}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">
                / 100 PTS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          2. TODAY'S HIGHEST LEVERAGE MOVE
          ═══════════════════════════════════════════════════════════════ */}
      <div
        onClick={() => {
          Haptics.selection();
          onNavigate(todaysMove.route as ModuleRoute);
        }}
        className="p-5 sm:p-6 rounded-3xl border border-[var(--md-sys-color-outline-variant)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:border-[var(--md-sys-color-primary)] transition-all m3-pressable shadow-xs"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs text-xl"
            style={{
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
            }}
          >
            🎯
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                Today&apos;s Highest Leverage Move
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-on-surface-variant font-mono">
                {todaysMove.label}
              </span>
            </div>
            <p className="text-sm font-semibold text-on-surface mt-1">
              {todaysMove.recommendation}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="px-4 py-2 text-xs font-bold rounded-full shrink-0 flex items-center gap-1.5 shadow-xs"
          style={{
            backgroundColor: 'var(--md-sys-color-primary)',
            color: 'var(--md-sys-color-on-primary)',
          }}
        >
          <span>Open {todaysMove.label}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          3. WEEKLY BOX SCORE (7-DAY COMPARISON)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface-variant">
            Weekly Performance Scoreboard
          </h3>
          <span className="text-xs font-mono text-on-surface-variant">7-day velocity delta</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {scoreboard.map(row => (
            <div
              key={row.key}
              onClick={() => {
                Haptics.selection();
                onNavigate(row.key as ModuleRoute);
              }}
              className="p-3.5 rounded-2xl border border-[var(--md-sys-color-outline-variant)] text-center flex flex-col justify-between hover:border-[var(--md-sys-color-outline)] cursor-pointer transition-all m3-pressable"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container)',
              }}
            >
              <div className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold truncate">
                {row.label}
              </div>
              <div className="text-base font-bold font-mono my-1.5 text-on-surface tabular-nums">
                {row.fmt(row.thisVal)}
              </div>
              <div
                className={`text-[10.5px] font-mono font-semibold flex items-center justify-center gap-1 ${
                  row.direction === 'pos'
                    ? 'text-emerald-400'
                    : row.direction === 'neg'
                    ? 'text-rose-400'
                    : 'text-on-surface-variant'
                }`}
              >
                <span>{row.direction === 'pos' ? '▲' : row.direction === 'neg' ? '▼' : '—'}</span>
                <span>
                  {row.lastVal !== 0 ? Math.abs(row.pct) + '%' : row.thisVal > 0 ? 'new' : '0%'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          4. CORE SYSTEM MODULES (6)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface-variant">
            Operational Disciplines
          </h3>
          <span className="text-xs font-mono text-on-surface-variant">6 active engines</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {systems.map(sys => {
            const Icon = sys.icon;
            return (
              <div
                key={sys.route}
                onClick={() => {
                  Haptics.selection();
                  onNavigate(sys.route);
                }}
                className="p-4 rounded-2xl border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-outline)] cursor-pointer transition-all m3-pressable flex flex-col justify-between space-y-3"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: sys.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 tabular-nums">
                    {sys.score}%
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold font-display text-on-surface">
                    {sys.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">{sys.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          5. CONSISTENCY & DISCOVERED CORRELATIONS
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Discipline Consistency */}
        <div
          className="p-6 rounded-3xl border border-[var(--md-sys-color-outline-variant)] space-y-4"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container)',
          }}
        >
          <div>
            <h3 className="text-base font-bold font-display text-on-surface">Volume & Consistency</h3>
            <p className="text-xs text-on-surface-variant">Output regularity over past {rangeDays} days</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-medium mb-1">
                <span>Journal Reflection</span>
                <span className="font-mono">{journalConsistency}% regularity</span>
              </div>
              <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${journalConsistency}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-medium mb-1">
                <span>Study & Curriculum Output</span>
                <span className="font-mono">{studyConsistency}% regularity</span>
              </div>
              <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-300"
                  style={{ width: `${studyConsistency}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-medium mb-1">
                <span>Pulse Habit Tracking</span>
                <span className="font-mono">{pulseConsistency}% regularity</span>
              </div>
              <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-rose-400 transition-all duration-300"
                  style={{ width: `${pulseConsistency}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Discovered Cross-System Insights */}
        <div
          className="p-6 rounded-3xl border border-[var(--md-sys-color-outline-variant)] space-y-4"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container)',
          }}
        >
          <div>
            <h3 className="text-base font-bold font-display text-on-surface">Telemetry Correlations</h3>
            <p className="text-xs text-on-surface-variant">Algorithmic findings across your personal data</p>
          </div>

          {crossCorrelations.length > 0 ? (
            <div className="space-y-2.5">
              {crossCorrelations.slice(0, 3).map((cc, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 text-xs text-on-surface space-y-1"
                >
                  <span className="font-bold text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] mr-2">
                    {cc.tag}
                  </span>
                  <span className="leading-relaxed">{cc.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 text-xs text-on-surface-variant">
              Log daily study, pulse and recovery entries to reveal deeper cross-domain correlations.
            </div>
          )}
        </div>
      </div>

      {/* Global 60s Daily Ritual Modal */}
      <DailyRitualModal
        isOpen={isRitualModalOpen}
        onClose={() => setIsRitualModalOpen(false)}
        initialMode={ritualMode}
        onCompleted={() => setRefreshTrigger(v => v + 1)}
      />
    </div>
  );
};
