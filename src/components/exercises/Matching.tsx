import { useState, useMemo } from 'react';
import { Card } from '@/components/Card';

interface MatchingConfig {
  pairs: { left: string; right: string }[];
  distractors?: { right: string[] };
}

interface MatchingProps {
  exercise: {
    id: string;
    prompt: string;
    config: MatchingConfig;
    hints: string[];
  };
  onSubmit: (answer: Record<string, string>) => void;
  disabled?: boolean;
}

const PAIR_COLORS = [
  'var(--rust)',
  'var(--gold)',
  'var(--success)',
  'var(--signal)',
  'var(--warning)',
  'var(--error)',
  '#7c6fdb',
  '#4db6ac',
];

export function Matching({ exercise, onSubmit, disabled = false }: MatchingProps) {
  const { pairs = [], distractors } = exercise.config ?? {};

  const leftItems = useMemo(() => pairs.map((p) => p.left), [pairs]);
  const rightItems = useMemo(() => {
    const rights = pairs.map((p) => p.right);
    if (distractors?.right) rights.push(...distractors.right);
    // Shuffle deterministically by exercise id
    return [...rights].sort(() => 0.5 - Math.random());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairs, distractors]);

  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const matchedRights = new Set(Object.values(matches));

  const getColor = (left: string): string | undefined => {
    const idx = Object.keys(matches).indexOf(left);
    return idx >= 0 ? PAIR_COLORS[idx % PAIR_COLORS.length] : undefined;
  };

  const getRightColor = (right: string): string | undefined => {
    const entry = Object.entries(matches).find(([, r]) => r === right);
    if (!entry) return undefined;
    return getColor(entry[0]);
  };

  const handleLeftClick = (left: string) => {
    if (disabled) return;
    if (selectedLeft === left) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(left);
    }
  };

  const handleRightClick = (right: string) => {
    if (disabled || !selectedLeft) return;
    setMatches((prev) => {
      const next = { ...prev };
      // Remove any previous match for this right item
      for (const [k, v] of Object.entries(next)) {
        if (v === right) delete next[k];
      }
      next[selectedLeft] = right;
      return next;
    });
    setSelectedLeft(null);
  };

  const clearMatch = (left: string) => {
    if (disabled) return;
    setMatches((prev) => {
      const next = { ...prev };
      delete next[left];
      return next;
    });
  };

  const allMatched = Object.keys(matches).length === leftItems.length;

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
        Click an item on the left, then click its match on the right.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--space-lg)',
        }}
      >
        {/* Left column */}
        <div
          role="listbox"
          aria-label="Left items"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}
        >
          {leftItems.map((left) => {
            const isMatched = left in matches;
            const isActive = selectedLeft === left;
            const color = getColor(left);
            return (
              <Card
                key={left}
                role="option"
                aria-selected={isActive}
                aria-label={`Left item: ${left}${isMatched ? `, matched to ${matches[left]}` : ''}`}
                tabIndex={disabled ? -1 : 0}
                onClick={() => handleLeftClick(left)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleLeftClick(left);
                  }
                }}
                style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  borderColor: isActive
                    ? 'var(--signal)'
                    : color || 'var(--bg-border)',
                  borderLeftWidth: isMatched ? 3 : 1,
                  borderLeftColor: color,
                  background: isActive ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                  opacity: disabled ? 0.6 : 1,
                  transition: 'all var(--transition-fast)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9375rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  {left}
                </span>
                {isMatched && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearMatch(left);
                    }}
                    aria-label={`Clear match for ${left}`}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-tertiary)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: '0 var(--space-xs)',
                      lineHeight: 1,
                    }}
                  >
                    &times;
                  </button>
                )}
              </Card>
            );
          })}
        </div>

        {/* Right column */}
        <div
          role="listbox"
          aria-label="Right items"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}
        >
          {rightItems.map((right) => {
            const isUsed = matchedRights.has(right);
            const color = getRightColor(right);
            return (
              <Card
                key={right}
                role="option"
                aria-selected={false}
                aria-disabled={isUsed}
                aria-label={`Right item: ${right}${isUsed ? ' (matched)' : ''}`}
                tabIndex={disabled || isUsed ? -1 : 0}
                onClick={() => !isUsed && handleRightClick(right)}
                onKeyDown={(e) => {
                  if (!isUsed && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleRightClick(right);
                  }
                }}
                style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  cursor: disabled || isUsed ? 'not-allowed' : selectedLeft ? 'pointer' : 'default',
                  borderColor: color || 'var(--bg-border)',
                  borderLeftWidth: isUsed ? 3 : 1,
                  borderLeftColor: color,
                  background: isUsed ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                  opacity: disabled ? 0.6 : isUsed ? 0.5 : 1,
                  transition: 'all var(--transition-fast)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9375rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  {right}
                </span>
              </Card>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={disabled || !allMatched}
        onClick={() => onSubmit(matches)}
        aria-label="Submit matches"
        style={{
          alignSelf: 'flex-start',
          padding: 'var(--space-md) var(--space-xl)',
          background: disabled || !allMatched ? 'var(--bg-border)' : 'var(--signal)',
          color: disabled || !allMatched ? 'var(--text-tertiary)' : 'var(--bg-void)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-display)',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: disabled || !allMatched ? 'not-allowed' : 'pointer',
          transition: 'all var(--transition-fast)',
          letterSpacing: '0.02em',
        }}
      >
        Submit
      </button>
    </div>
  );
}
