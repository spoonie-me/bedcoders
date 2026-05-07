import { useState, useMemo } from 'react';
import { Card } from '@/components/Card';

interface CategorizationConfig {
  categories: string[];
  items: { text: string; category: string }[];
}

interface CategorizationProps {
  exercise: {
    id: string;
    prompt: string;
    config: CategorizationConfig;
    hints: string[];
  };
  onSubmit: (answer: Record<string, string[]>) => void;
  disabled?: boolean;
}

export function Categorization({ exercise, onSubmit, disabled = false }: CategorizationProps) {
  const { categories = [], items = [] } = exercise.config ?? {};

  const shuffled = useMemo(
    // eslint-disable-next-line react-hooks/purity
    () => [...items].sort(() => 0.5 - Math.random()),
    [items],
  );

  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const unassigned = shuffled.filter((i) => !(i.text in assignments));
  const categoryBuckets: Record<string, string[]> = {};
  for (const cat of categories) categoryBuckets[cat] = [];
  for (const [text, cat] of Object.entries(assignments)) {
    if (categoryBuckets[cat]) categoryBuckets[cat].push(text);
  }

  const handleItemClick = (text: string) => {
    if (disabled) return;
    setSelectedItem(selectedItem === text ? null : text);
  };

  const handleCategoryClick = (category: string) => {
    if (disabled || !selectedItem) return;
    setAssignments((prev) => ({ ...prev, [selectedItem]: category }));
    setSelectedItem(null);
  };

  const removeFromCategory = (text: string) => {
    if (disabled) return;
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[text];
      return next;
    });
  };

  const allAssigned = Object.keys(assignments).length === items.length;

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
        Click an item, then click a category to place it.
      </p>

      {/* Unassigned items */}
      {unassigned.length > 0 && (
        <div
          role="listbox"
          aria-label="Items to categorize"
          style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}
        >
          {unassigned.map(({ text }) => {
            const isActive = selectedItem === text;
            return (
              <Card
                key={text}
                role="option"
                aria-selected={isActive}
                tabIndex={disabled ? -1 : 0}
                onClick={() => handleItemClick(text)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(text);
                  }
                }}
                style={{
                  padding: 'var(--space-xs) var(--space-md)',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  borderColor: isActive ? 'var(--signal)' : 'var(--bg-border)',
                  background: isActive ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                  opacity: disabled ? 0.6 : 1,
                  transition: 'all var(--transition-fast)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  {text}
                </span>
              </Card>
            );
          })}
        </div>
      )}

      {/* Category buckets */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(categories.length, 3)}, 1fr)`,
          gap: 'var(--space-md)',
        }}
      >
        {categories.map((cat) => (
          <Card
            key={cat}
            role="group"
            aria-label={`Category: ${cat}`}
            tabIndex={selectedItem ? 0 : -1}
            onClick={() => handleCategoryClick(cat)}
            onKeyDown={(e) => {
              if (selectedItem && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                handleCategoryClick(cat);
              }
            }}
            style={{
              padding: 'var(--space-md)',
              cursor: selectedItem && !disabled ? 'pointer' : 'default',
              borderColor: selectedItem ? 'var(--signal)' : 'var(--bg-border)',
              borderStyle: selectedItem ? 'dashed' : 'solid',
              minHeight: 120,
              transition: 'all var(--transition-fast)',
            }}
          >
            <h4
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-sm)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {cat}
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
              {categoryBuckets[cat].map((text) => (
                <span
                  key={text}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-xs)',
                    padding: '2px var(--space-sm)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--bg-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.8125rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  {text}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCategory(text);
                      }}
                      aria-label={`Remove ${text} from ${cat}`}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      &times;
                    </button>
                  )}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <button
        type="button"
        disabled={disabled || !allAssigned}
        onClick={() => onSubmit(categoryBuckets)}
        aria-label="Submit categorization"
        style={{
          alignSelf: 'flex-start',
          padding: 'var(--space-md) var(--space-xl)',
          background: disabled || !allAssigned ? 'var(--bg-border)' : 'var(--signal)',
          color: disabled || !allAssigned ? 'var(--text-tertiary)' : 'var(--bg-void)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-display)',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: disabled || !allAssigned ? 'not-allowed' : 'pointer',
          transition: 'all var(--transition-fast)',
          letterSpacing: '0.02em',
        }}
      >
        Submit
      </button>
    </div>
  );
}
