import React from 'react';
import { 
  BookOpen, Sparkles, Zap, ShieldCheck, Clock, ArrowRight, 
  CheckCircle2, LogIn, UserPlus, Play, BarChart2, AlertTriangle 
} from 'lucide-react';

export default function LandingPage({ onOpenAuth, onTryDemo }) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] font-sans selection:bg-[var(--accent-bg-subtle)] selection:text-[var(--text-main)]">
      {/* PUBLIC HEADER */}
      <header className="border-b border-[var(--border-color)] px-6 py-4 max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-primary)]">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="font-journal text-xl text-[var(--text-main)] tracking-tight">DailyOS</span>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider ml-2 font-mono">v1.0</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenAuth(false)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium px-3 py-1.5 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => onOpenAuth(true)}
            className="text-xs bg-[var(--btn-primary-bg)] hover:opacity-90 text-[var(--btn-primary-text)] font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Start Journaling — Free</span>
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-4xl mx-auto text-center px-6 pt-16 pb-12 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full text-xs font-semibold text-[var(--accent-primary)]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Journal & Behavioral Schedule Engine</span>
        </div>

        <h1 className="font-journal text-4xl md:text-6xl text-[var(--text-main)] font-normal tracking-tight leading-tight">
          The Day Planner That Adapts To Your Energy.
        </h1>

        <p className="text-base md:text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed font-serif italic">
          Stop abandoning static to-do lists. DailyOS combines behavioral telemetry, peak energy window tracking, and AI schedule optimization into a quiet, distraction-free day journal.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => onOpenAuth(true)}
            className="w-full sm:w-auto px-7 py-3.5 bg-[var(--btn-primary-bg)] hover:opacity-90 text-[var(--btn-primary-text)] font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent-primary)]/10"
          >
            <span>Create Your Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onTryDemo}
            className="w-full sm:w-auto px-6 py-3.5 bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] font-medium text-sm rounded-lg border border-[var(--border-color)] transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Try Interactive Demo</span>
          </button>
        </div>
      </section>

      {/* VALUE PILLARS GRID */}
      <section className="max-w-5xl mx-auto px-6 py-12 border-t border-b border-[var(--border-color)] grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PILLAR 1 */}
        <div className="journal-card rounded-xl p-6 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--bg-base)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-primary)]">
            <BookOpen className="w-4 h-4" />
          </div>
          <h3 className="font-journal text-xl text-[var(--text-main)]">Editorial Day Planner</h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Styled like a handwritten paper journal. Running timeline down the page with time on the left, priority text weight on the right—zero cluttering badges.
          </p>
        </div>

        {/* PILLAR 2 */}
        <div className="journal-card rounded-xl p-6 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--bg-base)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-primary)]">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="font-journal text-xl text-[var(--text-main)]">Behavioral Telemetry</h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Automatically computes your peak focus hours (09:00–12:00), measures time estimation accuracy, and flags 3-day skip streaks before burnout occurs.
          </p>
        </div>

        {/* PILLAR 3 */}
        <div className="journal-card rounded-xl p-6 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--bg-base)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-primary)]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-journal text-xl text-[var(--text-main)]">00:01 AM Midnight Reset</h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Automated background daemon cleans up past uncompleted tasks nightly, preventing task accumulation guilt and keeping your focus view fresh.
          </p>
        </div>
      </section>

      {/* DEMO PREVIEW BANNER */}
      <section className="max-w-4xl mx-auto px-6 py-16 space-y-6 text-center">
        <span className="text-xs font-semibold tracking-widest text-[var(--accent-primary)] uppercase">Social Innovation & Education</span>
        <h2 className="font-journal text-3xl md:text-4xl text-[var(--text-main)]">Built to Bridge the Executive Function Gap</h2>
        <p className="text-sm text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
          Designed specifically for university students, self-taught developers, and researchers struggling with chronic procrastination and task paralysis.
        </p>

        <div className="journal-card rounded-xl p-6 border-l-4 border-l-[var(--accent-primary)] text-left max-w-2xl mx-auto">
          <p className="text-[var(--text-main)] font-serif italic text-base">
            "Your afternoon fits best for deep focus — you complete 80% of tasks planned in your peak window."
          </p>
          <span className="text-xs text-[var(--text-muted)] mt-2 block font-mono">
            — Google Gemini Schedule Optimization Co-pilot
          </span>
        </div>

        <div className="pt-4">
          <button
            onClick={() => onOpenAuth(true)}
            className="px-8 py-3.5 bg-[var(--btn-primary-bg)] hover:opacity-90 text-[var(--btn-primary-text)] font-semibold text-sm rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <span>Create Your Account Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border-color)] py-8 px-6 max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[var(--accent-primary)]" />
          <span className="font-journal text-sm text-[var(--text-main)]">DailyOS</span>
          <span>© 2026 DailyOS Core Team</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Social Innovation / Education Edition</span>
          <span>•</span>
          <span>AWS EC2 Deployed</span>
        </div>
      </footer>
    </div>
  );
}

