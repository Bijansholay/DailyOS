import React from 'react';
import { 
  Sun, Moon, Bell, Shield, Download, Check, 
  Settings, User, Sparkles, Sliders 
} from 'lucide-react';
import { PrimaryButton, SecondaryButton } from './Button';

export default function SettingsView({ 
  theme, 
  onToggleTheme, 
  notificationsEnabled, 
  onToggleNotifications, 
  currentUser,
  tasks,
  events
}) {

  const exportDataJSON = () => {
    const data = {
      user: currentUser,
      exportDate: new Date().toISOString(),
      tasks,
      events
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dailyos-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div 
      className="max-w-4xl mx-auto space-y-8 py-2"
      title="Component: <SettingsView /> — User preferences, theme switcher, and notification controls (src/components/SettingsView.jsx)"
    >
      {/* HEADER BAR */}
      <div className="border-b border-[var(--border-color)] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-widest text-[var(--accent-primary)] uppercase">System Preferences</span>
          <h1 className="font-journal text-3xl md:text-4xl text-[var(--text-main)] font-normal tracking-tight mt-1">
            Settings & Appearance
          </h1>
        </div>
      </div>

      {/* SECTION 1: APPEARANCE & THEME SWITCHER */}
      <div className="journal-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
          <Sliders className="w-5 h-5 text-[var(--accent-primary)]" />
          <div>
            <h3 className="font-journal text-xl text-[var(--text-main)]">Theme & Appearance</h3>
            <p className="text-xs text-[var(--text-muted)]">Customize your visual workspace and color palette</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* DARK THEME OPTION */}
          <button
            onClick={() => onToggleTheme('dark')}
            className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between space-y-3 ${
              theme === 'dark'
                ? 'bg-[var(--accent-bg-subtle)] border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/30 text-[var(--text-main)]'
                : 'bg-[var(--bg-base)] border-[var(--border-color)] hover:border-[var(--text-muted)] text-[var(--text-muted)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-[var(--accent-primary)]" />
                <span className="font-semibold text-sm text-[var(--text-main)]">Dark Dashboard (Nixtio)</span>
              </div>
              {theme === 'dark' && <Check className="w-4 h-4 text-[var(--accent-primary)]" />}
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Dark violet dashboard frame with crisp typography, purple glowing accents, and high-visibility stats.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="w-4 h-4 rounded-full bg-[#121114] border border-[#2D273C]" title="Dark Base" />
              <span className="w-4 h-4 rounded-full bg-[#1C1924] border border-[#2D273C]" title="Violet Slate Card" />
              <span className="w-4 h-4 rounded-full bg-[#9333EA]" title="Primary Accent" />
              <span className="w-4 h-4 rounded-full bg-[#FACC15]" title="Secondary Accent" />
            </div>
          </button>

          {/* LIGHT THEME OPTION */}
          <button
            onClick={() => onToggleTheme('light')}
            className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between space-y-3 ${
              theme === 'light'
                ? 'bg-[var(--accent-bg-subtle)] border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/30 text-[var(--text-main)]'
                : 'bg-[var(--bg-base)] border-[var(--border-color)] hover:border-[var(--text-muted)] text-[var(--text-muted)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-[var(--accent-primary)]" />
                <span className="font-semibold text-sm text-[var(--text-main)]">Light Workspace (Zentra)</span>
              </div>
              {theme === 'light' && <Check className="w-4 h-4 text-[var(--accent-primary)]" />}
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Full-bleed clean white layout with high contrast typography and solid dark pill CTAs.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="w-4 h-4 rounded-full bg-[#FAFAFA] border border-slate-300" title="Light Base" />
              <span className="w-4 h-4 rounded-full bg-[#FFFFFF] border border-slate-300" title="White Card" />
              <span className="w-4 h-4 rounded-full bg-[#09090B]" title="Solid Pill Button" />
              <span className="w-4 h-4 rounded-full bg-[#2563EB]" title="Blue Accent" />
            </div>
          </button>
        </div>
      </div>

      {/* SECTION 2: NOTIFICATIONS & ALERTS */}
      <div className="journal-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
          <Bell className="w-5 h-5 text-[var(--accent-primary)]" />
          <div>
            <h3 className="font-journal text-xl text-[var(--text-main)]">Notifications & Reminders</h3>
            <p className="text-xs text-[var(--text-muted)]">Manage browser alerts and scheduled task notifications</p>
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <h4 className="font-medium text-sm text-[var(--text-main)]">Desktop Task Alerts</h4>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Receive browser popups when tasks reach their scheduled start time</p>
          </div>
          {notificationsEnabled ? (
            <PrimaryButton onClick={onToggleNotifications}>
              Enabled 🔔
            </PrimaryButton>
          ) : (
            <SecondaryButton onClick={onToggleNotifications}>
              Enable Notifications
            </SecondaryButton>
          )}
        </div>
      </div>

      {/* SECTION 3: ACCOUNT & DATA BACKUP */}
      <div className="journal-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
          <User className="w-5 h-5 text-[var(--accent-primary)]" />
          <div>
            <h3 className="font-journal text-xl text-[var(--text-main)]">Account & Data Export</h3>
            <p className="text-xs text-[var(--text-muted)]">Your account settings and local data backup</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-[var(--text-muted)]">Signed in as:</span>
            <strong className="text-[var(--text-main)] font-mono">{currentUser?.email || 'Guest User'}</strong>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-[var(--border-color)]">
            <div>
              <h4 className="font-medium text-sm text-[var(--text-main)]">Export Journal Backup</h4>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Download your full history, tasks, and telemetry data in JSON format</p>
            </div>
            <SecondaryButton onClick={exportDataJSON} icon={Download}>
              Export JSON
            </SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

