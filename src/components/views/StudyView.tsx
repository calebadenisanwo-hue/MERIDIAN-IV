import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  BookMarked,
  Timer,
  BarChart2,
  History,
  Plus,
  Trash2,
  Sparkles,
  Flame,
  Star,
  Check,
  Eye,
  EyeOff,
  Share2,
  Target,
  ArrowRight,
  Clock,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudyState, StudySubject, StudyDayTopic, StudyLog, JournalEntry, GoalCheckin } from '../../types';
import { MeridianStorage, fmtDateShort, todayStr, daysAgoStr } from '../../services/storage';
import { MEDICAL_CURRICULUM, FLATTENED_TOPICS } from '../../data/curriculumData';
import { Haptics } from '../../services/haptics';

// Web Audio API Dual-Tone Chime (zero dependencies, works on all browsers)
function playSprintChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
    osc2.frequency.setValueAtTime(659.25, now + 0.15); // E5
    osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.35); // C6

    gainNode.gain.setValueAtTime(0.25, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.9);
  } catch (e) {
    console.log('Audio chime not available:', e);
  }
}

export const StudyView: React.FC = () => {
  const [studyState, setStudyState] = useState<StudyState>(() => MeridianStorage.getStudy());
  const [activeTab, setActiveTab] = useState<'curriculum' | 'timer' | 'analytics' | 'history'>('curriculum');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ana');

  // Accordions
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({ ana_0: true });
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});

  // Focus Timer state
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(45 * 60);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState<number>(45 * 60);
  const [timerIsRunning, setTimerIsRunning] = useState<boolean>(false);
  const [timerSelectedTopicId, setTimerSelectedTopicId] = useState<string>('');
  const [revealAnkiAnswer, setRevealAnkiAnswer] = useState<boolean>(false);

  // Post-Session Debrief Modal
  const [isDebriefOpen, setIsDebriefOpen] = useState(false);
  const [debriefElapsedMins, setDebriefElapsedMins] = useState(45);
  const [debriefTopicId, setDebriefTopicId] = useState('');
  const [debriefFocusScore, setDebriefFocusScore] = useState(5);
  const [debriefTakeaway, setDebriefTakeaway] = useState('');
  const [debriefPublishToJournal, setDebriefPublishToJournal] = useState(true);
  const [debriefAdvanceGoals, setDebriefAdvanceGoals] = useState(true);
  const [debriefMarkTopicDone, setDebriefMarkTopicDone] = useState(true);

  // Study log search
  const [logSearch, setLogSearch] = useState('');

  // Synchronize browser tab title with active timer
  useEffect(() => {
    const originalTitle = document.title;
    if (timerIsRunning) {
      const m = Math.floor(timerSecondsLeft / 60);
      const s = timerSecondsLeft % 60;
      const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      const topicObj = FLATTENED_TOPICS.find(t => t.id === timerSelectedTopicId);
      const topicLabel = topicObj ? topicObj.t : 'Focus Sprint';
      document.title = `(${formatted}) ⏳ ${topicLabel} | Meridian`;
    } else {
      document.title = 'Meridian — Personal Systems Operating System';
    }
    return () => {
      document.title = originalTitle;
    };
  }, [timerIsRunning, timerSecondsLeft, timerSelectedTopicId]);

  // Timer countdown loop
  useEffect(() => {
    let interval: any = null;
    if (timerIsRunning) {
      interval = setInterval(() => {
        setTimerSecondsLeft(prev => {
          if (prev <= 1) {
            setTimerIsRunning(false);
            playSprintChime();
            confetti({ particleCount: 70, spread: 80, origin: { y: 0.55 } });
            Haptics.heavy();
            const totalMins = Math.max(1, Math.round(timerTotalSeconds / 60));
            triggerDebrief(totalMins, timerSelectedTopicId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerIsRunning, timerTotalSeconds, timerSelectedTopicId]);

  const triggerDebrief = (elapsedMinutes: number, topicId: string) => {
    setDebriefElapsedMins(elapsedMinutes);
    setDebriefTopicId(topicId);
    setDebriefFocusScore(5);
    setDebriefTakeaway('');
    setDebriefPublishToJournal(true);
    setDebriefAdvanceGoals(true);
    setDebriefMarkTopicDone(Boolean(topicId));
    setIsDebriefOpen(true);
  };

  const handleStartTimerForTopic = (topic: StudyDayTopic) => {
    Haptics.medium();
    setTimerSelectedTopicId(topic.id);
    const mins = topic.m || 45;
    setTimerTotalSeconds(mins * 60);
    setTimerSecondsLeft(mins * 60);
    setRevealAnkiAnswer(false);
    setActiveTab('timer');
    setTimerIsRunning(true);
  };

  const handleSetTimerPreset = (mins: number) => {
    Haptics.selection();
    setTimerIsRunning(false);
    setTimerSecondsLeft(mins * 60);
    setTimerTotalSeconds(mins * 60);
  };

  const handleExtendFiveMinutes = () => {
    Haptics.light();
    setTimerSecondsLeft(prev => prev + 5 * 60);
    setTimerTotalSeconds(prev => prev + 5 * 60);
  };

  const handleManualCompleteAndDebrief = () => {
    Haptics.medium();
    setTimerIsRunning(false);
    const elapsedSeconds = timerTotalSeconds - timerSecondsLeft;
    const elapsedMins = Math.max(1, Math.round(elapsedSeconds / 60));
    triggerDebrief(elapsedMins, timerSelectedTopicId);
  };

  const handleFinalizeDebrief = () => {
    Haptics.success();
    const topic = FLATTENED_TOPICS.find(t => t.id === debriefTopicId);
    const topicName = topic ? topic.t : 'Focused Sprint';

    // 1. Create Study Log
    const newLog: StudyLog = {
      id: 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: todayStr(),
      subjectId: topic ? topic.moduleId : null,
      durationMins: debriefElapsedMins,
      focusScore: debriefFocusScore,
      topic: topicName,
      topicId: topic ? topic.id : null,
      note: debriefTakeaway.trim() || (topic ? `Mastered ${topic.moduleCode}` : 'Deep study block'),
    };

    const newProgressDone = { ...studyState.progress.done };
    if (debriefMarkTopicDone && topic) {
      newProgressDone[topic.id] = true;
    }

    const updatedStudyState: StudyState = {
      ...studyState,
      progress: { done: newProgressDone },
      logs: [newLog, ...studyState.logs],
    };
    setStudyState(updatedStudyState);
    MeridianStorage.saveStudy(updatedStudyState);

    // 2. Publish to Logbook / Journal if requested
    if (debriefPublishToJournal) {
      try {
        const journalEntries = MeridianStorage.getJournal();
        const subjectTag = topic ? topic.subjectId.toLowerCase() : 'study';
        const journalText = debriefTakeaway.trim()
          ? `**Study Reflection: ${topicName}** (${debriefElapsedMins}m sprint, Focus: ${debriefFocusScore}/5)\n\nKey Takeaway: ${debriefTakeaway.trim()}`
          : `**Study Sprint Completed:** ${topicName} for ${debriefElapsedMins} minutes at ${debriefFocusScore}/5 focus score.`;

        const newJournalEntry: JournalEntry = {
          id: 'j_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          text: journalText,
          tag: subjectTag,
          pinned: false,
          timestamp: Date.now(),
          dateStr: todayStr(),
        };
        MeridianStorage.saveJournal([newJournalEntry, ...journalEntries]);
      } catch (err) {
        console.error('Failed to auto-publish study journal:', err);
      }
    }

    // 3. Advance linked Goals if requested
    if (debriefAdvanceGoals) {
      try {
        const goalsState = MeridianStorage.getGoals();
        const activeGoals = goalsState.goals || [];
        // Look for goals with "study", "exam", or topic's subject in title
        const matchingGoals = activeGoals.filter(g =>
          !g.archived &&
          (g.title.toLowerCase().includes('study') ||
           g.title.toLowerCase().includes('exam') ||
           g.title.toLowerCase().includes('syllabus') ||
           (topic && g.title.toLowerCase().includes(topic.subjectId.toLowerCase())))
        );

        if (matchingGoals.length > 0) {
          const updatedGoals = [...activeGoals];
          const newCheckins: GoalCheckin[] = [...(goalsState.checkins || [])];

          matchingGoals.forEach(targetGoal => {
            const increment = targetGoal.unit?.toLowerCase().includes('hr')
              ? debriefElapsedMins / 60
              : debriefElapsedMins;
            targetGoal.currentValue = (targetGoal.currentValue || 0) + increment;

            newCheckins.push({
              id: 'gc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
              goalId: targetGoal.id,
              date: todayStr(),
              value: increment,
              note: `Sprint: ${topicName} (+${debriefElapsedMins}m)`,
            });
          });

          MeridianStorage.saveGoals({
            ...goalsState,
            goals: updatedGoals,
            checkins: newCheckins,
          });
        }
      } catch (err) {
        console.error('Failed to auto-advance study goals:', err);
      }
    }

    setIsDebriefOpen(false);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
  };

  const handleToggleTopicDone = (topic: StudyDayTopic) => {
    Haptics.selection();
    const isCurrentlyDone = !!studyState.progress.done[topic.id];
    const newProgressDone = { ...studyState.progress.done };

    if (isCurrentlyDone) {
      delete newProgressDone[topic.id];
      const updatedLogs = studyState.logs.filter(l => l.topicId !== topic.id);
      const newState: StudyState = {
        ...studyState,
        progress: { done: newProgressDone },
        logs: updatedLogs,
      };
      setStudyState(newState);
      MeridianStorage.saveStudy(newState);
    } else {
      newProgressDone[topic.id] = true;
      const newLog: StudyLog = {
        id: 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        date: todayStr(),
        subjectId: topic.moduleId,
        durationMins: topic.m,
        focusScore: 5,
        topic: topic.t,
        topicId: topic.id,
        note: `Curriculum: ${topic.moduleCode}`,
      };
      const newState: StudyState = {
        ...studyState,
        progress: { done: newProgressDone },
        logs: [newLog, ...studyState.logs],
      };
      setStudyState(newState);
      MeridianStorage.saveStudy(newState);
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
    }
  };

  const handleDeleteLog = (id: string) => {
    if (confirm('Delete this study log entry?')) {
      Haptics.light();
      const log = studyState.logs.find(l => l.id === id);
      const newProgressDone = { ...studyState.progress.done };
      if (log?.topicId) delete newProgressDone[log.topicId];

      const newState: StudyState = {
        ...studyState,
        logs: studyState.logs.filter(l => l.id !== id),
        progress: { done: newProgressDone },
      };
      setStudyState(newState);
      MeridianStorage.saveStudy(newState);
    }
  };

  // Timer math
  const timerMins = Math.floor(timerSecondsLeft / 60);
  const timerSecs = timerSecondsLeft % 60;
  const timerFormatted = `${String(timerMins).padStart(2, '0')}:${String(timerSecs).padStart(2, '0')}`;
  const timerProgressFraction = timerTotalSeconds > 0 ? (timerTotalSeconds - timerSecondsLeft) / timerTotalSeconds : 0;
  const timerStrokeDash = Math.round(2 * Math.PI * 88 * (1 - timerProgressFraction));

  // Current Subject calculations
  const currentSubject = MEDICAL_CURRICULUM.find(s => s.id === selectedSubjectId) || MEDICAL_CURRICULUM[0];
  const subjectTopics = FLATTENED_TOPICS.filter(t => t.subjectId === selectedSubjectId);
  const subjectDoneCount = subjectTopics.filter(t => studyState.progress.done[t.id]).length;
  const subjectTotalCount = subjectTopics.length;
  const subjectPct = Math.round((subjectDoneCount / Math.max(1, subjectTotalCount)) * 100);

  // Today & Weekly study metrics
  const todayDateStr = todayStr();
  const todayMins = studyState.logs.filter(l => l.date === todayDateStr).reduce((acc, l) => acc + l.durationMins, 0);
  const todaySprintsCount = studyState.logs.filter(l => l.date === todayDateStr).length;

  const d6 = daysAgoStr(6);
  const weekMins = studyState.logs.filter(l => l.date >= d6).reduce((acc, l) => acc + l.durationMins, 0);
  const weekHours = (weekMins / 60).toFixed(1);

  // Filtered study logs
  const filteredLogs = studyState.logs.filter(
    l =>
      !logSearch.trim() ||
      (l.topic && l.topic.toLowerCase().includes(logSearch.toLowerCase())) ||
      (l.note && l.note.toLowerCase().includes(logSearch.toLowerCase()))
  );

  const activeTimerTopic = FLATTENED_TOPICS.find(t => t.id === timerSelectedTopicId);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Study Header & Live Today Sprint Stats */}
      <div
        className="p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase text-primary">
              Active Medical Ledger
            </span>
            <span className="text-xs text-on-surface-variant">· 200 Level Mastery</span>
          </div>
          <h2 className="text-xl font-bold font-display text-on-surface">
            Study Sprint & Curriculum Engine
          </h2>
          <p className="text-xs text-on-surface-variant max-w-md">
            Execute single-task deep work blocks, test active recall, and auto-link outputs.
          </p>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="p-3 px-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant text-center">
            <div className="text-xs text-on-surface-variant font-medium">Today's Focus</div>
            <div className="text-lg font-bold font-mono text-primary">{todayMins}m</div>
            <div className="text-[10px] font-mono text-on-surface-variant">{todaySprintsCount} sprints</div>
          </div>
          <div className="p-3 px-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant text-center">
            <div className="text-xs text-on-surface-variant font-medium">Past 7 Days</div>
            <div className="text-lg font-bold font-mono text-on-surface">{weekHours}h</div>
            <div className="text-[10px] font-mono text-emerald-400">Target: 20h</div>
          </div>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div
        className="p-1.5 rounded-2xl border flex items-center gap-1 overflow-x-auto"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        {[
          { id: 'curriculum', label: '200L Syllabus', icon: BookMarked },
          { id: 'timer', label: timerIsRunning ? `Focus Sprint (${timerFormatted})` : 'Focus Timer', icon: Timer, alert: timerIsRunning },
          { id: 'analytics', label: 'Mastery Analytics', icon: BarChart2 },
          { id: 'history', label: `Logs (${studyState.logs.length})`, icon: History },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                Haptics.selection();
                setActiveTab(tab.id as any);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.alert && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TAB 1: CURRICULUM SYLLABUS VIEW
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'curriculum' && (
        <div className="space-y-5">
          {/* Subject Switcher */}
          <div className="flex items-center gap-2 border-b border-outline-variant pb-2 overflow-x-auto">
            {MEDICAL_CURRICULUM.map(subj => {
              const count = FLATTENED_TOPICS.filter(t => t.subjectId === subj.id && studyState.progress.done[t.id]).length;
              const total = FLATTENED_TOPICS.filter(t => t.subjectId === subj.id).length;
              const isSelected = selectedSubjectId === subj.id;

              return (
                <button
                  key={subj.id}
                  onClick={() => {
                    Haptics.selection();
                    setSelectedSubjectId(subj.id);
                  }}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border flex items-center gap-2 whitespace-nowrap ${
                    isSelected
                      ? 'border-primary bg-primary-container text-on-primary-container shadow-sm'
                      : 'border-outline-variant text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span>{subj.name}</span>
                  <span className="text-[10px] font-mono opacity-80">
                    {count}/{total}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Subject Header Ribbon */}
          <div
            className="p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase text-primary">
                  {currentSubject.code} Syllabus
                </span>
                <span className="text-xs text-on-surface-variant">· 200 Level Medical</span>
              </div>
              <h3 className="text-lg font-bold font-display text-on-surface mt-0.5">
                {currentSubject.name} Mastery
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 max-w-lg">{currentSubject.tagline}</p>
            </div>
            <div className="text-right sm:text-right shrink-0 space-y-1">
              <div className="text-2xl font-bold font-mono text-primary">{subjectPct}%</div>
              <div className="text-xs font-mono text-on-surface-variant">
                {subjectDoneCount} of {subjectTotalCount} topics completed
              </div>
            </div>
          </div>

          {/* Modules Accordion */}
          <div className="space-y-3">
            {currentSubject.modules.map((mod, mi) => {
              const modId = `${currentSubject.id}_${mi}`;
              const isOpen = !!openModules[modId];
              const modTopics = FLATTENED_TOPICS.filter(t => t.moduleId === modId);
              const modDone = modTopics.filter(t => studyState.progress.done[t.id]).length;
              const modPct = Math.round((modDone / Math.max(1, modTopics.length)) * 100);

              return (
                <div
                  key={modId}
                  className="rounded-3xl border overflow-hidden shadow-sm transition-all"
                  style={{
                    backgroundColor: 'var(--md-sys-color-surface-container)',
                    borderColor: 'var(--md-sys-color-outline-variant)',
                  }}
                >
                  {/* Module Header */}
                  <div
                    onClick={() => {
                      Haptics.light();
                      setOpenModules(prev => ({ ...prev, [modId]: !prev[modId] }));
                    }}
                    className="p-4.5 px-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl font-mono text-xs font-bold flex items-center justify-center text-on-primary shadow-sm"
                        style={{ backgroundColor: 'var(--md-sys-color-primary)' }}
                      >
                        {mi + 1}
                      </div>
                      <div>
                        <div className="text-xs font-mono font-semibold text-primary">{mod.code}</div>
                        <h4 className="text-sm font-bold text-on-surface">{mod.title}</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-mono font-semibold">
                          {modDone}/{modTopics.length} done
                        </div>
                        <div className="w-20 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden mt-1">
                          <div className="h-full bg-primary" style={{ width: `${modPct}%` }} />
                        </div>
                      </div>
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Topics List */}
                  {isOpen && (
                    <div className="p-3 pt-0 space-y-2 border-t border-outline-variant bg-black/5 dark:bg-white/5">
                      {modTopics.map(topic => {
                        const isDone = !!studyState.progress.done[topic.id];
                        const isTopicExpanded = !!openTopics[topic.id];

                        return (
                          <div
                            key={topic.id}
                            className={`rounded-2xl border p-3.5 space-y-2.5 transition-all ${
                              isDone
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : 'bg-surface-container border-outline-variant'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTopicDone(topic)}
                                  className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                                    isDone
                                      ? 'bg-emerald-500 text-black border-emerald-500'
                                      : 'border-outline hover:border-primary'
                                  }`}
                                  aria-label={isDone ? 'Mark topic incomplete' : 'Mark topic complete'}
                                >
                                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                                </button>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded-full bg-black/10 dark:bg-white/10 text-on-surface-variant">
                                      Day {topic.dayNum}/{topic.dayTotal} · {topic.m}m
                                    </span>
                                  </div>
                                  <h5
                                    className={`text-xs md:text-sm font-semibold mt-0.5 ${
                                      isDone ? 'line-through text-on-surface-variant' : 'text-on-surface'
                                    }`}
                                  >
                                    {topic.t}
                                  </h5>
                                  <p className="text-xs text-on-surface-variant mt-0.5">{topic.b}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Direct "Focus on this Topic" Button */}
                                <button
                                  type="button"
                                  onClick={() => handleStartTimerForTopic(topic)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-primary/15 text-primary hover:bg-primary hover:text-on-primary transition-all shadow-xs"
                                  title="Launch Focus Sprint for this topic"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span className="hidden sm:inline">Start Sprint</span>
                                </button>

                                <button
                                  onClick={() => {
                                    Haptics.light();
                                    setOpenTopics(prev => ({ ...prev, [topic.id]: !prev[topic.id] }));
                                  }}
                                  type="button"
                                  className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-on-surface-variant"
                                  aria-label="Expand Active Recall prompts"
                                >
                                  {isTopicExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Active Recall & Anki Prompt */}
                            {isTopicExpanded && (
                              <div className="pt-2 border-t border-outline-variant space-y-2 text-xs">
                                <div>
                                  <span className="font-mono uppercase text-[10px] font-bold text-primary">
                                    Anki Flashcard Blueprint:
                                  </span>
                                  <p className="p-2.5 rounded-xl bg-black/10 dark:bg-white/10 font-mono text-[11px] text-on-surface mt-1">
                                    {topic.a}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-mono uppercase text-[10px] font-bold text-primary">
                                    Active Recall Prompts (Self-test without looking):
                                  </span>
                                  <ul className="list-disc list-inside space-y-1 text-on-surface-variant mt-1">
                                    {topic.r.map((q, qi) => (
                                      <li key={qi}>{q}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 2: INTERACTIVE FOCUS SPRINT ENGINE & ACTIVE STUDY
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'timer' && (
        <div className="space-y-6 max-w-xl mx-auto">
          {/* Main Timer Dial Card */}
          <div
            className="p-8 rounded-3xl border shadow-md text-center space-y-6 relative overflow-hidden"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            {/* Top State Indicator */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary">
                Focus Telemetry Engine
              </span>
              <div
                className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 ${
                  timerIsRunning
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : timerSecondsLeft < timerTotalSeconds
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-black/10 dark:bg-white/10 text-on-surface-variant'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    timerIsRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                {timerIsRunning ? 'IN FLOW' : timerSecondsLeft < timerTotalSeconds ? 'PAUSED' : 'READY'}
              </div>
            </div>

            {/* Circular Progress Gauge */}
            <div className="relative w-64 h-64 mx-auto flex items-center justify-center my-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                {/* Background Ring */}
                <circle
                  cx="100"
                  cy="100"
                  r="88"
                  className="stroke-black/10 dark:stroke-white/10"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Progress Active Ring */}
                <circle
                  cx="100"
                  cy="100"
                  r="88"
                  stroke="var(--md-sys-color-primary)"
                  strokeWidth="10"
                  strokeDasharray={Math.round(2 * Math.PI * 88)}
                  strokeDashoffset={timerStrokeDash}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>

              {/* Monospace Center Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl sm:text-6xl font-bold font-mono text-on-surface tracking-tight">
                  {timerFormatted}
                </div>
                <div className="text-xs text-on-surface-variant font-mono mt-1">
                  {activeTimerTopic ? activeTimerTopic.moduleCode : 'Medical Sprint'}
                </div>
              </div>
            </div>

            {/* Topic Link Dropdown */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span>Link sprint to curriculum topic:</span>
              </label>
              <select
                value={timerSelectedTopicId}
                onChange={e => {
                  setTimerSelectedTopicId(e.target.value);
                  setRevealAnkiAnswer(false);
                }}
                className="w-full px-3.5 py-2.5 text-xs rounded-2xl border bg-black/5 dark:bg-white/5 border-outline-variant text-on-surface font-medium focus:outline-hidden focus:border-primary"
              >
                <option value="" className="dark:bg-zinc-800">
                  — General Medical Study (Free Focus) —
                </option>
                {FLATTENED_TOPICS.map(t => (
                  <option key={t.id} value={t.id} className="dark:bg-zinc-800">
                    {t.moduleCode} · {t.t} ({t.m}m)
                  </option>
                ))}
              </select>
            </div>

            {/* Preset Buttons */}
            <div className="flex justify-center gap-2 flex-wrap">
              {[
                { m: 25, label: '25m Pomodoro' },
                { m: 45, label: '45m Syllabus' },
                { m: 60, label: '60m Deep Review' },
                { m: 90, label: '90m Exam Block' },
                { m: 5, label: '5m Break' },
              ].map(preset => (
                <button
                  key={preset.m}
                  type="button"
                  onClick={() => handleSetTimerPreset(preset.m)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                    timerTotalSeconds === preset.m * 60
                      ? 'bg-primary-container text-on-primary-container border-primary font-bold shadow-xs'
                      : 'border-outline-variant text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Primary Action Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  Haptics.medium();
                  setTimerIsRunning(!timerIsRunning);
                }}
                type="button"
                className="flex-1 max-w-xs py-3.5 px-6 rounded-2xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-95"
                style={{
                  backgroundColor: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-on-primary)',
                }}
              >
                {timerIsRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{timerIsRunning ? 'Pause Sprint' : 'Start Focus Sprint'}</span>
              </button>

              {/* +5 Mins Quick Extend */}
              <button
                onClick={handleExtendFiveMinutes}
                type="button"
                className="px-3.5 py-3.5 rounded-2xl border border-outline-variant hover:bg-black/5 dark:hover:bg-white/5 text-xs font-mono font-bold text-on-surface transition-all"
                title="Add 5 minutes to countdown"
              >
                +5m
              </button>

              {/* Reset */}
              <button
                onClick={() => handleSetTimerPreset(timerTotalSeconds / 60)}
                type="button"
                className="p-3.5 rounded-2xl border border-outline-variant hover:bg-black/5 dark:hover:bg-white/5 text-on-surface-variant transition-all"
                title="Reset countdown"
                aria-label="Reset countdown"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Finish & Log */}
              <button
                onClick={handleManualCompleteAndDebrief}
                type="button"
                className="px-4 py-3.5 rounded-2xl text-xs font-bold border border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                title="Wrap up and log this session"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Wrap Up</span>
              </button>
            </div>
          </div>

          {/* Active Topic Companion Tray (Anki Flashcard Blueprint) */}
          {activeTimerTopic && (
            <div
              className="p-6 rounded-3xl border space-y-4 shadow-sm"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container)',
                borderColor: 'var(--md-sys-color-outline-variant)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-bold text-on-surface">
                    Topic Study Aid: {activeTimerTopic.t}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setRevealAnkiAnswer(!revealAnkiAnswer)}
                  className="text-xs font-mono font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  {revealAnkiAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{revealAnkiAnswer ? 'Hide Blueprint' : 'Test Memory / Reveal'}</span>
                </button>
              </div>

              {/* Concept Overview */}
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {activeTimerTopic.b}
              </p>

              {/* Anki Flashcard Blueprint Card */}
              <div className="p-4 rounded-2xl bg-black/10 dark:bg-white/5 border border-outline-variant space-y-2">
                <div className="text-[11px] font-mono font-bold uppercase text-primary">
                  🧠 High-Yield Flashcard Anchor:
                </div>
                <div className="text-xs font-mono text-on-surface">
                  {revealAnkiAnswer ? (
                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-on-surface font-semibold animate-in fade-in">
                      {activeTimerTopic.a}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-black/20 text-center text-on-surface-variant italic cursor-pointer hover:text-on-surface" onClick={() => setRevealAnkiAnswer(true)}>
                      Click to reveal high-yield anatomical/physiological relations...
                    </div>
                  )}
                </div>
              </div>

              {/* Active Recall Prompts */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono font-bold uppercase text-primary">
                  🎯 Self-Test Prompts:
                </div>
                <ul className="space-y-1 text-xs text-on-surface-variant">
                  {activeTimerTopic.r.map((prompt, pi) => (
                    <li key={pi} className="flex items-start gap-2">
                      <span className="text-primary font-bold">·</span>
                      <span>{prompt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          POST-SESSION DEBRIEF MODAL (Cross-Module Automatic Synthesis)
          ═══════════════════════════════════════════════════════════════ */}
      {isDebriefOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-lg rounded-3xl p-6 border shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-on-surface">
                    Sprint Completed!
                  </h3>
                  <p className="text-xs text-on-surface-variant font-mono">
                    {debriefElapsedMins} minutes logged on today's ledger
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDebriefOpen(false)}
                className="text-xs font-mono text-on-surface-variant hover:text-on-surface p-1"
              >
                ✕
              </button>
            </div>

            {/* Focus Quality Rating (1 to 5 Stars) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
                <span>Focus Quality:</span>
                <span className="font-mono text-primary font-bold">{debriefFocusScore}/5</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      Haptics.selection();
                      setDebriefFocusScore(star);
                    }}
                    className={`flex-1 py-2 rounded-xl border flex items-center justify-center transition-all ${
                      star <= debriefFocusScore
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'border-outline-variant text-slate-500'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${star <= debriefFocusScore ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Key Takeaway Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>1-Sentence Key Takeaway or Principle Mastered:</span>
              </label>
              <textarea
                value={debriefTakeaway}
                onChange={e => setDebriefTakeaway(e.target.value)}
                placeholder="e.g. Cranial nerve VII exits stylomastoid foramen to supply facial expression muscles..."
                rows={3}
                className="w-full p-3 rounded-2xl border text-xs bg-black/5 dark:bg-white/5 border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-hidden focus:border-primary resize-none"
              />
            </div>

            {/* Cross-Module Synthesis Toggles */}
            <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant space-y-2.5">
              <div className="text-[11px] font-mono font-bold uppercase text-primary">
                ⚡ Cross-System Compound Integrations:
              </div>

              {/* 1. Logbook Publish */}
              <label className="flex items-start gap-2.5 text-xs text-on-surface cursor-pointer">
                <input
                  type="checkbox"
                  checked={debriefPublishToJournal}
                  onChange={e => setDebriefPublishToJournal(e.target.checked)}
                  className="rounded border-outline-variant mt-0.5 accent-emerald-500"
                />
                <div>
                  <span className="font-semibold">Publish reflection into Logbook</span>
                  <p className="text-[11px] text-on-surface-variant">
                    Saves this takeaway with tags into your Journal for long-term compound review.
                  </p>
                </div>
              </label>

              {/* 2. Goal Checkin Increment */}
              <label className="flex items-start gap-2.5 text-xs text-on-surface cursor-pointer">
                <input
                  type="checkbox"
                  checked={debriefAdvanceGoals}
                  onChange={e => setDebriefAdvanceGoals(e.target.checked)}
                  className="rounded border-outline-variant mt-0.5 accent-emerald-500"
                />
                <div>
                  <span className="font-semibold">Advance linked Study Goals</span>
                  <p className="text-[11px] text-on-surface-variant">
                    Automatically applies +{debriefElapsedMins}m to relevant syllabus and exam goals.
                  </p>
                </div>
              </label>

              {/* 3. Mark Topic Complete */}
              {debriefTopicId && (
                <label className="flex items-start gap-2.5 text-xs text-on-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={debriefMarkTopicDone}
                    onChange={e => setDebriefMarkTopicDone(e.target.checked)}
                    className="rounded border-outline-variant mt-0.5 accent-emerald-500"
                  />
                  <div>
                    <span className="font-semibold">Mark topic complete in 200L Syllabus</span>
                    <p className="text-[11px] text-on-surface-variant">
                      Advances course mastery percentage on the syllabus tree.
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDebriefOpen(false)}
                className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-on-surface-variant hover:text-on-surface"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleFinalizeDebrief}
                className="px-6 py-2.5 rounded-2xl text-xs font-bold text-on-primary shadow-md flex items-center gap-2"
                style={{ backgroundColor: 'var(--md-sys-color-primary)' }}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save to All Systems</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 3: MASTERY ANALYTICS VIEW
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div
            className="p-6 rounded-3xl border space-y-4"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            <h3 className="text-base font-bold font-display">200L Syllabus Completion by Subject</h3>
            <div className="space-y-3">
              {MEDICAL_CURRICULUM.map(subj => {
                const topics = FLATTENED_TOPICS.filter(t => t.subjectId === subj.id);
                const done = topics.filter(t => studyState.progress.done[t.id]).length;
                const pct = Math.round((done / Math.max(1, topics.length)) * 100);

                return (
                  <div key={subj.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span>{subj.name}</span>
                      <span className="font-mono">{done}/{topics.length} topics ({pct}%)</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: subj.id === 'ana' ? '#2D6A4F' : subj.id === 'phs' ? '#00796B' : '#D97706' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 4: STUDY SPRINT HISTORY
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <input
            type="text"
            value={logSearch}
            onChange={e => setLogSearch(e.target.value)}
            placeholder="Search study logs, topics or takeaways..."
            className="w-full px-4 py-2.5 text-xs rounded-full border bg-black/5 dark:bg-white/5 border-outline-variant text-on-surface"
          />

          <div
            className="rounded-3xl border divide-y overflow-hidden shadow-sm"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-xs text-on-surface-variant">
                No study logs found. Complete a sprint with the Focus Timer to populate your ledger.
              </div>
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} className="p-4 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-primary">
                        {fmtDateShort(log.date)}
                      </span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-mono font-bold">
                        {log.durationMins} mins
                      </span>
                      {log.focusScore && (
                        <span className="text-[10px] text-amber-400 font-mono">
                          ★ {log.focusScore}/5
                        </span>
                      )}
                    </div>
                    <h5 className="text-xs md:text-sm font-semibold text-on-surface">
                      {log.topic || 'Study Block'}
                    </h5>
                    {log.note && <p className="text-xs text-on-surface-variant leading-relaxed">{log.note}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-rose-400"
                    title="Delete log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
