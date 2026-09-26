import React from 'react';
import { X, Sun, Moon, Monitor, Check } from 'lucide-react';
import { MaterialTheme, ThemeMode } from '../../types';
import { THEME_PALETTES } from '../../theme/materialYou';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPalette: MaterialTheme;
  currentMode: ThemeMode;
  onSelectTheme: (palette: MaterialTheme, mode: ThemeMode) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentPalette,
  currentMode,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-in fade-in duration-150"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          borderColor: 'var(--md-sys-color-outline-variant)',
          color: 'var(--md-sys-color-on-surface)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <div>
            <h2 className="text-base font-bold font-display">Material You Themes</h2>
            <p className="text-xs text-on-surface-variant">Dynamic tonal color schemes & adaptive surface lighting</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-on-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Content */}
        <div className="p-6 space-y-5">
          {/* Light / Dark Mode Toggle */}
          <div>
            <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-on-surface-variant mb-2.5">
              Surface Appearance
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
                    onClick={() => onSelectTheme(currentPalette, m.id)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-primary-container text-on-primary-container border-primary shadow-sm'
                        : 'border-outline-variant text-on-surface hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Palettes Grid */}
          <div>
            <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-on-surface-variant mb-2.5">
              Material 3 Tonal Seed Palette
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {(Object.keys(THEME_PALETTES) as MaterialTheme[]).map(key => {
                const pal = THEME_PALETTES[key];
                const isSelected = currentPalette === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onSelectTheme(key, currentMode)}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/30 shadow-sm'
                        : 'border-outline-variant hover:border-outline'
                    }`}
                    style={{
                      backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-sm shadow-inner"
                        style={{ backgroundColor: pal.seed, color: '#fff' }}
                      >
                        {pal.icon}
                      </div>
                      <span className="text-xs font-semibold truncate">{pal.name}</span>
                    </div>
                    {isSelected && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
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

        {/* Footer */}
        <div className="flex justify-end px-6 py-3.5 border-t border-outline-variant bg-surface-container-low">
          <button
            onClick={onClose}
            type="button"
            className="px-5 py-1.5 text-xs font-bold rounded-full shadow transition-all"
            style={{
              backgroundColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
