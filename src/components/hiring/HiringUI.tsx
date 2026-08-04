/* eslint-disable react-refresh/only-export-components */
// Style tokens live beside the components that use them, as in the rest
// of this codebase; splitting them into a separate module would only move
// the import without making anything clearer.
import type { ReactNode, CSSProperties } from 'react';

/* Shared primitives for the hiring surfaces. Same tokens as the rest of the
   app — the hiring layer should read as part of Soft Reset School, not as a
   bolted-on ATS. */

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: 'var(--space-md) var(--space-lg)',
  background: 'var(--bg-void)',
  border: '1px solid var(--bg-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '0.9375rem',
  fontFamily: 'inherit',
  outline: 'none',
};

export const labelStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-display)',
  fontSize: '0.75rem',
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 'var(--space-sm)',
};

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label style={labelStyle} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && (
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            marginTop: 'var(--space-xs)',
            display: 'block',
          }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  id?: string;
}) {
  const descriptionId = description && id ? `${id}-desc` : undefined;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-lg)' }}>
      <div>
        <span style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{label}</span>
        {description && (
          <p id={descriptionId} style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', margin: 0 }}>
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-describedby={descriptionId}
        onClick={() => onChange(!checked)}
        style={{
          width: 44,
          height: 24,
          minHeight: 24,
          borderRadius: 12,
          border: 'none',
          background: checked ? 'var(--signal)' : 'var(--bg-border)',
          position: 'relative',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background var(--transition-fast)',
        }}
      >
        <span
          style={{
            display: 'block',
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: checked ? 'var(--bg-void)' : 'var(--text-tertiary)',
            position: 'absolute',
            top: 3,
            left: checked ? 23 : 3,
            transition: 'left var(--transition-fast)',
          }}
        />
      </button>
    </div>
  );
}

export function Chip({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'signal' | 'gold' | 'rust';
}) {
  const tones: Record<string, { fg: string; border: string }> = {
    neutral: { fg: 'var(--text-secondary)', border: 'var(--bg-border)' },
    signal: { fg: 'var(--signal)', border: 'var(--signal-muted)' },
    gold: { fg: 'var(--gold)', border: 'var(--gold)' },
    rust: { fg: 'var(--rust)', border: 'var(--rust-muted)' },
  };
  const t = tones[tone];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 999,
        border: `1px solid ${t.border}`,
        color: t.fg,
        fontFamily: 'var(--font-display)',
        fontSize: '0.6875rem',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

export function PageHeading({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 'var(--space-2xl)' }}>
      <div style={{ width: 48, height: 4, background: 'var(--signal)', borderRadius: 2, marginBottom: 'var(--space-md)' }} />
      <h1 style={{ fontSize: '1.75rem', marginBottom: subtitle ? 'var(--space-sm)' : 0 }}>{title}</h1>
      {subtitle && <p style={{ color: 'var(--text-secondary)', maxWidth: '60ch' }}>{subtitle}</p>}
      {children}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div
      style={{
        border: '1px dashed var(--bg-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-2xl)',
        textAlign: 'center',
      }}
    >
      <p style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-sm)' }}>{title}</p>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', maxWidth: '48ch', margin: '0 auto' }}>{body}</p>
      {action && <div style={{ marginTop: 'var(--space-xl)' }}>{action}</div>}
    </div>
  );
}

/** Inline status message. `role="status"` so it is announced without stealing focus. */
export function Notice({
  tone,
  children,
}: {
  tone: 'success' | 'error' | 'info';
  children: ReactNode;
}) {
  const colours = {
    success: 'var(--success)',
    error: 'var(--rust)',
    info: 'var(--text-tertiary)',
  } as const;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        padding: 'var(--space-md) var(--space-lg)',
        marginBottom: 'var(--space-xl)',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${colours[tone]}`,
        color: colours[tone],
        fontSize: '0.875rem',
      }}
    >
      {children}
    </div>
  );
}

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ key: T; label: string; badge?: number }>;
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        gap: 'var(--space-sm)',
        marginBottom: 'var(--space-2xl)',
        borderBottom: '1px solid var(--bg-border)',
        paddingBottom: 'var(--space-sm)',
        flexWrap: 'wrap',
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            padding: 'var(--space-sm) var(--space-lg)',
            minHeight: 44,
            background: 'none',
            border: 'none',
            borderBottom: active === tab.key ? '2px solid var(--signal)' : '2px solid transparent',
            color: active === tab.key ? 'var(--signal)' : 'var(--text-tertiary)',
            fontFamily: 'var(--font-display)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            marginBottom: '-1px',
          }}
        >
          {tab.label}
          {tab.badge ? (
            <span
              style={{
                marginLeft: 'var(--space-sm)',
                background: 'var(--signal)',
                color: 'var(--bg-void)',
                borderRadius: 999,
                padding: '0 6px',
                fontSize: '0.6875rem',
              }}
            >
              {tab.badge}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

/**
 * Shown when a form restored unsaved work. Explicit rather than silent — a
 * form that quietly refills itself is confusing; one that says so is a relief.
 */
export function DraftRestoredNotice({ onDiscard }: { onDiscard: () => void }) {
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--space-lg)',
        padding: 'var(--space-sm) var(--space-lg)',
        marginBottom: 'var(--space-lg)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--bg-border)',
        color: 'var(--text-tertiary)',
        fontSize: '0.8125rem',
      }}
    >
      <span>Picked up where you left off.</span>
      <button
        type="button"
        onClick={onDiscard}
        style={{
          color: 'var(--text-secondary)',
          textDecoration: 'underline',
          fontSize: '0.8125rem',
          minHeight: 44,
        }}
      >
        Start fresh
      </button>
    </div>
  );
}
