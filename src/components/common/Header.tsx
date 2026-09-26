import React from 'react';
import { Search, Settings2, Sparkles } from 'lucide-react';
import { ModuleRoute } from '../../types';
import { Haptics } from '../../services/haptics';

interface HeaderProps {
  currentRoute: ModuleRoute;
  onOpenCommandPalette: () => void;
  onOpenSettings: () => void;
}

const ROUTE_INFO: Record<ModuleRoute, { title: string; subtitle: string; badge: string }> = {
  overview: {
    title: 'Overview',
    subtitle: 'Unified Personal Operating System',
    badge: 'System Core',
  },
  timeline: {
    title: 'Timeline',
    subtitle: 'Unified chronological activity stream',
    badge: 'Audit Log',
  },
  journal: {
    title: 'Logbook',
    subtitle: 'High-signal reflections & mental models',
    badge: 'Mind',
  },
  study: {
    title: 'Study Ledger',
    subtitle: '200L Medical syllabus & active recall',
    badge: 'Cognition',
  },
  recovery: {
    title: 'Vitality Fortress',
    subtitle: 'Impulse resistance & clean sobriety streak',
    badge: 'Resilience',
  },
  finance: {
    title: 'Finance Ledger',
    subtitle: 'Daily headroom, runway & capital assets',
    badge: 'Capital',
  },
  checkin: {
    title: 'Vitality Hub',
    subtitle: 'Daily habits, sleep recovery & bio-telemetry',
    badge: 'Vitality',
  },
  goals: {
    title: 'Milestones & Goals',
    subtitle: 'Strategic objectives & progress steps',
    badge: 'Targets',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  onOpenCommandPalette,
  onOpenSettings,
}) => {
  const info = ROUTE_INFO[currentRoute] || ROUTE_INFO.overview;

  const handleSearchClick = () => {
    Haptics.selection();
    onOpenCommandPalette();
  };

  const handleSettingsClick = () => {
    Haptics.light();
    onOpenSettings();
  };

  return (
    <header
      className="sticky top-0 z-30 px-4 md:px-8 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 backdrop-blur-xl border-b border-[var(--md-sys-color-outline-variant)] select-none transition-colors"
      style={{
        backgroundColor: 'var(--md-sys-color-surface-dim, rgba(18, 20, 15, 0.85))',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: View title & badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="truncate">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight text-on-surface truncate">
                {info.title}
              </h1>
              <span
                className="px-2.5 py-0.5 text-[11px] font-mono font-semibold rounded-full shrink-0"
                style={{
                  backgroundColor: 'var(--md-sys-color-secondary-container)',
                  color: 'var(--md-sys-color-on-secondary-container)',
                }}
              >
                {info.badge}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant truncate hidden sm:block mt-0.5">
              {info.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Only 2 clean Material 3 controls (Search & Settings) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* M3 Search Pill */}
          <button
            onClick={handleSearchClick}
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full border border-[var(--md-sys-color-outline-variant)] text-xs text-on-surface-variant hover:text-on-surface hover:bg-black/5 dark:hover:bg-white/5 transition-all m3-pressable shadow-xs"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
            }}
            title="Search & Commands (⌘K)"
          >
            <Search className="w-4 h-4 opacity-70" />
            <span className="hidden md:inline font-medium">Search...</span>
            <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-mono rounded bg-black/10 dark:bg-white/10 text-on-surface-variant font-bold">
              ⌘K
            </kbd>
          </button>

          {/* Settings Menu Button */}
          <button
            onClick={handleSettingsClick}
            type="button"
            className="p-2 sm:px-3 sm:py-2 rounded-full border border-[var(--md-sys-color-outline-variant)] flex items-center gap-1.5 text-xs font-medium text-on-surface hover:bg-black/5 dark:hover:bg-white/5 transition-all m3-pressable shadow-xs"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
            }}
            title="Open Settings & Preferences"
            aria-label="Settings"
          >
            <Settings2 className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline font-semibold">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
