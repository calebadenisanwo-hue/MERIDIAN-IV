import React, { useState } from 'react';
import { Search, X, LayoutDashboard, Clock, BookOpen, GraduationCap, ShieldCheck, Wallet, Activity, Target, Settings, Plus } from 'lucide-react';
import { ModuleRoute } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: ModuleRoute) => void;
  onOpenQuickAdd: () => void;
  onOpenSettings: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenQuickAdd,
  onOpenSettings,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const actions = [
    { label: 'Overview', desc: 'Composite index & dashboard', icon: LayoutDashboard, action: () => onNavigate('overview') },
    { label: 'Timeline Stream', desc: 'Audit trail of all systems', icon: Clock, action: () => onNavigate('timeline') },
    { label: 'Journal Logbook', desc: 'Reflections and tagged notes', icon: BookOpen, action: () => onNavigate('journal') },
    { label: 'Study Ledger', desc: 'Curriculum topics & session timers', icon: GraduationCap, action: () => onNavigate('study') },
    { label: 'Unbound Recovery', desc: 'Sobriety streak & urge logs', icon: ShieldCheck, action: () => onNavigate('recovery') },
    { label: 'Finance Cashflow', desc: 'Accounts, expenses & budgets', icon: Wallet, action: () => onNavigate('finance') },
    { label: 'Pulse Check-in', desc: 'Sleep, mood & habits', icon: Activity, action: () => onNavigate('checkin') },
    { label: 'Goals & Targets', desc: 'Milestone tracking & progress', icon: Target, action: () => onNavigate('goals') },
    { label: 'Quick Add Entry', desc: 'Log reflection, study or urge', icon: Plus, action: () => { onClose(); onOpenQuickAdd(); } },
    { label: 'Settings & Theme', desc: 'Configure Monet palette & sync', icon: Settings, action: () => { onClose(); onOpenSettings(); } },
  ].filter(a => a.label.toLowerCase().includes(query.toLowerCase()) || a.desc.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-xs" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-2xl p-4 shadow-2xl m3-surface-card border border-[var(--md-sys-color-outline-variant)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-3 py-2 border-b border-[var(--md-sys-color-outline-variant)]">
          <Search className="w-5 h-5 text-outline" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or jump to system..."
            className="flex-1 bg-transparent border-none outline-hidden text-base text-[var(--md-sys-color-on-surface)]"
            autoFocus
          />
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-container-high text-outline">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto mt-2 space-y-1">
          {actions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  item.action();
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-surface-container-highest text-primary">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{item.label}</div>
                  <div className="text-xs text-outline">{item.desc}</div>
                </div>
              </button>
            );
          })}
          {actions.length === 0 && (
            <div className="p-6 text-center text-sm text-outline">No commands found matching "{query}"</div>
          )}
        </div>
      </div>
    </div>
  );
};
