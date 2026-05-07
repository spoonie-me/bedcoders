import { useState } from 'react';
import { Card } from '@/components/Card';

interface MultipleChoiceConfig {
  options: Array<string | { id: string; text: string }>;
  correctIndex?: number;
  correctId?: string;
  multiSelect?: boolean;
}

interface MultipleChoiceProps {
  exercise: {
    id: string;
    prompt: string;
    config: MultipleChoiceConfig;
    hints: string[];
  };
  onSubmit: (answer: number | number[] | string | string[]) => void;
  disabled?: boolean;
}

export function MultipleChoice({ exercise, onSubmit, disabled = false }: MultipleChoiceProps) {
  const { options: rawOptions, multiSelect } = exercise.config ?? {};
  // Normalize options: support both string[] and {id, text}[]
  const options = Array.isArray(rawOptions)
    ? rawOptions.map((o) => (typeof o === 'string' ? o : o.text))
    : [];
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    if (disabled) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (multiSelect) {
        if (next.has(index)) next.delete(index);
        else next.add(index);
      } else {
        next.clear();
        next.add(index);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (selected.size === 0) return;
    const indices = Array.from(selected).sort();
    // If original options are {id, text} objects, submit id(s); otherwise submit index(es)
    const hasIds = rawOptions.length > 0 && typeof rawOptions[0] === 'object';
    if (hasIds) {
      const ids = indices.map((i) => (rawOptions[i] as { id: string }).id);
      onSubmit(multiSelect ? ids : ids[0]);
    } else {
      onSubmit(multiSelect ? indices : indices[0]);
    }
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

      <div
        role="group"
        aria-label={multiSelect ? 'Select all that apply' : 'Select one option'}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}
      >
        {options.map((option, i) => {
          const isSelected = selected.has(i);
          return (
            <Card
              key={i}
              role={multiSelect ? 'checkbox' : 'radio'}
              aria-checked={isSelected}
              aria-label={`Option ${i + 1}: ${option}`}
              tabIndex={disabled ? -1 : 0}
              onClick={() => toggle(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggle(i);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)',
                padding: 'var(--space-md) var(--space-lg)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                borderColor: isSelected ? 'var(--signal)' : 'var(--bg-border)',
                background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                opacity: disabled ? 0.6 : 1,
                transition: 'all var(--transition-fast)',
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 20,
                  height: 20,
                  borderRadius: multiSelect ? 'var(--radius-sm)' : '50%',
                  border: `2px solid ${isSelected ? 'var(--signal)' : 'var(--bg-border)'}`,
                  background: isSelected ? 'var(--signal)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all var(--transition-fast)',
                }}
                aria-hidden="true"
              >
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6L5 8.5L9.5 4"
                      stroke="var(--bg-void)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  lineHeight: 1.5,
                  color: 'var(--text-primary)',
                }}
              >
                {option}
              </span>
            </Card>
          );
        })}
      </div>

      <button
        type="button"
        disabled={disabled || selected.size === 0}
        onClick={handleSubmit}
        aria-label="Submit answer"
        style={{
          alignSelf: 'flex-start',
          padding: 'var(--space-md) var(--space-xl)',
          background: disabled || selected.size === 0 ? 'var(--bg-border)' : 'var(--signal)',
          color: disabled || selected.size === 0 ? 'var(--text-tertiary)' : 'var(--bg-void)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-display)',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: disabled || selected.size === 0 ? 'not-allowed' : 'pointer',
          transition: 'all var(--transition-fast)',
          letterSpacing: '0.02em',
        }}
      >
        Submit
      </button>
    </div>
  );
}
