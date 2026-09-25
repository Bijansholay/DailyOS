import React from 'react';

export function PrimaryButton({ 
  children, 
  onClick, 
  type = 'button', 
  disabled = false, 
  className = '', 
  icon: Icon,
  title
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
    </button>
  );
}

export function SecondaryButton({ 
  children, 
  onClick, 
  type = 'button', 
  disabled = false, 
  className = '', 
  icon: Icon,
  title
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-4 py-2 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-2 bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </button>
  );
}

export function IconButton({ 
  onClick, 
  type = 'button', 
  disabled = false, 
  className = '', 
  icon: Icon, 
  title,
  danger = false
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-xl transition-all flex items-center justify-center ${
        danger 
          ? 'text-rose-400 hover:text-rose-500 hover:bg-rose-500/10' 
          : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]'
      } active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
}

export function ActionPillButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  icon: Icon,
  title,
  active = false
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 shrink-0 ${
        active
          ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] shadow-sm'
          : 'bg-[var(--accent-bg-subtle)] text-[var(--accent-primary)] hover:opacity-90 border border-[var(--accent-primary)]/30'
      } active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </button>
  );
}

export { PrimaryButton as Button };

