import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, style, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-xl)',
        transition: 'border-color var(--transition-fast)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
});
