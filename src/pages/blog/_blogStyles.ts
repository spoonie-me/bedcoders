import type { CSSProperties } from 'react';

export const p: CSSProperties = {
  color: 'var(--text-secondary)',
  lineHeight: 1.75,
  marginBottom: 'var(--space-lg)',
  fontSize: '1rem',
};

export const h2: CSSProperties = {
  fontSize: '1.375rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginTop: 'var(--space-3xl)',
  marginBottom: 'var(--space-md)',
};

export const h3: CSSProperties = {
  fontSize: '1.125rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginTop: 'var(--space-2xl)',
  marginBottom: 'var(--space-sm)',
};

export const ul: CSSProperties = {
  paddingLeft: 'var(--space-xl)',
  marginBottom: 'var(--space-lg)',
  color: 'var(--text-secondary)',
  lineHeight: 1.75,
};

export const hr: CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--bg-border)',
  margin: 'var(--space-3xl) 0',
};

export const callout: CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--bg-border)',
  borderLeft: '3px solid var(--signal)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-lg) var(--space-xl)',
  marginBottom: 'var(--space-2xl)',
};

export const faqItem: CSSProperties = {
  borderTop: '1px solid var(--bg-border)',
  paddingTop: 'var(--space-xl)',
  marginBottom: 'var(--space-xl)',
};
