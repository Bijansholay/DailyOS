import React, { useState, useEffect } from 'react';
import { BookOpen, LogIn, UserPlus, X, AlertCircle } from 'lucide-react';
import { PrimaryButton, IconButton } from './Button';

export default function AuthModal({ isOpen, initialRegister = false, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(initialRegister);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsRegister(initialRegister);
  }, [initialRegister, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Save token and user details to localStorage
      localStorage.setItem('dailyos_token', data.token);
      localStorage.setItem('dailyos_user', JSON.stringify(data.user));

      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md journal-card rounded-xl p-6 border border-[var(--border-color)] shadow-2xl">
        <div className="absolute top-4 right-4">
          <IconButton onClick={onClose} icon={X} title="Close" />
        </div>

        {/* LOGO / HEADER */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-[var(--bg-base)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-primary)]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-journal text-2xl text-[var(--text-main)]">
              {isRegister ? 'Create Journal Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {isRegister ? 'Sign up to isolate your tasks & analytics' : 'Sign in to access your daily schedule'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

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
              className="w-full px-3.5 py-2.5 journal-input rounded-lg text-sm"
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
              className="w-full px-3.5 py-2.5 journal-input rounded-lg text-sm"
              required
            />
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

        <div className="mt-6 pt-4 border-t border-[var(--border-color)] text-center text-xs text-[var(--text-muted)]">
          {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg(null);
            }}
            className="text-[var(--accent-primary)] font-semibold hover:underline ml-1"
          >
            {isRegister ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

