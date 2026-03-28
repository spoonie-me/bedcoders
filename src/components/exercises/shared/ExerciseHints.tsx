import { useState } from 'react';

interface ExerciseHintsProps {
  hints: string[];
}

export function ExerciseHints({ hints }: ExerciseHintsProps) {
  const [revealedCount, setRevealedCount] = useState(0);

  if (hints.length === 0) return null;

  const allRevealed = revealedCount >= hints.length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-sm)',
        marginTop: 'var(--space-md)',
      }}
    >
      {!allRevealed && (
        <button
          type="button"
          onClick={() => setRevealedCount((c) => c + 1)}
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            padding: 'var(--space-xs) var(--space-sm)',
            background: 'transparent',
            border: '1px solid var(--warning)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--warning)',
            fontFamily: 'var(--font-display)',
            fontSize: '0.75rem',
            fontWeight: 500,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            transition: 'background var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              'rgba(255, 193, 7, 0.08)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
          aria-label={`Show hint ${revealedCount + 1} of ${hints.length}`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          Hint ({revealedCount + 1}/{hints.length})
        </button>
      )}

      {revealedCount > 0 && (
        <div role="log" aria-live="polite" aria-label="Hints">
          {hints.slice(0, revealedCount).map((hint, i) => (
            <div
              key={i}
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                marginBottom: 'var(--space-xs)',
                background: 'var(--bg-elevated)',
                borderLeft: '3px solid var(--warning)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-tertiary)',
                  marginRight: 'var(--space-xs)',
                }}
              >
                Hint {i + 1}
              </span>
              {hint}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
