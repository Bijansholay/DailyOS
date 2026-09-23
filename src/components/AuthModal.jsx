import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, LogIn, UserPlus, X, AlertCircle, KeyRound, ShieldCheck, RefreshCw } from 'lucide-react';
import { PrimaryButton, SecondaryButton, IconButton } from './Button';

export default function AuthModal({ isOpen, initialRegister = false, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(initialRegister);
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 6-digit OTP state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [devOtpHint, setDevOtpHint] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);

  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otpInputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    setIsRegister(initialRegister);
    setStep('credentials');
    setErrorMsg(null);
    setSuccessMsg(null);
    setOtpDigits(['', '', '', '', '', '']);
  }, [initialRegister, isOpen]);

  useEffect(() => {
    let timer = null;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  if (!isOpen) return null;

  const handleCredentialsSubmit = async (e) => {
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
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.requireOtp) {
        setStep('otp');
        setDevOtpHint(data.otpCode || null);
        setSuccessMsg(data.message || 'Verification code sent.');
        setResendTimer(60);
        setTimeout(() => otpInputRefs[0].current?.focus(), 100);
        return;
      }

      // If response returns token directly (e.g. demo endpoint)
      if (data.token) {
        localStorage.setItem('dailyos_token', data.token);
        localStorage.setItem('dailyos_user', JSON.stringify(data.user));
        onAuthSuccess(data.user, data.token);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otpCode: fullOtp })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'OTP verification failed');
      }

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

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not resend OTP');

      setDevOtpHint(data.otpCode || null);
      setSuccessMsg('New 6-digit code sent!');
      setResendTimer(60);
    } catch (err) {
      setErrorMsg(err.message);
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
            {step === 'otp' ? <ShieldCheck className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="font-journal text-2xl text-[var(--text-main)]">
              {step === 'otp' ? 'Security Verification' : isRegister ? 'Create Journal Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {step === 'otp' 
                ? `Enter the 6-digit OTP code sent to ${email}` 
                : isRegister 
                  ? 'Sign up to isolate your tasks & analytics' 
                  : 'Sign in to access your daily schedule'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: CREDENTIALS FORM */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
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
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                Must be at least 8 characters long with letters and numbers.
              </p>
            </div>

            <PrimaryButton
              type="submit"
              disabled={isSubmitting}
              icon={isRegister ? UserPlus : LogIn}
              className="w-full mt-2"
            >
              {isSubmitting ? 'Processing...' : isRegister ? 'Create Account & Get Code' : 'Sign In & Get Code'}
            </PrimaryButton>
          </form>
        )}

        {/* STEP 2: 6-DIGIT OTP VERIFICATION FORM */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 text-center">
                6-Digit Security Verification Code
              </label>
              
              <div className="flex justify-center items-center gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={otpInputRefs[idx]}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-xl font-bold font-mono bg-[var(--bg-base)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                  />
                ))}
              </div>

              {devOtpHint && (
                <div className="mt-3 p-2 rounded-lg bg-purple-950/40 border border-purple-800/40 text-center text-xs text-purple-300 font-mono">
                  Dev OTP Code: <strong className="text-white text-sm">{devOtpHint}</strong>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <PrimaryButton
                type="submit"
                disabled={isSubmitting || otpDigits.join('').length < 6}
                icon={KeyRound}
                className="w-full"
              >
                {isSubmitting ? 'Verifying...' : 'Verify Code & Sign In'}
              </PrimaryButton>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  ← Back to Login
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0}
                  className={`flex items-center gap-1 ${
                    resendTimer > 0 
                      ? 'text-[var(--text-muted)] opacity-60 cursor-not-allowed' 
                      : 'text-[var(--accent-primary)] font-semibold hover:underline'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resendTimer > 0 ? '' : 'hover:rotate-180 transition-transform'}`} />
                  <span>{resendTimer > 0 ? `Resend code (${resendTimer}s)` : 'Resend Code'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {step === 'credentials' && (
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
        )}
      </div>
    </div>
  );
}
