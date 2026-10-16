import React, { useState, useEffect } from 'react';
import {
  BookOpen, Sparkles, Zap, ShieldCheck, ArrowRight,
  CheckCircle2, LogIn, UserPlus, Play, BarChart2,
  LayoutDashboard, ListTodo, Target, PieChart, Inbox,
  History, Settings, ChevronDown, ChevronRight, Clock,
  Flame, Brain, Calendar, Star, TrendingUp, Bell, Menu, X
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    id: 'planner',
    icon: LayoutDashboard,
    label: 'Day Planner',
    color: '#9333EA',
    badge: 'Core',
    tagline: 'Your command center for the day',
    steps: [
      'Click "+ Add Task" (top right) to create your first task — give it a title, category, priority, and optional start time.',
      'Swipe a task right on mobile to instantly mark it complete. Swipe left to postpone. On desktop, click the circle or "Mark Done" button.',
      'Use the date ribbon at the top to jump between days. Navigate backwards to see past history or forward to plan ahead.',
      'Click "AI Briefing" (refresh icon next to "Focus Schedule") to let the AI assign optimal time slots across your tasks.',
      'The pace chart at top shows your real-time completion rate vs. average — hover data points to inspect each hour.',
    ],
    tips: 'The AI Briefing engine reads your productivity patterns (from Analytics) to place high-priority tasks in your peak energy window.',
  },
  {
    id: 'undone',
    icon: ListTodo,
    label: 'Undone Tasks',
    color: '#EC4899',
    badge: 'Recovery',
    tagline: 'Never lose track of pending work',
    steps: [
      'Every task that was not completed by its scheduled date appears here automatically — nothing gets silently dropped.',
      'Use "Schedule for Today" to pull any undone task back into your active daily planner.',
      'Use "Delete" to permanently remove tasks you no longer need — keep this list lean and honest.',
      'Filter by category pill buttons (Work, Personal, School, Health) to focus on one area at a time.',
      'The badge number on the sidebar shows the live count — treat anything over 10 as a signal to reschedule or cut.',
    ],
    tips: 'The midnight daemon at 00:01 AM automatically marks past-due tasks as "late" and moves them here. You wake up to a clean today view.',
  },
  {
    id: 'goals',
    icon: Target,
    label: 'Goals & Review',
    color: '#F59E0B',
    badge: 'Milestones',
    tagline: 'Track progress across Daily, Weekly & Monthly horizons',
    steps: [
      'Switch between Daily Review, Weekly Goals, and Monthly Objectives using the three-tab selector.',
      'Daily Review shows your target progress bars — how many tasks you completed vs. your personal target (set in Settings).',
      'Click "+ Add Goal" to create a milestone (e.g. "Read 2 books this month", target quantity: 2).',
      'Use "+1 Progress" on any goal card to increment its progress counter. When it hits the target it auto-marks as Achieved.',
      'The Reflection Check-in shows your mood note — add one from Log History after each day to build a consistent journal.',
    ],
    tips: 'Weekly and Monthly goals live independently from daily tasks — use them for big-picture objectives, not granular to-dos.',
  },
  {
    id: 'analytics',
    icon: PieChart,
    label: 'Analytics',
    color: '#06B6D4',
    badge: 'Insights',
    tagline: 'Behavioral telemetry computed from your real data',
    steps: [
      'Analytics recomputes automatically every night at 00:05 AM using the last 30 days of your task history.',
      'The Peak Focus Hours heatmap shows which hours you complete the most work — schedule deep work in your green zones.',
      'Category skip rates reveal which areas of your life you consistently avoid — useful pattern to catch burnout early.',
      'Time Estimation Accuracy measures how close your "estimated minutes" are to reality. < 0.8 means you underestimate regularly.',
      'Click "Recompute Patterns" to force a fresh analytics run if you just logged a lot of completed tasks.',
    ],
    tips: 'Analytics needs at least 7–10 completed tasks with scheduled times to produce meaningful peak hour data.',
  },
  {
    id: 'backlog',
    icon: Inbox,
    label: 'Backlog',
    color: '#10B981',
    badge: 'Queue',
    tagline: 'Park ideas here, pull them when ready',
    steps: [
      'Create tasks without a scheduled date from the Day Planner — they land in Backlog automatically.',
      'Or use "+ Add to Backlog" inside the Backlog view to capture ideas quickly without date pressure.',
      'Click "Schedule for [Date]" on any backlog card to move it into a specific day\'s planner.',
      'Use the search bar to quickly find tasks by keyword across your entire backlog queue.',
      'Delete stale ideas ruthlessly — a bloated backlog creates the same anxiety as a cluttered inbox.',
    ],
    tips: 'Think of Backlog as your "someday/maybe" list from GTD. Review it weekly and pull 2–3 items into each new week.',
  },
  {
    id: 'history',
    icon: History,
    label: 'Log History',
    color: '#8B5CF6',
    badge: 'Journal',
    tagline: 'Daily performance logs & mood journal',
    steps: [
      'Navigate to any past date using the calendar picker to view that day\'s task performance log.',
      'The log shows tasks completed, skipped, and late — alongside the AI briefing summary generated that morning.',
      'Use the "Daily Reflection" text field to write a mood note (how the day felt, blockers, wins). Hit "Save Reflection".',
      'Reflection notes flow into Goals & Review → Daily Review as your personal check-in journal.',
      'Logs are created automatically at midnight and updated whenever you mark tasks complete.',
    ],
    tips: 'Even a single sentence reflection per day builds a powerful 30-day pattern. Consistency matters more than length.',
  },
  {
    id: 'settings',
    icon: Settings,
    label: 'Settings',
    color: '#64748B',
    badge: 'Config',
    tagline: 'Personalize your workspace',
    steps: [
      'Theme: Switch between Dark Dashboard (Nixtio) and Light Workspace (Zentra) — persists across sessions.',
      'Time Format: Choose 12-hour AM/PM, 24-hour exact, or Time Range display (e.g. 2:30 PM – 3:15 PM).',
      'Daily Goals: Set your personal targets for tasks per day and focus minutes per day — used in Goals & Review.',
      'Notifications: Enable desktop push alerts to get reminded when a task\'s scheduled time arrives.',
      'Export: Download your full task/event history as a .ics calendar file or JSON data backup.',
    ],
    tips: 'The time range display format is especially useful on desktop where you can see full task blocks at a glance.',
  },
];

const FEATURES = [
  { icon: Brain, label: 'AI Schedule Optimizer', desc: 'Assigns optimal time slots using your behavioral peak hours', color: '#9333EA' },
  { icon: TrendingUp, label: 'Behavioral Telemetry', desc: 'Tracks skip streaks, time accuracy, and energy patterns', color: '#06B6D4' },
  { icon: Flame, label: 'Midnight Reset Daemon', desc: 'Auto-cleans overdue tasks nightly at 00:01 AM', color: '#F59E0B' },
  { icon: Bell, label: 'Desktop Notifications', desc: 'Push reminders when tasks reach their scheduled start time', color: '#EC4899' },
  { icon: Calendar, label: 'ICS Export', desc: 'One-click export to Apple Calendar, Google Calendar, Outlook', color: '#10B981' },
  { icon: Star, label: 'Multi-Horizon Goals', desc: 'Daily, weekly, and monthly goal tracking with progress bars', color: '#8B5CF6' },
];

function AccordionSection({ section, isOpen, onToggle }) {
  const Icon = section.icon;
  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        isOpen
          ? 'border-[var(--accent-primary)]/40 shadow-lg shadow-[var(--accent-primary)]/5'
          : 'border-[var(--border-color)] hover:border-[var(--text-muted)]/40'
      }`}
      style={{ background: 'var(--bg-card)' }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left group"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${section.color}20`, border: `1px solid ${section.color}30` }}
          >
            <Icon className="w-5 h-5" style={{ color: section.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[var(--text-main)]">{section.label}</span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ background: `${section.color}20`, color: section.color }}
              >
                {section.badge}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{section.tagline}</p>
          </div>
        </div>
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-4 border-t border-[var(--border-color)]">
          <ol className="space-y-3 pt-4">
            {section.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${section.color}25`, color: section.color }}
                >
                  {i + 1}
                </span>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>

          <div
            className="flex items-start gap-3 p-3.5 rounded-xl text-xs leading-relaxed"
            style={{ background: `${section.color}10`, border: `1px solid ${section.color}20` }}
          >
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: section.color }} />
            <p style={{ color: section.color }}><strong>Pro tip:</strong> {section.tips}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LandingPage({ onOpenAuth, onTryDemo }) {
  const [openSection, setOpenSection] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToGuide = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] font-sans overflow-x-hidden">

      {/* ── STICKY HEADER ────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-[var(--border-color)] backdrop-blur-xl bg-[var(--bg-base)]/90' : ''
      }`}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] flex items-center justify-center shadow-lg shadow-purple-900/30">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-journal text-xl text-[var(--text-main)] tracking-tight">DailyOS</span>
            <span className="hidden sm:inline text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-color)] px-2 py-0.5 rounded-full">v1.0</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={scrollToGuide} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium transition-colors">How it Works</button>
            <button onClick={() => onOpenAuth(false)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium transition-colors flex items-center gap-1.5">
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
            <button
              onClick={() => onOpenAuth(true)}
              className="text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-purple-900/20"
              style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Get Started Free
            </button>
          </nav>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 rounded-lg text-[var(--text-muted)]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--border-color)] bg-[var(--bg-card)] px-5 py-4 space-y-3">
            <button onClick={() => { scrollToGuide(); setMobileMenuOpen(false); }} className="w-full text-left text-sm text-[var(--text-muted)] py-2">How it Works</button>
            <button onClick={() => { onOpenAuth(false); setMobileMenuOpen(false); }} className="w-full text-left text-sm text-[var(--text-muted)] py-2 flex items-center gap-2">
              <LogIn className="w-4 h-4" /> Sign In
            </button>
            <button onClick={() => { onTryDemo(); setMobileMenuOpen(false); }} className="w-full text-left text-sm text-[var(--text-muted)] py-2 flex items-center gap-2">
              <Play className="w-4 h-4 text-[var(--accent-primary)]" /> Try Interactive Demo
            </button>
            <button
              onClick={() => { onOpenAuth(true); setMobileMenuOpen(false); }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
            >
              Create Free Account
            </button>
          </div>
        )}
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative max-w-5xl mx-auto px-5 pt-20 pb-16 text-center overflow-hidden">
        {/* Glow blob */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(ellipse, #9333EA 0%, transparent 70%)' }} />
        </div>

        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border"
            style={{ background: 'var(--accent-bg-subtle)', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}>
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Personal Operating System
          </div>

          <h1 className="font-journal text-4xl sm:text-5xl md:text-6xl text-[var(--text-main)] font-normal tracking-tight leading-[1.1]">
            The Day Planner That{' '}
            <span style={{ color: 'var(--accent-primary)' }}>Learns</span>{' '}
            Your Energy.
          </h1>

          <p className="text-base md:text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
            Stop fighting generic to-do lists. DailyOS tracks your peak hours, auto-schedules your tasks,
            and gives you behavioral analytics that actually change how you work.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenAuth(true)}
              className="w-full sm:w-auto px-7 py-3.5 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #9333EA)',
                color: '#fff',
                boxShadow: '0 8px 32px -4px rgba(147,51,234,0.4)'
              }}
            >
              <UserPlus className="w-4 h-4" />
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onTryDemo}
              className="w-full sm:w-auto px-6 py-3.5 font-medium text-sm rounded-xl border transition-all flex items-center justify-center gap-2"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
            >
              <Play className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              Try Interactive Demo
            </button>
            <button
              onClick={scrollToGuide}
              className="hidden sm:flex text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] items-center gap-1.5 transition-colors ml-2"
            >
              See how it works
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── LIVE MOCK DASHBOARD PREVIEW ───────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-5 pb-16">
        <div className="rounded-2xl border overflow-hidden shadow-2xl"
          style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)', boxShadow: '0 32px 80px -16px rgba(0,0,0,0.5)' }}>

          {/* Mock window chrome */}
          <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-base)' }}>
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
            <div className="flex-1 mx-4">
              <div className="max-w-[180px] mx-auto h-5 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center">
                <span className="text-[9px] text-[var(--text-muted)] font-mono">dailyos.tech</span>
              </div>
            </div>
          </div>

          {/* Mock app content */}
          <div className="flex h-[220px] md:h-[280px]">
            {/* Sidebar */}
            <div className="w-16 border-r flex flex-col items-center py-5 gap-4 shrink-0" style={{ background: '#0C0B0E', borderColor: '#1F192E' }}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              {[LayoutDashboard, ListTodo, Target, PieChart, Inbox, History, Settings].map((Icon, i) => (
                <div key={i} className={`p-2 rounded-xl transition-all ${i === 0 ? 'bg-[#1C1924] text-[#A855F7]' : 'text-slate-500'}`}>
                  <Icon className="w-4 h-4" />
                </div>
              ))}
            </div>

            {/* Main area */}
            <div className="flex-1 p-4 space-y-3 overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-5 w-20 rounded bg-[var(--bg-base)] border border-[var(--border-color)]" />
                  <div className="h-3 w-32 rounded bg-[var(--bg-base)] border border-[var(--border-color)] mt-1.5" />
                </div>
                <div className="flex gap-2">
                  <div className="h-7 w-24 rounded-lg bg-[var(--bg-base)] border border-[var(--border-color)]" />
                  <div className="h-7 w-20 rounded-lg" style={{ background: 'var(--accent-primary)' }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {['5 / 8', '62%', '3 days'].map((val, i) => (
                  <div key={i} className="rounded-xl p-3 border" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                    <div className="text-[9px] text-[var(--text-muted)] uppercase font-bold mb-1">{['Tasks', 'Rate', 'Streak'][i]}</div>
                    <div className="text-sm font-extrabold text-[var(--text-main)]">{val}</div>
                    <div className="mt-1.5 h-1 rounded-full bg-[var(--border-color)]">
                      <div className="h-1 rounded-full" style={{ width: `${[62, 62, 30][i]}%`, background: ['#9333EA', '#9333EA', '#F59E0B'][i] }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-3 border space-y-2" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                {['Complete project brief', 'Review pull requests', 'Gym session'].map((title, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    {i === 0
                      ? <CheckCircle2 className="w-4 h-4 text-[#9333EA] shrink-0" />
                      : <div className="w-4 h-4 rounded-full border border-[var(--border-color)] shrink-0" />
                    }
                    <span className={`text-[10px] font-medium ${i === 0 ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-main)]'}`}>{title}</span>
                    <span className="text-[9px] font-mono ml-auto" style={{ color: 'var(--accent-primary)' }}>{['9:00 AM', '10:30 AM', '1:00 PM'][i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-4">
          Actual DailyOS interface — Dark Dashboard (Nixtio) theme
        </p>
      </section>

      {/* ── FEATURE GRID ─────────────────────────────────────────────── */}
      <section className="border-t border-[var(--border-color)] py-16">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-10 space-y-2">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent-primary)' }}>What Makes It Different</span>
            <h2 className="font-journal text-3xl md:text-4xl text-[var(--text-main)]">Built Around How You Actually Work</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label}
                  className="rounded-2xl p-5 border transition-all group hover:scale-[1.02] hover:shadow-lg cursor-default"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `${f.color}20`, border: `1px solid ${f.color}30` }}>
                    <Icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="font-semibold text-sm text-[var(--text-main)] mb-1">{f.label}</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS / NAVIGATION GUIDE ─────────────────────────── */}
      <section id="how-it-works" className="border-t border-[var(--border-color)] py-16">
        <div className="max-w-3xl mx-auto px-5">
          <div className="text-center mb-10 space-y-2">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent-primary)' }}>Navigation Guide</span>
            <h2 className="font-journal text-3xl md:text-4xl text-[var(--text-main)]">How to Use Every Section</h2>
            <p className="text-sm text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
              DailyOS has 7 distinct modules, each with a specific purpose.
              Click any section below for step-by-step instructions.
            </p>
          </div>

          {/* Quick nav pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {NAV_SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setOpenSection(openSection === s.id ? null : s.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={openSection === s.id
                    ? { background: `${s.color}20`, borderColor: s.color, color: s.color }
                    : { background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }
                  }
                >
                  <Icon className="w-3 h-3" />
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Accordion sections */}
          <div className="space-y-3">
            {NAV_SECTIONS.map((section) => (
              <AccordionSection
                key={section.id}
                section={section}
                isOpen={openSection === section.id}
                onToggle={() => setOpenSection(openSection === section.id ? null : section.id)}
              />
            ))}
          </div>

          {/* Getting started fast track */}
          <div className="mt-10 rounded-2xl p-6 border"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(147,51,234,0.06))',
              borderColor: 'rgba(147,51,234,0.3)'
            }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(147,51,234,0.2)', border: '1px solid rgba(147,51,234,0.3)' }}>
                <Zap className="w-5 h-5" style={{ color: '#9333EA' }} />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-[var(--text-main)]">5-Minute Quick Start</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  <strong className="text-[var(--text-main)]">Step 1:</strong> Create an account or try the demo.{' '}
                  <strong className="text-[var(--text-main)]">Step 2:</strong> Add 3–5 tasks in Day Planner.{' '}
                  <strong className="text-[var(--text-main)]">Step 3:</strong> Click "AI Briefing" to auto-assign times.{' '}
                  <strong className="text-[var(--text-main)]">Step 4:</strong> Mark tasks done as you go.{' '}
                  <strong className="text-[var(--text-main)]">Step 5:</strong> Write a reflection in Log History tonight.
                  After 7 days, your Analytics will show your real peak hours. 🎯
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL / AI QUOTE ───────────────────────────────────── */}
      <section className="border-t border-[var(--border-color)] py-16">
        <div className="max-w-4xl mx-auto px-5">
          <div className="text-center mb-10 space-y-2">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent-primary)' }}>Social Innovation & Education</span>
            <h2 className="font-journal text-3xl md:text-4xl text-[var(--text-main)]">Built to Bridge the Executive Function Gap</h2>
            <p className="text-sm text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
              Designed for university students, self-taught developers, and researchers who struggle
              with chronic procrastination and task paralysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { quote: 'Your afternoon fits best for deep focus — you complete 80% of tasks planned in your peak window.', attr: 'AI Schedule Optimizer' },
              { quote: '"Work" tasks have been skipped 4 days in a row. Consider breaking them into smaller subtasks.', attr: 'Behavioral Telemetry' },
              { quote: 'You underestimate task duration by 1.4× on average. Adding 40% buffer would improve your completion rate.', attr: 'Time Estimation Engine' },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl p-5 border-l-4 space-y-3"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-color)',
                  borderLeftColor: ['#9333EA', '#EC4899', '#06B6D4'][i]
                }}>
                <p className="text-sm text-[var(--text-main)] font-serif italic leading-relaxed">
                  "{item.quote}"
                </p>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: ['#9333EA', '#EC4899', '#06B6D4'][i] }} />
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">— {item.attr}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────────── */}
      <section className="border-t border-[var(--border-color)] py-20 text-center">
        <div className="max-w-2xl mx-auto px-5 space-y-6">
          <h2 className="font-journal text-3xl md:text-4xl text-[var(--text-main)]">Ready to Work With Your Energy?</h2>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Free forever. No credit card required. Your data stays yours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenAuth(true)}
              className="w-full sm:w-auto px-8 py-3.5 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #9333EA)',
                color: '#fff',
                boxShadow: '0 8px 32px -4px rgba(147,51,234,0.4)'
              }}
            >
              Create Your Account — Free
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onTryDemo}
              className="w-full sm:w-auto px-6 py-3.5 font-medium text-sm rounded-xl border transition-all flex items-center justify-center gap-2"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
            >
              <Play className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              Try Without Signing Up
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border-color)] py-8 px-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-white" />
            </div>
            <span className="font-journal text-sm text-[var(--text-main)]">DailyOS</span>
            <span>© 2026</span>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={scrollToGuide} className="hover:text-[var(--text-main)] transition-colors">Documentation</button>
            <button onClick={() => onOpenAuth(false)} className="hover:text-[var(--text-main)] transition-colors">Sign In</button>
            <button onClick={onTryDemo} className="hover:text-[var(--text-main)] transition-colors">Live Demo</button>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AWS EC2 · Live
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
