import React, { useState } from 'react';
import { X, BookOpen, LogIn, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { IconButton, PrimaryButton } from './Button';

export default function AuthModal({ isOpen, initialRegister = false, onClose, onAuthSuccess, onTryDemo }) {
  const [isRegister, setIsRegister] = useState(initialRegister);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please check your details.');
      }

      setSuccessMsg(isRegister ? 'Account created successfully!' : 'Signed in successfully!');
      
      if (data.token && data.user) {
        localStorage.setItem('dailyos_token', data.token);
        localStorage.setItem('dailyos_user', JSON.stringify(data.user));
        if (onAuthSuccess) {
          onAuthSuccess(data.user, data.token);
        }
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md journal-card rounded-2xl p-6 border border-[var(--border-color)] shadow-2xl">
        <div className="absolute top-4 right-4">
          <IconButton onClick={onClose} icon={X} title="Close" />
        </div>

        {/* LOGO & TITLE */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-journal text-2xl text-[var(--text-main)]">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {isRegister ? 'Sign up to manage your tasks & goals' : 'Sign in to access your daily planner'}
            </p>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* CREDENTIALS FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 journal-input rounded-xl text-sm"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 journal-input rounded-xl text-sm"
              required
            />
            {isRegister && (
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                Must be at least 8 characters with letters and numbers.
              </p>
            )}
          </div>

          <PrimaryButton
            type="submit"
            disabled={isSubmitting}
            icon={isRegister ? UserPlus : LogIn}
            className="w-full mt-2"
          >
            {isSubmitting ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
          </PrimaryButton>
        </form>

        {/* FOOTER SWITCH */}
        <div className="mt-6 pt-4 border-t border-[var(--border-color)] text-center text-xs text-[var(--text-muted)]">
          {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="text-[var(--accent-primary)] font-semibold hover:underline ml-1"
          >
            {isRegister ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        {onTryDemo && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                onTryDemo();
              }}
              className="text-xs text-slate-400 hover:text-white underline transition-colors"
            >
              Or try Interactive Demo Mode without signing in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
