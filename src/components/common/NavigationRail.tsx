import React, { useState } from 'react';
import {
  LayoutDashboard,
  Clock,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Wallet,
  Activity,
  Target,
  Sparkles,
  MoreHorizontal,
  Settings2,
  X,
  ChevronRight,
} from 'lucide-react';
import { ModuleRoute } from '../../types';
import { Haptics } from '../../services/haptics';

interface NavigationRailProps {
  currentRoute: ModuleRoute;
  onNavigate: (route: ModuleRoute) => void;
  onOpenSettings?: () => void;
  badges?: Record<string, string | number>;
}

const PRIMARY_NAV_ITEMS: {
  route: ModuleRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { route: 'overview', label: 'Today', icon: LayoutDashboard },
  { route: 'study', label: 'Study', icon: GraduationCap },
  { route: 'checkin', label: 'Vitality', icon: Activity },
  { route: 'finance', label: 'Finance', icon: Wallet },
  { route: 'journal', label: 'Logbook', icon: BookOpen },
];

const MORE_NAV_ITEMS: {
  route: ModuleRoute;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}[] = [
  {
    route: 'goals',
    label: 'Goals & Milestones',
    subtitle: 'Active targets & step progress',
    icon: Target,
    accentColor: '#E8B368',
  },
  {
    route: 'timeline',
    label: 'Timeline Stream',
    subtitle: 'Cross-system audit trail',
    icon: Clock,
    accentColor: '#C77DFF',
  },
];

export const NavigationRail: React.FC<NavigationRailProps> = ({
  currentRoute,
  onNavigate,
  onOpenSettings,
  badges = {},
}) => {
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  const handleNavClick = (route: ModuleRoute) => {
    Haptics.selection();
    onNavigate(route);
    setIsMoreSheetOpen(false);
  };

  const isMoreRouteActive = MORE_NAV_ITEMS.some(item => item.route === currentRoute);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          DESKTOP MATERIAL 3 NAVIGATION DRAWER (w-72 / 288dp)
          Reference: https://m3.material.io/components/navigation-drawer/specs
          ═══════════════════════════════════════════════════════════════ */}
      <aside
        className="hidden md:flex flex-col w-72 h-screen sticky top-0 shrink-0 z-40 select-none transition-colors"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
        }}
      >
        {/* Brand Header */}
        <div className="px-6 py-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
              style={{
                backgroundColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
              }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold font-display tracking-tight text-on-surface">
                Meridian
              </div>
              <div className="text-[11px] font-mono tracking-wider uppercase text-on-surface-variant">
                Systems OS
              </div>
            </div>
          </div>
        </div>

        {/* M3 Standard Navigation Drawer Items (56dp height, rounded-full) */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-4 py-2 text-[11px] font-mono uppercase tracking-wider text-on-surface-variant font-bold">
            Core Modules
          </div>

          {[...PRIMARY_NAV_ITEMS, ...MORE_NAV_ITEMS].map(item => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;
            const badgeVal = badges?.[item.route];

            return (
              <button
                key={item.route}
                type="button"
                onClick={() => handleNavClick(item.route)}
                className={`w-full m3-drawer-item m3-pressable ${
                  isActive
                    ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <div
                  className={`w-6 h-6 flex items-center justify-center transition-transform ${
                    isActive ? 'scale-105' : ''
                  }`}
                  style={{
                    color: isActive ? 'var(--md-sys-color-on-secondary-container)' : 'inherit',
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <span className="truncate flex-1 text-left text-sm">{item.label}</span>

                {badgeVal !== undefined && badgeVal !== '' && (
                  <span
                    className="px-2.5 py-0.5 text-[11px] font-mono rounded-full font-bold"
                    style={{
                      backgroundColor: isActive
                        ? 'var(--md-sys-color-primary)'
                        : 'var(--md-sys-color-surface-container-high)',
                      color: isActive
                        ? 'var(--md-sys-color-on-primary)'
                        : 'var(--md-sys-color-on-surface-variant)',
                    }}
                  >
                    {badgeVal}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Desktop Footer with Settings */}
        <div className="p-4 border-t border-[var(--md-sys-color-outline-variant)] space-y-2">
          {onOpenSettings && (
            <button
              onClick={() => {
                Haptics.light();
                onOpenSettings();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-black/5 dark:hover:bg-white/5 transition-all m3-pressable"
            >
              <Settings2 className="w-4 h-4 text-primary" />
              <span>Settings & Preferences</span>
            </button>
          )}
          <div className="flex items-center justify-between text-[11px] font-mono text-on-surface-variant/80 px-2">
            <span>Offline-First</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Online
            </span>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE MATERIAL 3 EXPRESSIVE FLOATING DOCK (Height 68dp, radius 28dp)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 max-w-md mx-auto select-none transition-all">
        <div
          className="h-[68px] px-2 rounded-[28px] border flex items-center justify-around shadow-2xl backdrop-blur-xl"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface-container) 92%, transparent)',
            borderColor: 'var(--md-sys-color-outline-variant)',
            boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.35)',
          }}
        >
          {PRIMARY_NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isSelected =
              currentRoute === item.route ||
              (item.route === 'checkin' && currentRoute === 'recovery');
            const badgeVal =
              item.route === 'journal'
                ? badges.journal
                : item.route === 'checkin'
                ? badges.recovery
                : undefined;

            return (
              <button
                key={item.route}
                type="button"
                onClick={() => handleNavClick(item.route)}
                className="flex flex-col items-center justify-center gap-0.5 py-1 flex-1 m3-pressable relative group"
              >
                {/* Active Indicator Pill */}
                <div
                  className={`w-12 h-7 rounded-full flex items-center justify-center transition-all duration-200 relative ${
                    isSelected
                      ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] scale-105 shadow-xs'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-on-surface'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.2]" />

                  {/* Badge */}
                  {badgeVal !== undefined && badgeVal !== '' && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-4 text-[9px] font-mono font-bold rounded-full bg-primary text-on-primary border border-surface leading-tight text-center">
                      {badgeVal}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] tracking-tight leading-tight transition-colors ${
                    isSelected
                      ? 'font-bold text-on-surface'
                      : 'font-medium text-on-surface-variant'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE "MORE" MATERIAL 3 BOTTOM SHEET
          ═══════════════════════════════════════════════════════════════ */}
      {isMoreSheetOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm m3-fade-enter"
          onClick={e => {
            if (e.target === e.currentTarget) setIsMoreSheetOpen(false);
          }}
        >
          <div
            className="w-full rounded-t-3xl border-t border-[var(--md-sys-color-outline-variant)] shadow-2xl p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] space-y-4"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              color: 'var(--md-sys-color-on-surface)',
            }}
          >
            {/* Sheet Handle */}
            <div className="w-10 h-1 rounded-full bg-[var(--md-sys-color-outline-variant)] mx-auto" />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-display text-on-surface">More Systems</h3>
                <p className="text-xs text-on-surface-variant">Telemetry, objectives & system preferences</p>
              </div>
              <button
                onClick={() => setIsMoreSheetOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-on-surface-variant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {MORE_NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const isActive = currentRoute === item.route;

                return (
                  <button
                    key={item.route}
                    type="button"
                    onClick={() => handleNavClick(item.route)}
                    className={`w-full flex items-center gap-3.5 p-3 rounded-2xl border text-left transition-all m3-pressable ${
                      isActive
                        ? 'bg-[var(--md-sys-color-secondary-container)] border-[var(--md-sys-color-primary)]'
                        : 'bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: item.accentColor }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-on-surface">{item.label}</div>
                      <div className="text-xs text-on-surface-variant truncate">{item.subtitle}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-on-surface-variant shrink-0" />
                  </button>
                );
              })}

              {/* Settings Shortcut inside More */}
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreSheetOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-left m3-pressable"
                >
                  <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary)] flex items-center justify-center text-[var(--md-sys-color-on-primary)] shrink-0 shadow-xs">
                    <Settings2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-on-surface">Settings & Preferences</div>
                    <div className="text-xs text-on-surface-variant">Theme, weights & cloud backup</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-on-surface-variant shrink-0" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
