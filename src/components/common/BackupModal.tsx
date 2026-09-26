import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  Database,
  Check,
  Smartphone,
  HardDrive,
  LogIn,
  LogOut,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { MeridianStorage, todayStr } from '../../services/storage';
import {
  syncToSupabase,
  fetchFromSupabase,
  testSupabaseConnection,
  getLastSyncTime,
  isAutoSyncEnabled,
  setAutoSyncEnabled,
  subscribeToSyncStatus,
} from '../../services/supabase';
import {
  connectUserGoogleDrive,
  disconnectUserGoogleDrive,
  getConnectedUser,
  uploadBackupToGoogleDrive,
  downloadBackupFromGoogleDrive,
  GoogleDriveUser,
  getCustomClientId,
  setCustomClientId,
} from '../../services/googleDrive';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

type TabType = 'gdrive' | 'supabase' | 'local' | 'android';

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose, onDataChanged }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>('gdrive');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(getLastSyncTime());
  const [autoSyncOn, setAutoSyncOn] = useState<boolean>(isAutoSyncEnabled());

  // Google Drive state
  const [gdriveUser, setGdriveUser] = useState<GoogleDriveUser | null>(null);
  const [customClientId, setCustomClientIdState] = useState<string>('');
  const [showClientIdConfig, setShowClientIdConfig] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLastSync(getLastSyncTime());
      setAutoSyncOn(isAutoSyncEnabled());
      setGdriveUser(getConnectedUser());
      setCustomClientIdState(getCustomClientId());

      // Check if installed as standalone PWA
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setIsInstalled(true);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = subscribeToSyncStatus((state, time) => {
      if (state === 'syncing') setIsSyncing(true);
      else setIsSyncing(false);
      if (time) setLastSync(time);
    });
    return unsub;
  }, []);

  // Listen for PWA install prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!isOpen) return null;

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setStatusMessage({ text: 'Meridian added to your Android device!' });
      }
      setDeferredPrompt(null);
    } else {
      setStatusMessage({
        text: 'To install on Android: Tap your browser menu (⋮) -> "Install App" or "Add to Home screen".',
      });
    }
  };

  // Google Drive Handlers
  const handleConnectDrive = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const res = await connectUserGoogleDrive(customClientId);
      if (res.success && res.user) {
        setGdriveUser(res.user);
        setStatusMessage({ text: `Connected as ${res.user.name} (${res.user.email})!` });
      } else {
        setStatusMessage({
          text: res.error || 'Could not connect to Google Drive. Check your Client ID.',
          isError: true,
        });
        if (res.error?.includes('Client ID')) {
          setShowClientIdConfig(true);
        }
      }
    } catch (e: any) {
      setStatusMessage({ text: e.message || 'Google authentication failed', isError: true });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectDrive = () => {
    disconnectUserGoogleDrive();
    setGdriveUser(null);
    setStatusMessage({ text: 'Google Drive disconnected.' });
  };

  const handleSaveCustomClientId = () => {
    setCustomClientId(customClientId);
    setStatusMessage({ text: 'OAuth Client ID saved!' });
    setShowClientIdConfig(false);
  };

  const handleBackupToGDrive = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const backupObj = JSON.parse(MeridianStorage.exportFullBackup());
      const res = await uploadBackupToGoogleDrive(backupObj.data);
      if (res.success) {
        setStatusMessage({ text: res.message });
      } else {
        setStatusMessage({ text: res.message, isError: true });
      }
    } catch (e: any) {
      setStatusMessage({ text: `Backup error: ${e.message || e}`, isError: true });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreFromGDrive = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const res = await downloadBackupFromGoogleDrive();
      if (res.success && res.data) {
        const success = MeridianStorage.importFullBackup(JSON.stringify({ data: res.data }));
        if (success) {
          setStatusMessage({ text: res.message });
          onDataChanged();
        } else {
          setStatusMessage({ text: 'Downloaded file data could not be parsed.', isError: true });
        }
      } else {
        setStatusMessage({ text: res.message, isError: true });
      }
    } catch (e: any) {
      setStatusMessage({ text: `Restore error: ${e.message || e}`, isError: true });
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleAutoSync = () => {
    const next = !autoSyncOn;
    setAutoSyncOn(next);
    setAutoSyncEnabled(next);
    setStatusMessage({
      text: next
        ? 'Automatic cloud sync enabled: every change is backed up to Supabase.'
        : 'Automatic cloud sync paused.',
    });
  };

  const handleExportJSON = () => {
    const json = MeridianStorage.exportFullBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meridian-personal-systems-backup-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatusMessage({ text: 'Backup downloaded successfully!' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const success = MeridianStorage.importFullBackup(result);
      if (success) {
        setStatusMessage({ text: 'All systems data restored successfully!' });
        onDataChanged();
      } else {
        setStatusMessage({ text: 'Failed to parse backup file.', isError: true });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePushSupabase = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const backupObj = JSON.parse(MeridianStorage.exportFullBackup());
      const res = await syncToSupabase(backupObj.data);
      if (res.success) {
        setLastSync(res.timestamp || new Date().toISOString());
        setStatusMessage({ text: res.message });
      } else {
        setStatusMessage({ text: res.message || 'Supabase sync failed', isError: true });
      }
    } catch (e: any) {
      setStatusMessage({ text: `Sync error: ${e.message || e}`, isError: true });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullSupabase = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const res = await fetchFromSupabase();
      if (res.success && res.data) {
        const success = MeridianStorage.importFullBackup(JSON.stringify({ data: res.data }));
        if (success) {
          setStatusMessage({ text: res.message || 'Restored state from Supabase server!' });
          onDataChanged();
        } else {
          setStatusMessage({ text: 'Retrieved data could not be parsed.', isError: true });
        }
      } else {
        setStatusMessage({ text: res.message || 'No data retrieved from Supabase', isError: true });
      }
    } catch (e: any) {
      setStatusMessage({ text: `Pull error: ${e.message || e}`, isError: true });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const res = await testSupabaseConnection();
      setStatusMessage({ text: res.message, isError: !res.connected });
    } catch (e: any) {
      setStatusMessage({ text: `Connection test error: ${e.message || e}`, isError: true });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReset = () => {
    MeridianStorage.resetAllData();
    onDataChanged();
    setConfirmReset(false);
    setStatusMessage({ text: 'All systems have been wiped clean for a fresh start.' });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          borderColor: 'var(--md-sys-color-outline-variant)',
          color: 'var(--md-sys-color-on-surface)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-semibold"
              style={{
                backgroundColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
              }}
            >
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display">Data Sync & Backup</h2>
              <p className="text-xs text-on-surface-variant">Local offline storage, Google Drive & Cloud backup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-on-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-outline-variant/60 bg-surface-container-low px-4 pt-2 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('gdrive')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'gdrive'
                ? 'bg-surface-container border-t-2 border-primary text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Google Drive</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'android'
                ? 'bg-surface-container border-t-2 border-primary text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android App</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'supabase'
                ? 'bg-surface-container border-t-2 border-primary text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>Supabase Cloud</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('local')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'local'
                ? 'bg-surface-container border-t-2 border-primary text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Local JSON</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {statusMessage && (
            <div
              className="p-3 text-xs rounded-2xl border font-medium flex items-center gap-2"
              style={{
                backgroundColor: statusMessage.isError
                  ? 'var(--md-sys-color-error-container)'
                  : 'var(--md-sys-color-primary-container)',
                color: statusMessage.isError
                  ? 'var(--md-sys-color-on-error-container)'
                  : 'var(--md-sys-color-on-primary-container)',
                borderColor: statusMessage.isError ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)',
              }}
            >
              {statusMessage.isError ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: GOOGLE DRIVE BACKUP (USER SPECIFIC) */}
          {activeTab === 'gdrive' && (
            <div className="space-y-4">
              <div
                className="p-4 rounded-2xl border space-y-3"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container-high)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold font-display uppercase tracking-wider text-on-surface">
                        User Google Drive Storage
                      </h3>
                      <p className="text-[11px] text-on-surface-variant">
                        Every user connects their own personal Google Drive
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowClientIdConfig(!showClientIdConfig)}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant text-xs"
                    title="Client ID Configuration"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Account Status Card */}
                {gdriveUser ? (
                  <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/60 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {gdriveUser.picture ? (
                        <img
                          src={gdriveUser.picture}
                          alt={gdriveUser.name}
                          className="w-8 h-8 rounded-full border border-primary/40"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">
                          {gdriveUser.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                          <span>{gdriveUser.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full font-mono">
                            Connected
                          </span>
                        </div>
                        <div className="text-[11px] text-on-surface-variant">{gdriveUser.email}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDisconnectDrive}
                      className="px-2.5 py-1 text-xs rounded-lg text-red-400 hover:bg-red-500/10 flex items-center gap-1"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Disconnect</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/60 text-center space-y-2">
                    <p className="text-xs text-on-surface-variant">
                      Connect your personal Google account to backup your journal, study logs, streaks, and finance
                      records to your private Drive.
                    </p>
                    <button
                      type="button"
                      onClick={handleConnectDrive}
                      disabled={isSyncing}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
                    >
                      {isSyncing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <LogIn className="w-4 h-4" />
                      )}
                      <span>Connect My Google Drive</span>
                    </button>
                  </div>
                )}

                {/* Drive Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleBackupToGDrive}
                    disabled={isSyncing || !gdriveUser}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 transition-all active:scale-95 disabled:opacity-40"
                  >
                    {isSyncing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CloudUpload className="w-3.5 h-3.5" />
                    )}
                    <span>Backup to My Drive</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRestoreFromGDrive}
                    disabled={isSyncing || !gdriveUser}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/30 transition-all active:scale-95 disabled:opacity-40"
                  >
                    {isSyncing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CloudDownload className="w-3.5 h-3.5" />
                    )}
                    <span>Retrieve from My Drive</span>
                  </button>
                </div>

                {/* Client ID Configuration Field */}
                {showClientIdConfig && (
                  <div className="pt-2 border-t border-outline-variant/60 space-y-2">
                    <label className="text-[11px] font-semibold text-on-surface">
                      Google OAuth Client ID (Optional custom)
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                        value={customClientId}
                        onChange={(e) => setCustomClientIdState(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-surface border border-outline-variant font-mono text-on-surface"
                      />
                      <button
                        type="button"
                        onClick={handleSaveCustomClientId}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-on-primary"
                      >
                        Save
                      </button>
                    </div>
                    <p className="text-[10px] text-on-surface-variant">
                      Uses Google Identity Services. Scopes restricted to private app-created backup files (<code>drive.file</code>).
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ANDROID APP & OFFLINE PWA */}
          {activeTab === 'android' && (
            <div className="space-y-3">
              <div
                className="p-4 rounded-2xl border space-y-3"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container-high)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-display uppercase tracking-wider text-on-surface">
                      Android Native App & Play Store
                    </h3>
                    <p className="text-[11px] text-on-surface-variant">
                      Optimized for Android 14+ with gesture navigation, haptics & offline storage
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/60 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500">
                    <Check className="w-4 h-4" />
                    <span>{isInstalled ? 'App Installed on this Device' : 'Ready for Instant Android Installation & APK Packaging'}</span>
                  </div>
                  <ul className="text-[11px] text-on-surface-variant space-y-1.5 list-disc pl-4">
                    <li><strong>Offline-First:</strong> Runs 100% locally with zero latency; all data stored securely on your device.</li>
                    <li><strong>Personal Google Drive:</strong> Backup and retrieve your private database at any time.</li>
                    <li><strong>Android Gesture & Back Button:</strong> Hardware back swipe closes modals and returns cleanly to Overview.</li>
                    <li><strong>Material You & Haptics:</strong> Dynamic theme-color status bar and subtle tactile vibration feedback.</li>
                  </ul>
                </div>

                {/* Packaging for Google Play Store (Option 1) */}
                <div className="p-3 rounded-xl bg-surface border border-outline-variant/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface">Google Play Store / APK Generation</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500 dark:text-blue-400 font-semibold">
                      Option 1: PWABuilder
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    This app is configured as a certified Trusted Web Activity (TWA). You can paste your deployment URL into <strong>pwabuilder.com</strong> to download a signed <strong>.apk</strong> (for sideloading) or <strong>.aab</strong> (for Google Play Console submission).
                  </p>
                </div>

                {/* Direct Image Download Assets for PWABuilder */}
                <div className="p-3 rounded-xl bg-surface-container-high border border-outline-variant/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface">Android Launcher Icons & Screenshots</span>
                    <span className="text-[10px] text-emerald-500 font-medium">Click to download</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    {[
                      { name: '48x48', file: 'launchericon-48x48.png' },
                      { name: '72x72', file: 'launchericon-72x72.png' },
                      { name: '96x96', file: 'launchericon-96x96.png' },
                      { name: '144x144', file: 'launchericon-144x144.png' },
                      { name: '192x192', file: 'launchericon-192x192.png' },
                      { name: '512x512', file: 'launchericon-512x512.png' },
                    ].map((icon) => (
                      <a
                        key={icon.file}
                        href={`/${icon.file}`}
                        download={icon.file}
                        className="p-1.5 rounded-lg bg-surface border border-outline-variant/50 hover:border-emerald-500 flex items-center justify-between transition-colors"
                      >
                        <span className="font-mono text-on-surface">{icon.name}</span>
                        <Download className="w-3 h-3 text-emerald-500" />
                      </a>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-1 border-t border-outline-variant/40">
                    <a
                      href="/screenshot-mobile.png"
                      download="screenshot-mobile.png"
                      className="p-1.5 rounded-lg bg-surface border border-outline-variant/50 hover:border-emerald-500 flex items-center justify-between transition-colors"
                    >
                      <span className="font-mono text-on-surface truncate pr-1">mobile-preview.png</span>
                      <Download className="w-3 h-3 text-emerald-500 shrink-0" />
                    </a>
                    <a
                      href="/screenshot-desktop.png"
                      download="screenshot-desktop.png"
                      className="p-1.5 rounded-lg bg-surface border border-outline-variant/50 hover:border-emerald-500 flex items-center justify-between transition-colors"
                    >
                      <span className="font-mono text-on-surface truncate pr-1">desktop-preview.png</span>
                      <Download className="w-3 h-3 text-emerald-500 shrink-0" />
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleInstallPwa}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{isInstalled ? 'Installed as Android App' : 'Install on Android Device'}</span>
                </button>

                <div className="p-2.5 rounded-lg bg-surface border border-outline-variant/40 text-[11px] text-on-surface-variant">
                  <strong>Direct install in Chrome / Samsung Internet:</strong> Tap the 3 dots (⋮) in the browser toolbar and tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUPABASE CLOUD BACKUP */}
          {activeTab === 'supabase' && (
            <div
              className="p-4 rounded-2xl border space-y-3"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                borderColor: 'var(--md-sys-color-outline-variant)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold font-display uppercase tracking-wider">Supabase Server Sync</span>
                </div>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isSyncing}
                  className="text-[11px] font-mono text-primary hover:underline"
                >
                  Test Connection
                </button>
              </div>

              <p className="text-xs text-on-surface-variant">
                {lastSync
                  ? `Last synced: ${new Date(lastSync).toLocaleString()}`
                  : 'No sync recorded yet. Push local data to Supabase.'}
              </p>

              {/* Auto Sync Toggle Row */}
              <div className="flex items-center justify-between pt-1 pb-1 border-t border-outline-variant/40">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-on-surface">Auto-Sync on Edit</span>
                  <span className="text-[11px] text-on-surface-variant">Saves modifications to cloud server</span>
                </div>
                <button
                  type="button"
                  onClick={toggleAutoSync}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                    autoSyncOn
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-surface-variant text-on-surface-variant border border-outline-variant'
                  }`}
                >
                  {autoSyncOn ? <Check className="w-3 h-3 text-emerald-500" /> : null}
                  <span>{autoSyncOn ? 'Enabled' : 'Disabled'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePushSupabase}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                  <span>Push to Cloud</span>
                </button>

                <button
                  type="button"
                  onClick={handlePullSupabase}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CloudDownload className="w-3.5 h-3.5" />}
                  <span>Pull from Cloud</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: LOCAL JSON EXPORT & RESTORE */}
          {activeTab === 'local' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleExportJSON}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group hover:scale-[1.01]"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container-high)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--md-sys-color-primary-container)',
                      color: 'var(--md-sys-color-on-primary-container)',
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs md:text-sm font-bold">Export Full JSON Backup</div>
                    <p className="text-[11px] text-on-surface-variant">Includes all modules, records & settings</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group hover:scale-[1.01]"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container-high)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-500/20 text-blue-400">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs md:text-sm font-bold">Restore Backup (.json)</div>
                    <p className="text-[11px] text-on-surface-variant">Import previously saved Meridian database</p>
                  </div>
                </div>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json,application/json"
                className="hidden"
              />
            </div>
          )}

          {/* Danger zone / Reset */}
          <div className="pt-3 border-t border-outline-variant">
            {confirmReset ? (
              <div className="p-3.5 rounded-2xl border border-red-500/40 bg-red-500/10 space-y-2.5">
                <p className="text-xs font-semibold text-red-400">
                  Are you absolutely sure? This will wipe all recorded data and give you a complete clean slate.
                </p>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-3 py-1.5 text-xs rounded-full border border-outline-variant"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 text-xs font-bold rounded-full bg-red-600 text-white"
                  >
                    Yes, Clean Slate
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors justify-center"
              >
                <Trash2 className="w-4 h-4" />
                <span>Wipe & Reset to Clean Slate</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
