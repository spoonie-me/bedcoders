import { useEffect, useRef, useState } from 'react';

interface ExerciseTimerProps {
  timeLimit: number;
  onTimeUp: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ExerciseTimer({ timeLimit, onTimeUp }: ExerciseTimerProps) {
  const [remaining, setRemaining] = useState(timeLimit);
  const onTimeUpRef = useRef(onTimeUp);
  useEffect(() => { onTimeUpRef.current = onTimeUp; });

  useEffect(() => {
    setRemaining(timeLimit);
  }, [timeLimit]);

  useEffect(() => {
    if (remaining <= 0) {
      onTimeUpRef.current();
      return;
    }

    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [remaining <= 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const isUrgent = remaining < 60;
  const color = isUrgent ? 'var(--rust)' : 'var(--text-secondary)';

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`${formatTime(remaining)} remaining`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-xs)',
        padding: 'var(--space-xs) var(--space-sm)',
        background: isUrgent ? 'rgba(196, 107, 58, 0.1)' : 'var(--bg-elevated)',
        border: `1px solid ${isUrgent ? 'var(--rust)' : 'var(--bg-border)'}`,
        borderRadius: 'var(--radius-md)',
        transition: `all var(--transition-fast)`,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span
        style={{
          fontFamily: 'var(--font-code)',
          fontSize: '0.875rem',
          fontWeight: 600,
          color,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.04em',
        }}
      >
        {formatTime(remaining)}
      </span>
    </div>
  );
}
