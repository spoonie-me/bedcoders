import { useState, useMemo } from 'react';

interface OpenEndedConfig {
  rubric?: string;
  minWords?: number;
  maxWords?: number;
}

interface OpenEndedProps {
  exercise: {
    id: string;
    prompt: string;
    config: OpenEndedConfig;
    hints: string[];
  };
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

export function OpenEnded({ exercise, onSubmit, disabled = false }: OpenEndedProps) {
  const { minWords, maxWords } = exercise.config ?? {};
  const [text, setText] = useState('');

  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  }, [text]);

  const belowMin = minWords !== undefined && wordCount < minWords;
  const aboveMax = maxWords !== undefined && wordCount > maxWords;
  const canSubmit = !disabled && text.trim().length > 0 && !belowMin && !aboveMax;

  const countColor = belowMin
    ? 'var(--warning)'
    : aboveMax
      ? 'var(--error)'
      : 'var(--text-tertiary)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1rem',
          lineHeight: 1.6,
          color: 'var(--text-primary)',
          margin: 0,
        }}
      >
        {exercise.prompt}
      </p>

      <div style={{ position: 'relative' }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          placeholder="Write your answer here..."
          aria-label="Your answer"
          rows={6}
          style={{
            width: '100%',
            padding: 'var(--space-md)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--bg-border)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9375rem',
            lineHeight: 1.7,
            color: 'var(--text-primary)',
            resize: 'vertical',
            minHeight: 120,
            opacity: disabled ? 0.6 : 1,
            transition: 'border-color var(--transition-fast)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            if (!disabled) e.currentTarget.style.borderColor = 'var(--signal)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--bg-border)';
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--space-sm)',
            marginTop: 'var(--space-xs)',
          }}
        >
          <span
            aria-live="polite"
            style={{
              fontFamily: 'var(--font-code)',
              fontSize: '0.75rem',
              color: countColor,
              transition: 'color var(--transition-fast)',
            }}
          >
            {wordCount} word{wordCount !== 1 ? 's' : ''}
            {minWords !== undefined && ` / min ${minWords}`}
            {maxWords !== undefined && ` / max ${maxWords}`}
          </span>
        </div>
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => onSubmit(text.trim())}
        aria-label="Submit answer"
        style={{
          alignSelf: 'flex-start',
          padding: 'var(--space-md) var(--space-xl)',
          background: canSubmit ? 'var(--signal)' : 'var(--bg-border)',
          color: canSubmit ? 'var(--bg-void)' : 'var(--text-tertiary)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-display)',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          transition: 'all var(--transition-fast)',
          letterSpacing: '0.02em',
        }}
      >
        Submit
      </button>
    </div>
  );
}
