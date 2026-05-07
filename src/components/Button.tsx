import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', children, style, ...props }: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    fontFamily: 'var(--font-display)',
    fontWeight: 500,
    borderRadius: 'var(--radius-md)',
    transition: 'all var(--transition-fast)',
    cursor: 'pointer',
    border: 'none',
    letterSpacing: '0.02em',
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--signal)',
      color: 'var(--bg-void)',
    },
    secondary: {
      background: 'transparent',
      color: 'var(--signal)',
      border: '1px solid var(--signal)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
    },
  };

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '10px var(--space-lg)', fontSize: '0.8125rem', minHeight: 44 },
    md: { padding: '12px var(--space-xl)', fontSize: '0.875rem', minHeight: 44 },
    lg: { padding: 'var(--space-lg) var(--space-2xl)', fontSize: '1rem', minHeight: 48 },
  };

  return (
    <button
      style={{ ...baseStyle, ...variants[variant], ...sizes[size], ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
