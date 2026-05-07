import { useState, useMemo } from 'react';
import { Card } from '@/components/Card';
import { useDragDrop } from './shared/DragDropContext';

interface SequencingConfig {
  items: string[];
  correctOrder: number[];
}

interface SequencingProps {
  exercise: {
    id: string;
    prompt: string;
    config: SequencingConfig;
    hints: string[];
  };
  onSubmit: (answer: string[]) => void;
  disabled?: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function Sequencing({ exercise, onSubmit, disabled = false }: SequencingProps) {
  const { items = [] } = exercise.config ?? {};

  const shuffled = useMemo(() => shuffle(items), [items]);
  const [ordered, setOrdered] = useState<string[]>(shuffled);

  const { dragHandlers, isDragging } = useDragDrop(ordered, (reordered) => {
    if (!disabled) setOrdered(reordered);
  });

  const moveItem = (from: number, to: number) => {
    if (disabled || to < 0 || to >= ordered.length) return;
    const next = [...ordered];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrdered(next);
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

      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.8125rem',
          color: 'var(--text-tertiary)',
          margin: 0,
        }}
      >
        Drag items or use the arrows to reorder them.
      </p>

      <div
        role="list"
        aria-label="Reorderable sequence"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}
      >
        {ordered.map((item, index) => {
          const handlers = disabled ? {} : dragHandlers(index);
          return (
            <Card
              key={`${item}-${index}`}
              role="listitem"
              aria-label={`Position ${index + 1}: ${item}`}
              {...handlers}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)',
                padding: 'var(--space-sm) var(--space-md)',
                opacity: disabled ? 0.6 : isDragging === index ? 0.4 : 1,
                cursor: disabled ? 'not-allowed' : 'grab',
                transition: 'all var(--transition-fast)',
                ...(handlers.style || {}),
              }}
            >
              {/* Number badge */}
              <span
                style={{
                  flexShrink: 0,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--bg-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}
                aria-hidden="true"
              >
                {index + 1}
              </span>

              {/* Drag handle icon */}
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  color: 'var(--text-tertiary)',
                  fontSize: '0.875rem',
                  lineHeight: 1,
                  userSelect: 'none',
                }}
              >
                &#x2630;
              </span>

              {/* Item text */}
              <span
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  color: 'var(--text-primary)',
                }}
              >
                {item}
              </span>

              {/* Arrow buttons for accessibility */}
              <div style={{ display: 'flex', gap: 'var(--space-xs)', flexShrink: 0 }}>
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  onClick={() => moveItem(index, index - 1)}
                  aria-label={`Move ${item} up`}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--bg-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: disabled || index === 0 ? 'var(--bg-border)' : 'var(--text-secondary)',
                    cursor: disabled || index === 0 ? 'not-allowed' : 'pointer',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    padding: 0,
                  }}
                >
                  &#x25B2;
                </button>
                <button
                  type="button"
                  disabled={disabled || index === ordered.length - 1}
                  onClick={() => moveItem(index, index + 1)}
                  aria-label={`Move ${item} down`}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--bg-border)',
                    borderRadius: 'var(--radius-sm)',
                    color:
                      disabled || index === ordered.length - 1
                        ? 'var(--bg-border)'
                        : 'var(--text-secondary)',
                    cursor:
                      disabled || index === ordered.length - 1 ? 'not-allowed' : 'pointer',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    padding: 0,
                  }}
                >
                  &#x25BC;
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onSubmit(ordered)}
        aria-label="Submit sequence"
        style={{
          alignSelf: 'flex-start',
          padding: 'var(--space-md) var(--space-xl)',
          background: disabled ? 'var(--bg-border)' : 'var(--signal)',
          color: disabled ? 'var(--text-tertiary)' : 'var(--bg-void)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-display)',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all var(--transition-fast)',
          letterSpacing: '0.02em',
        }}
      >
        Submit
      </button>
    </div>
  );
}
