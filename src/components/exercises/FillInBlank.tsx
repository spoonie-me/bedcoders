import { useState, useMemo } from 'react';

interface FillInBlankConfig {
  template?: string;
  blanks?: { answer: string; alternatives?: string[] }[];
  acceptableAnswers?: string[];
}

interface FillInBlankProps {
  exercise: {
    id: string;
    prompt: string;
    config: FillInBlankConfig;
    hints: string[];
  };
  onSubmit: (answer: string[]) => void;
  disabled?: boolean;
}

export function FillInBlank({ exercise, onSubmit, disabled = false }: FillInBlankProps) {
  const cfg = (exercise.config as FillInBlankConfig) ?? {};
  const template = cfg.template ?? '';
  const blanks = cfg.blanks ?? [];
  // Simple mode: seed data with acceptableAnswers (no template) → single text input
  const isSimpleMode = !template && blanks.length === 0;
  const [answers, setAnswers] = useState<string[]>(() => isSimpleMode ? [''] : blanks.map(() => ''));

  const parts = useMemo(() => (isSimpleMode ? [''] : template.split('{{___}}')), [template, isSimpleMode]);

  const allFilled = answers.every((a) => a.trim().length > 0);
  const canSubmit = !disabled && allFilled;

  const updateAnswer = (index: number, value: string) => {
    if (disabled) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  if (isSimpleMode) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>
          {exercise.prompt}
        </p>
        <input
          type="text"
          value={answers[0]}
          onChange={(e) => updateAnswer(0, e.target.value)}
          disabled={disabled}
          placeholder="Type your answer..."
          aria-label="Your answer"
          style={{
            padding: 'var(--space-md)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--bg-border)',
            borderBottom: '2px solid var(--signal)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9375rem',
            color: 'var(--text-primary)',
            outline: 'none',
            opacity: disabled ? 0.6 : 1,
          }}
        />
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => onSubmit([answers[0].trim()])}
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

      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1rem',
          lineHeight: 2.2,
          color: 'var(--text-primary)',
          padding: 'var(--space-lg)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--bg-border)',
          borderRadius: 'var(--radius-md)',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < blanks.length && (
              <input
                type="text"
                value={answers[i]}
                onChange={(e) => updateAnswer(i, e.target.value)}
                disabled={disabled}
                aria-label={`Blank ${i + 1} of ${blanks.length}`}
                placeholder={`blank ${i + 1}`}
                style={{
                  display: 'inline-block',
                  width: Math.max(80, (answers[i].length || 8) * 9),
                  maxWidth: 240,
                  padding: 'var(--space-xs) var(--space-sm)',
                  margin: '0 var(--space-xs)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--bg-border)',
                  borderBottom: '2px solid var(--signal)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color var(--transition-fast)',
                  verticalAlign: 'baseline',
                }}
                onFocus={(e) => {
                  if (!disabled) e.currentTarget.style.borderColor = 'var(--signal)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--bg-border)';
                }}
              />
            )}
          </span>
        ))}
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => onSubmit(answers.map((a) => a.trim()))}
        aria-label="Submit answers"
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
