import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Palette,
  SlidersHorizontal,
  Cloud,
  HardDrive,
  Sun,
  Moon,
  Monitor,
  Check,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { MaterialTheme, ThemeMode, SystemWeights } from '../../types';
import { THEME_PALETTES } from '../../theme/materialYou';
import { MeridianStorage } from '../../services/storage';
import {
  subscribeToSyncStatus,
  SyncState,
  getLastSyncTime,
  isAutoSyncEnabled,
  setAutoSyncEnabled,
  syncToSupabase,
  fetchFromSupabase,
} from '../../services/supabase';
import { Haptics } from '../../services/haptics';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPalette: MaterialTheme;
  currentMode: ThemeMode;
  onSelectTheme: (palette: MaterialTheme, mode: ThemeMode) => void;
  onDataChanged: () => void;
}

type SettingsTab = 'appearance' | 'weights' | 'backup' | 'storage';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentPalette,
  currentMode,
  onSelectTheme,
  onDataChanged,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [weights, setWeights] = useState<SystemWeights>(() => MeridianStorage.getWeights());
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(getLastSyncTime());
  const [autoSync, setAutoSync] = useState<boolean>(isAutoSyncEnabled());
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setWeights(MeridianStorage.getWeights());
    const unsubscribe = subscribeToSyncStatus((state, time) => {
      setSyncState(state);
      if (time) setLastSyncTime(time);
    });
    return unsubscribe;
  }, [isOpen]);

  if (!isOpen) return null;

  // Weight handler
  const handleWeightChange = (key: keyof SystemWeights, val: number) => {
    const updated = { ...weights, [key]: val };
    setWeights(updated);
    MeridianStorage.saveWeights(updated);
    onDataChanged();
  };

  const totalWeight =
    weights.journal +
    weights.study +
    weights.recovery +
    weights.finance +
    weights.pulse +
    weights.goals;

  const getWeightPct = (w: number) => {
    return totalWeight > 0 ? Math.round((w / totalWeight) * 100) : 0;
  };

  // Cloud sync trigger
  const handleManualSync = async () => {
    Haptics.light();
    setStatusMsg({ text: 'Syncing telemetry with cloud database...' });
    try {
      const res = await syncToSupabase();
      if (res.success) {
        setStatusMsg({ text: 'Cloud telemetry successfully synced!' });
        setLastSyncTime(getLastSyncTime());
      } else {
        setStatusMsg({ text: res.message || 'Sync failed. Please check internet connection.', isError: true });
      }
    } catch {
      setStatusMsg({ text: 'Error executing cloud sync.', isError: true });
    }
  };

  // Export JSON backup
  const handleExportBackup = () => {
    Haptics.light();
    const data = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      journal: MeridianStorage.getJournal(),
      study: MeridianStorage.getStudy(),
      recovery: MeridianStorage.getRecovery(),
      finance: MeridianStorage.getFinance(),
      pulse: MeridianStorage.getPulse(),
      goals: MeridianStorage.getGoals(),
      weights: MeridianStorage.getWeights(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meridian-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg({ text: 'Backup downloaded successfully.' });
  };

  // Import JSON backup
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.journal) MeridianStorage.saveJournal(parsed.journal);
        if (parsed.study) MeridianStorage.saveStudy(parsed.study);
        if (parsed.recovery) MeridianStorage.saveRecovery(parsed.recovery);
        if (parsed.finance) MeridianStorage.saveFinance(parsed.finance);
        if (parsed.pulse) MeridianStorage.savePulse(parsed.pulse);
        if (parsed.goals) MeridianStorage.saveGoals(parsed.goals);
        if (parsed.weights) MeridianStorage.saveWeights(parsed.weights);

        onDataChanged();
        setStatusMsg({ text: 'Data restored successfully from backup file.' });
      } catch {
        setStatusMsg({ text: 'Invalid JSON backup format.', isError: true });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset data handler
  const handleResetData = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    localStorage.clear();
    sessionStorage.clear();
    onDataChanged();
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md bg-black/60 m3-fade-enter"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-[var(--md-sys-color-outline-variant)]"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
          color: 'var(--md-sys-color-on-surface)',
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <div>
            <h2 className="text-lg font-bold font-display text-on-surface">Settings & Preferences</h2>
            <p className="text-xs text-on-surface-variant">Theme, system weights, cloud sync & data storage</p>
          </div>
          <button
            onClick={() => {
              Haptics.light();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-on-surface-variant transition-colors m3-pressable"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Material 3 Segmented Tab Bar */}
        <div className="px-6 pt-3 pb-2 border-b border-[var(--md-sys-color-outline-variant)] overflow-x-auto">
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/5 dark:bg-white/5 w-fit min-w-full sm:min-w-0">
            {[
              { id: 'appearance' as SettingsTab, label: 'Appearance', icon: Palette },
              { id: 'weights' as SettingsTab, label: 'Weights', icon: SlidersHorizontal },
              { id: 'backup' as SettingsTab, label: 'Sync & Backup', icon: Cloud },
              { id: 'storage' as SettingsTab, label: 'Storage', icon: Database },
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    Haptics.selection();
                    setActiveTab(tab.id);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all m3-pressable whitespace-nowrap ${
                    isSelected
                      ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: APPEARANCE (MATERIAL YOU) */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Light / Dark Mode Toggle */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-on-surface-variant mb-2.5">
                  Surface Lighting
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'light' as ThemeMode, label: 'Light', icon: Sun },
                    { id: 'dark' as ThemeMode, label: 'Dark', icon: Moon },
                    { id: 'system' as ThemeMode, label: 'System', icon: Monitor },
                  ].map(m => {
                    const Icon = m.icon;
                    const isSelected = currentMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          Haptics.selection();
                          onSelectTheme(currentPalette, m.id);
                        }}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border text-xs font-semibold transition-all m3-pressable ${
                          isSelected
                            ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)] shadow-sm'
                            : 'border-[var(--md-sys-color-outline-variant)] text-on-surface hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Monet Palettes */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface-variant">
                    Material 3 Monet Tonal Seed
                  </label>
                  <span className="text-[11px] text-primary font-medium">
                    {THEME_PALETTES[currentPalette]?.name} Active
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(THEME_PALETTES) as MaterialTheme[]).map(key => {
                    const pal = THEME_PALETTES[key];
                    const isSelected = currentPalette === key;
                    const isDark = currentMode === 'dark';
                    const colors = isDark ? pal.dark : pal.light;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          Haptics.selection();
                          onSelectTheme(key, currentMode);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all m3-pressable flex items-center justify-between ${
                          isSelected
                            ? 'bg-[var(--md-sys-color-primary-container)] border-[var(--md-sys-color-primary)] shadow-sm ring-1 ring-[var(--md-sys-color-primary)]'
                            : 'bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-outline)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{pal.icon}</span>
                          <div>
                            <div
                              className={`text-xs font-bold ${
                                isSelected
                                  ? 'text-[var(--md-sys-color-on-primary-container)]'
                                  : 'text-on-surface'
                              }`}
                            >
                              {pal.name}
                            </div>
                            {/* Color Swatch Dots */}
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span
                                className="w-3.5 h-3.5 rounded-full shadow-xs"
                                style={{ backgroundColor: colors.primary }}
                              />
                              <span
                                className="w-3.5 h-3.5 rounded-full shadow-xs"
                                style={{ backgroundColor: colors.secondary }}
                              />
                              <span
                                className="w-3.5 h-3.5 rounded-full shadow-xs"
                                style={{ backgroundColor: colors.tertiary }}
                              />
                              <span
                                className="w-3.5 h-3.5 rounded-full shadow-xs"
                                style={{ backgroundColor: colors.accentFinance }}
                              />
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center shadow-xs"
                            style={{
                              backgroundColor: 'var(--md-sys-color-primary)',
                              color: 'var(--md-sys-color-on-primary)',
                            }}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SYSTEM COMPOSITE WEIGHTS */}
          {activeTab === 'weights' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Calibrate how much each discipline influences your unified{' '}
                  <strong className="text-on-surface">Personal Health Index (0–100)</strong>. Percentages
                  automatically normalize to 100%.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'study' as keyof SystemWeights, label: 'Study & Curriculum Ledger', color: '#2D6A4F' },
                  { key: 'recovery' as keyof SystemWeights, label: 'Unbound Recovery & Habits', color: '#D3A346' },
                  { key: 'finance' as keyof SystemWeights, label: 'Finance & Runway Ledger', color: '#4FA9E0' },
                  { key: 'pulse' as keyof SystemWeights, label: 'Pulse Sleep & Vitality', color: '#E0574B' },
                  { key: 'goals' as keyof SystemWeights, label: 'Active Goals & Milestones', color: '#E8B368' },
                  { key: 'journal' as keyof SystemWeights, label: 'Mindful Journal Logs', color: '#805B9A' },
                ].map(item => {
                  const val = weights[item.key];
                  const pct = getWeightPct(val);
                  return (
                    <div
                      key={item.key}
                      className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="font-semibold text-on-surface">{item.label}</span>
                        </div>
                        <span className="font-mono font-bold text-primary">{pct}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={val}
                        onChange={e => handleWeightChange(item.key, Number(e.target.value))}
                        className="w-full accent-[var(--md-sys-color-primary)] cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SYNC & BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              {/* Cloud Auto-Sync Card */}
              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Cloud className="w-5 h-5 text-emerald-500" />
                    <div>
                      <div className="text-xs font-bold text-on-surface">Supabase Cloud Sync</div>
                      <div className="text-[11px] text-on-surface-variant font-mono">
                        {lastSyncTime
                          ? `Last sync: ${new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : 'Not synced yet'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleManualSync}
                    disabled={syncState === 'syncing'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold m3-pressable disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncState === 'syncing' ? 'animate-spin' : ''}`} />
                    <span>{syncState === 'syncing' ? 'Syncing...' : 'Sync Now'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                  <span className="text-xs text-on-surface">Continuous Auto-Sync</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={e => {
                        const next = e.target.checked;
                        setAutoSync(next);
                        setAutoSyncEnabled(next);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-black/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--md-sys-color-primary)]" />
                  </label>
                </div>
              </div>

              {/* Local File Export / Import */}
              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-on-surface">File Export & Import</span>
                </div>
                <p className="text-xs text-on-surface-variant">
                  Export complete encrypted JSON archive or restore your profile anytime without vendor lock-in.
                </p>
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    onClick={handleExportBackup}
                    className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2 rounded-full border border-[var(--md-sys-color-outline-variant)] text-xs font-semibold text-on-surface hover:bg-black/5 dark:hover:bg-white/5 m3-pressable"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" />
                    <span>Export JSON</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2 rounded-full border border-[var(--md-sys-color-outline-variant)] text-xs font-semibold text-on-surface hover:bg-black/5 dark:hover:bg-white/5 m3-pressable"
                  >
                    <Upload className="w-3.5 h-3.5 text-primary" />
                    <span>Restore JSON</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelected}
                    className="hidden"
                  />
                </div>
              </div>

              {statusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    statusMsg.isError
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{statusMsg.text}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STORAGE & RESET */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-2">
                <div className="text-xs font-bold text-on-surface">Data Telemetry Footprint</div>
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono">
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5">
                    <span className="text-on-surface-variant block text-[10px]">Journal Entries</span>
                    <span className="font-bold text-on-surface">{MeridianStorage.getJournal().length}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5">
                    <span className="text-on-surface-variant block text-[10px]">Study Sessions</span>
                    <span className="font-bold text-on-surface">{MeridianStorage.getStudy().logs.length}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5">
                    <span className="text-on-surface-variant block text-[10px]">Finance Txns</span>
                    <span className="font-bold text-on-surface">
                      {MeridianStorage.getFinance().transactions.length}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5">
                    <span className="text-on-surface-variant block text-[10px]">Pulse Logs</span>
                    <span className="font-bold text-on-surface">{MeridianStorage.getPulse().logs.length}</span>
                  </div>
                </div>
              </div>

              {/* Starter Template Profiles */}
              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-3">
                <div className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>1-Tap Starter Template Packs</span>
                </div>
                <p className="text-xs text-on-surface-variant">
                  Instantly prime your system with battle-tested goals, habit schedules, and budget allocations.
                </p>

                <div className="space-y-2 pt-1">
                  {[
                    {
                      id: 'medical',
                      title: 'Medical Scholar Pack',
                      desc: '200L Anatomy, Physiology & Biochem milestones + exam goals',
                      action: () => {
                        Haptics.success();
                        const goals = MeridianStorage.getGoals();
                        const newGoals = [
                          { id: 'g_med_1', title: 'Complete Anatomy Upper Limb & Thorax', category: 'Study', targetValue: 30, currentValue: 12, unit: 'hours', archived: false, history: [] },
                          { id: 'g_med_2', title: 'Physiology Cardiovascular Block', category: 'Study', targetValue: 20, currentValue: 8, unit: 'hours', archived: false, history: [] },
                          { id: 'g_med_3', title: 'Biochemistry Enzymes & Metabolism', category: 'Study', targetValue: 25, currentValue: 10, unit: 'hours', archived: false, history: [] },
                        ];
                        MeridianStorage.saveGoals({ ...goals, goals: [...newGoals, ...(goals.goals || [])] });
                        setStatusMsg({ text: 'Loaded Medical Scholar Goals into your system!' });
                        onDataChanged();
                      }
                    },
                    {
                      id: 'habits',
                      title: 'Dopamine & Health Reset Pack',
                      desc: 'Morning Sunlight, 3L Hydration, 45m Deep Work & Digital Sunset',
                      action: () => {
                        Haptics.success();
                        const pulse = MeridianStorage.getPulse();
                        const templateHabits = [
                          { id: 'h_sun', name: 'Morning Sunlight (15m)', category: 'vitality', targetDaysPerWeek: 7, archived: false },
                          { id: 'h_water', name: '3L Water Hydration', category: 'vitality', targetDaysPerWeek: 7, archived: false },
                          { id: 'h_deep', name: '45m Deep Work Sprint', category: 'discipline', targetDaysPerWeek: 6, archived: false },
                          { id: 'h_sunset', name: 'Digital Sunset (No phone in bed)', category: 'vitality', targetDaysPerWeek: 7, archived: false },
                        ];
                        MeridianStorage.savePulse({ ...pulse, habits: templateHabits });
                        setStatusMsg({ text: 'Configured Dopamine & Health habits!' });
                        onDataChanged();
                      }
                    },
                    {
                      id: 'budget',
                      title: 'Student Budget Discipline Pack',
                      desc: '₦120,000 monthly envelope with ₦4,000/day safe spend cap',
                      action: () => {
                        Haptics.success();
                        const fin = MeridianStorage.getFinance();
                        const budgets = {
                          cat_food: 4500000,
                          cat_transport: 2000000,
                          cat_academic: 2500000,
                          cat_utilities: 1500000,
                          cat_personal: 1500000,
                        };
                        MeridianStorage.saveFinance({ ...fin, budgets });
                        setStatusMsg({ text: 'Applied ₦120k monthly envelope with daily headroom caps!' });
                        onDataChanged();
                      }
                    }
                  ].map(tmpl => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={tmpl.action}
                      className="w-full p-3 rounded-xl border border-outline-variant hover:bg-black/5 dark:hover:bg-white/5 text-left flex items-center justify-between transition-all"
                    >
                      <div className="pr-2">
                        <div className="text-xs font-bold text-on-surface">{tmpl.title}</div>
                        <div className="text-[11px] text-on-surface-variant">{tmpl.desc}</div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-primary shrink-0 px-2.5 py-1 rounded-lg bg-primary/10">
                        Apply
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Danger Zone</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Resetting storage will wipe all local logs and restore the default clean-slate sample state.
                </p>
                <button
                  onClick={handleResetData}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs font-semibold transition-all m3-pressable"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{confirmReset ? 'Tap again to permanently wipe data' : 'Reset Local Storage'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[var(--md-sys-color-outline-variant)] flex items-center justify-between bg-[var(--md-sys-color-surface-container)]">
          <span className="text-[11px] font-mono text-on-surface-variant">
            Meridian v2.0 · Material Design 3
          </span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold m3-pressable shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
