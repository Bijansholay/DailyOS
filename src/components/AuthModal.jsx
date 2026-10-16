import React, { useState, useEffect } from 'react';
import { X, BookOpen, LogIn, UserPlus, AlertCircle, CheckCircle2, Eye, EyeOff, Play } from 'lucide-react';

export default function AuthModal({ isOpen, initialRegister = false, onClose, onAuthSuccess, onTryDemo }) {
  const [isRegister, setIsRegister] = useState(initialRegister);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsRegister(initialRegister);
  }, [initialRegister]);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

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

      setSuccessMsg(isRegister ? 'Account created! Signing you in...' : 'Welcome back! Loading your workspace...');

      if (data.token && data.user) {
        localStorage.setItem('dailyos_token', data.token);
        localStorage.setItem('dailyos_user', JSON.stringify(data.user));
        if (onAuthSuccess) {
          setTimeout(() => {
            onAuthSuccess(data.user, data.token);
            onClose();
          }, 600);
        }
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setIsRegister(!isRegister);
    setErrorMsg(null);
    setSuccessMsg(null);
    setEmail('');
    setPassword('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-[420px] rounded-3xl overflow-hidden animate-scaleIn"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 32px 80px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(147,51,234,0.1)'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl transition-all hover:bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top gradient accent bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #7C3AED, #9333EA, #A855F7)' }} />

        <div className="p-7 space-y-6">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', boxShadow: '0 8px 20px rgba(147,51,234,0.35)' }}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-journal text-2xl" style={{ color: 'var(--text-main)' }}>
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {isRegister ? 'Start your productivity journey — free forever' : 'Sign in to your daily workspace'}
              </p>
            </div>
          </div>

          {/* Error / Success */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl flex items-start gap-3 text-xs animate-slideUp"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span style={{ color: '#F87171' }}>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl flex items-start gap-3 text-xs animate-slideUp"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span style={{ color: '#34D399' }}>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-sm journal-input"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 rounded-2xl text-sm journal-input"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {isRegister && (
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Min 8 characters with at least one letter and one number.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isSubmitting ? 'var(--btn-primary-bg)' : 'linear-gradient(135deg, #7C3AED, #9333EA)',
                color: '#fff',
                boxShadow: isSubmitting ? 'none' : '0 8px 24px -4px rgba(147,51,234,0.5)',
                transform: isSubmitting ? 'none' : undefined
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <>
                  {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  {isRegister ? 'Create Account' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          {/* Demo + Switch */}
          <div className="space-y-3 pt-1 border-t" style={{ borderColor: 'var(--border-color)' }}>
            {onTryDemo && (
              <button
                onClick={() => { onClose(); onTryDemo(); }}
                className="w-full py-2.5 rounded-2xl text-xs font-medium flex items-center justify-center gap-2 transition-all"
                style={{
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)'
                }}
              >
                <Play className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                Try Demo — No sign up needed
              </button>
            )}
            <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
              {' '}
              <button type="button" onClick={switchMode} className="font-semibold hover:underline" style={{ color: 'var(--accent-primary)' }}>
                {isRegister ? 'Sign In' : 'Create Account'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
