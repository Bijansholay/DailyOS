import React from 'react';
import { 
  Sun, Moon, Bell, Shield, Download, Check, 
  Settings, User, Sparkles, Sliders 
} from 'lucide-react';

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
      <div className="border-b border-[#33302B] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-widest text-[#D4A24C] uppercase">System Preferences</span>
          <h1 className="font-journal text-3xl md:text-4xl text-[#E8E6E3] font-normal tracking-tight mt-1">
            Settings & Appearance
          </h1>
        </div>
      </div>

      {/* SECTION 1: APPEARANCE & THEME SWITCHER */}
      <div className="journal-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-[#33302B] pb-3">
          <Sliders className="w-5 h-5 text-[#D4A24C]" />
          <div>
            <h3 className="font-journal text-xl text-[#E8E6E3]">Theme & Appearance</h3>
            <p className="text-xs text-[#9E9A92]">Customize your visual workspace and color palette</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* DARK THEME OPTION */}
          <button
            onClick={() => onToggleTheme('dark')}
            className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between space-y-3 ${
              theme === 'dark'
                ? 'bg-[#141220] border-[#A855F7] shadow-lg shadow-[#A855F7]/10 ring-2 ring-[#A855F7]/20 text-[#F5F3FF]'
                : 'bg-[#08070D] border-[#27213A] hover:border-[#393054]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-[#A855F7]" />
                <span className={`font-semibold text-sm ${theme === 'dark' ? 'text-[#F5F3FF]' : 'text-[#948F9E]'}`}>Nixtio Midnight Violet</span>
              </div>
              {theme === 'dark' && <Check className="w-4 h-4 text-[#A855F7]" />}
            </div>
            <p className={`text-xs ${theme === 'dark' ? 'text-[#DDD6FE]' : 'text-[#948F9E]'}`}>
              OLED pitch black (<code className="text-[#A855F7]">#08070D</code>) with Midnight Violet cards, Electric Purple & Ochre Yellow accents.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="w-4 h-4 rounded-full bg-[#08070D] border border-[#27213A]" title="OLED Canvas (#08070D)" />
              <span className="w-4 h-4 rounded-full bg-[#141220] border border-[#27213A]" title="Midnight Slate (#141220)" />
              <span className="w-4 h-4 rounded-full bg-[#A855F7]" title="Neon Violet Accent (#A855F7)" />
              <span className="w-4 h-4 rounded-full bg-[#FACC15]" title="Ochre Yellow Accent (#FACC15)" />
            </div>
          </button>

          {/* LIGHT THEME OPTION */}
          <button
            onClick={() => onToggleTheme('light')}
            className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between space-y-3 ${
              theme === 'light'
                ? 'bg-[#FFFFFF] text-slate-900 border-[#0284C7] shadow-lg shadow-[#0284C7]/10 ring-2 ring-[#0284C7]/20'
                : 'bg-[#1C1B19] border-[#33302B] hover:border-[#66625B]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#0284C7]" />
                <span className={`font-semibold text-sm ${theme === 'light' ? 'text-slate-900' : 'text-[#E8E6E3]'}`}>Zentra Floating Glass</span>
              </div>
              {theme === 'light' && <Check className="w-4 h-4 text-[#0284C7]" />}
            </div>
            <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-[#9E9A92]'}`}>
              Silver canvas (<code className="text-[#0284C7]">#EBF0F5</code>) with crisp floating white cards, charcoal pills (<code className="text-slate-900">#18181B</code>), & Sky Blue accents.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="w-4 h-4 rounded-full bg-[#EBF0F5] border border-slate-300" title="Silver Canvas (#EBF0F5)" />
              <span className="w-4 h-4 rounded-full bg-[#FFFFFF] border border-slate-300" title="Floating Card (#FFFFFF)" />
              <span className="w-4 h-4 rounded-full bg-[#18181B]" title="Active Charcoal Pill (#18181B)" />
              <span className="w-4 h-4 rounded-full bg-[#0284C7]" title="Sky Blue Accent (#0284C7)" />
            </div>
          </button>
        </div>
      </div>

      {/* SECTION 2: NOTIFICATIONS & ALERTS */}
      <div className="journal-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-[#33302B] pb-3">
          <Bell className="w-5 h-5 text-[#D4A24C]" />
          <div>
            <h3 className="font-journal text-xl text-[#E8E6E3]">Notifications & Reminders</h3>
            <p className="text-xs text-[#9E9A92]">Manage browser alerts and scheduled task notifications</p>
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <h4 className="font-medium text-sm text-[#E8E6E3]">Desktop Task Alerts</h4>
            <p className="text-xs text-[#9E9A92] mt-0.5">Receive browser popups when tasks reach their scheduled start time</p>
          </div>
          <button
            onClick={onToggleNotifications}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              notificationsEnabled
                ? 'bg-[#D4A24C] text-[#1C1B19]'
                : 'bg-[#24221F] border border-[#33302B] text-[#9E9A92] hover:text-[#E8E6E3]'
            }`}
          >
            {notificationsEnabled ? 'Enabled 🔔' : 'Enable Notifications'}
          </button>
        </div>
      </div>

      {/* SECTION 3: ACCOUNT & DATA BACKUP */}
      <div className="journal-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-[#33302B] pb-3">
          <User className="w-5 h-5 text-[#D4A24C]" />
          <div>
            <h3 className="font-journal text-xl text-[#E8E6E3]">Account & Data Export</h3>
            <p className="text-xs text-[#9E9A92]">Your account settings and local data backup</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-[#9E9A92]">Signed in as:</span>
            <strong className="text-[#E8E6E3] font-mono">{currentUser?.email || 'Guest User'}</strong>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-[#33302B]">
            <div>
              <h4 className="font-medium text-sm text-[#E8E6E3]">Export Journal Backup</h4>
              <p className="text-xs text-[#9E9A92] mt-0.5">Download your full history, tasks, and telemetry data in JSON format</p>
            </div>
            <button
              onClick={exportDataJSON}
              className="px-4 py-2 bg-[#24221F] hover:bg-[#292723] text-[#E8E6E3] rounded-lg text-xs font-semibold border border-[#33302B] flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-[#D4A24C]" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
