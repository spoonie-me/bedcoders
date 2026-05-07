import { useState } from 'react';

interface TrueFalseJustifyConfig {
  statement: string;
  correctAnswer: boolean;
  justificationRequired?: boolean;
  rubric?: string;
}

interface TrueFalseJustifyProps {
  exercise: {
    id: string;
    prompt: string;
    config: TrueFalseJustifyConfig;
    hints: string[];
  };
  onSubmit: (answer: { value: boolean; justification?: string }) => void;
  disabled?: boolean;
}

export function TrueFalseJustify({ exercise, onSubmit, disabled = false }: TrueFalseJustifyProps) {
  const { statement, justificationRequired } = exercise.config ?? {};
  const [selected, setSelected] = useState<boolean | null>(null);
  const [justification, setJustification] = useState('');

  const needsJustification = justificationRequired && selected !== null;
  const canSubmit =
    !disabled &&
    selected !== null &&
    (!justificationRequired || justification.trim().length > 0);

  const handleSelect = (value: boolean) => {
    if (disabled) return;
    setSelected(selected === value ? null : value);
  };

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

      {/* Statement card */}
      <div
        style={{
          padding: 'var(--space-lg) var(--space-xl)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--bg-border)',
          borderLeft: '3px solid var(--gold)',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-body)',
          fontSize: '1.0625rem',
          lineHeight: 1.7,
          color: 'var(--text-primary)',
          fontStyle: 'italic',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        &ldquo;{statement}&rdquo;
      </div>

      {/* True/False toggles */}
      <div
        role="radiogroup"
        aria-label="True or False"
        style={{
          display: 'flex',
          gap: 'var(--space-md)',
        }}
      >
        {[true, false].map((value) => {
          const isSelected = selected === value;
          const label = value ? 'True' : 'False';
          const activeColor = value ? 'var(--success)' : 'var(--rust)';
          return (
            <button
              key={String(value)}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={label}
              tabIndex={disabled ? -1 : 0}
              onClick={() => handleSelect(value)}
              disabled={disabled}
              style={{
                flex: 1,
                padding: 'var(--space-lg) var(--space-xl)',
                background: isSelected ? activeColor : 'var(--bg-surface)',
                color: isSelected ? 'var(--bg-void)' : 'var(--text-secondary)',
                border: `2px solid ${isSelected ? activeColor : 'var(--bg-border)'}`,
                borderRadius: 'var(--radius-lg)',
                fontFamily: 'var(--font-display)',
                fontSize: '1.125rem',
                fontWeight: 600,
                letterSpacing: '0.02em',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all var(--transition-fast)',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Justification textarea */}
      {needsJustification && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          <label
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-tertiary)',
            }}
          >
            Justify your answer
          </label>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            disabled={disabled}
            placeholder="Explain why you chose this answer..."
            aria-label="Justification"
            rows={4}
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
              minHeight: 80,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color var(--transition-fast)',
            }}
            onFocus={(e) => {
              if (!disabled) e.currentTarget.style.borderColor = 'var(--signal)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--bg-border)';
            }}
          />
        </div>
      )}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() =>
          onSubmit({
            value: selected!,
            justification: justificationRequired ? justification.trim() : undefined,
          })
        }
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
