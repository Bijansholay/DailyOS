import React from 'react';
import { 
  BookOpen, Sparkles, Zap, ShieldCheck, Clock, ArrowRight, 
  CheckCircle2, LogIn, UserPlus, Play, BarChart2, AlertTriangle 
} from 'lucide-react';

export default function LandingPage({ onOpenAuth, onTryDemo }) {
  return (
    <div className="min-h-screen bg-[#1C1B19] text-[#E8E6E3] font-sans selection:bg-[#D4A24C]/30 selection:text-[#E8E6E3]">
      {/* PUBLIC HEADER */}
      <header className="border-b border-[#33302B] px-6 py-4 max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#24221F] border border-[#33302B] flex items-center justify-center text-[#D4A24C]">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="font-journal text-xl text-[#E8E6E3] tracking-tight">DailyOS</span>
            <span className="text-[10px] text-[#9E9A92] uppercase tracking-wider ml-2 font-mono">v1.0</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenAuth(false)}
            className="text-xs text-[#9E9A92] hover:text-[#E8E6E3] font-medium px-3 py-1.5 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => onOpenAuth(true)}
            className="text-xs bg-[#D4A24C] hover:bg-[#C3913B] text-[#1C1B19] font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Start Journaling — Free</span>
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-4xl mx-auto text-center px-6 pt-16 pb-12 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#24221F] border border-[#33302B] rounded-full text-xs font-semibold text-[#D4A24C]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Journal & Behavioral Schedule Engine</span>
        </div>

        <h1 className="font-journal text-4xl md:text-6xl text-[#E8E6E3] font-normal tracking-tight leading-tight">
          The Day Planner That Adapts To Your Energy.
        </h1>

        <p className="text-base md:text-lg text-[#9E9A92] max-w-2xl mx-auto leading-relaxed font-serif italic">
          Stop abandoning static to-do lists. DailyOS combines behavioral telemetry, peak energy window tracking, and AI schedule optimization into a quiet, distraction-free day journal.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => onOpenAuth(true)}
            className="w-full sm:w-auto px-7 py-3.5 bg-[#D4A24C] hover:bg-[#C3913B] text-[#1C1B19] font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#D4A24C]/10"
          >
            <span>Create Your Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onTryDemo}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#24221F] hover:bg-[#292723] text-[#E8E6E3] font-medium text-sm rounded-lg border border-[#33302B] transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-3.5 h-3.5 text-[#D4A24C]" />
            <span>Try Interactive Demo</span>
          </button>
        </div>
      </section>

      {/* VALUE PILLARS GRID */}
      <section className="max-w-5xl mx-auto px-6 py-12 border-t border-b border-[#33302B] grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PILLAR 1 */}
        <div className="journal-card rounded-xl p-6 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-[#1C1B19] border border-[#33302B] flex items-center justify-center text-[#D4A24C]">
            <BookOpen className="w-4 h-4" />
          </div>
          <h3 className="font-journal text-xl text-[#E8E6E3]">Editorial Day Planner</h3>
          <p className="text-xs text-[#9E9A92] leading-relaxed">
            Styled like a handwritten paper journal. Running timeline down the page with time on the left, priority text weight on the right—zero cluttering badges.
          </p>
        </div>

        {/* PILLAR 2 */}
        <div className="journal-card rounded-xl p-6 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-[#1C1B19] border border-[#33302B] flex items-center justify-center text-[#D4A24C]">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="font-journal text-xl text-[#E8E6E3]">Behavioral Telemetry</h3>
          <p className="text-xs text-[#9E9A92] leading-relaxed">
            Automatically computes your peak focus hours (09:00–12:00), measures time estimation accuracy, and flags 3-day skip streaks before burnout occurs.
          </p>
        </div>

        {/* PILLAR 3 */}
        <div className="journal-card rounded-xl p-6 space-y-3">
          <div className="w-9 h-9 rounded-lg bg-[#1C1B19] border border-[#33302B] flex items-center justify-center text-[#D4A24C]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-journal text-xl text-[#E8E6E3]">00:01 AM Midnight Reset</h3>
          <p className="text-xs text-[#9E9A92] leading-relaxed">
            Automated background daemon cleans up past uncompleted tasks nightly, preventing task accumulation guilt and keeping your focus view fresh.
          </p>
        </div>
      </section>

      {/* DEMO PREVIEW BANNER */}
      <section className="max-w-4xl mx-auto px-6 py-16 space-y-6 text-center">
        <span className="text-xs font-semibold tracking-widest text-[#D4A24C] uppercase">Social Innovation & Education</span>
        <h2 className="font-journal text-3xl md:text-4xl text-[#E8E6E3]">Built to Bridge the Executive Function Gap</h2>
        <p className="text-sm text-[#9E9A92] max-w-2xl mx-auto leading-relaxed">
          Designed specifically for university students, self-taught developers, and researchers struggling with chronic procrastination and task paralysis.
        </p>

        <div className="journal-card rounded-xl p-6 border-l-4 border-l-[#D4A24C] text-left max-w-2xl mx-auto">
          <p className="text-[#E8E6E3] font-serif italic text-base">
            "Your afternoon fits best for deep focus — you complete 80% of tasks planned in your peak window."
          </p>
          <span className="text-xs text-[#9E9A92] mt-2 block font-mono">
            — Google Gemini Schedule Optimization Co-pilot
          </span>
        </div>

        <div className="pt-4">
          <button
            onClick={() => onOpenAuth(true)}
            className="px-8 py-3.5 bg-[#D4A24C] hover:bg-[#C3913B] text-[#1C1B19] font-semibold text-sm rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <span>Create Your Account Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#33302B] py-8 px-6 max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#9E9A92]">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#D4A24C]" />
          <span className="font-journal text-sm text-[#E8E6E3]">DailyOS</span>
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
