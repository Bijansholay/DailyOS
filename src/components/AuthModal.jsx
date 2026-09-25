import React from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { X, KeyRound, AlertTriangle, ArrowRight } from 'lucide-react';
import { IconButton, Button } from './Button';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isClerkKeyConfigured = Boolean(CLERK_KEY && CLERK_KEY !== 'pk_test_sample');

export default function AuthModal({ isOpen, initialRegister = false, onClose, onTryDemo }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-md journal-card rounded-2xl p-6 border border-[var(--border-color)] shadow-2xl flex flex-col items-center my-8">
        <div className="absolute top-3 right-3 z-10">
          <IconButton onClick={onClose} icon={X} title="Close" />
        </div>

        {!isClerkKeyConfigured ? (
          <div className="w-full pt-4 flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Clerk Auth Not Configured</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                Production build is missing a valid <code className="text-purple-300 bg-purple-950/60 px-1 py-0.5 rounded">VITE_CLERK_PUBLISHABLE_KEY</code>.
              </p>
            </div>
            <div className="bg-[#1C1924] p-3.5 rounded-xl border border-[#2D273C] text-left w-full text-[11px] text-slate-300 space-y-1.5 font-mono">
              <p className="text-slate-400">// To fix in production (dailyos.tech):</p>
              <p>1. Add <span className="text-emerald-400">VITE_CLERK_PUBLISHABLE_KEY=pk_live_...</span> to .env</p>
              <p>2. Run <span className="text-amber-300">npm run build</span> &amp; restart</p>
            </div>
            {onTryDemo && (
              <Button
                variant="primary"
                onClick={() => {
                  onClose();
                  onTryDemo();
                }}
                className="w-full mt-2 flex items-center justify-center gap-2"
              >
                <span>Continue in Interactive Demo Mode</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="w-full pt-4 flex justify-center">
            {initialRegister ? (
              <SignUp routing="virtual" />
            ) : (
              <SignIn routing="virtual" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

