import { useState, useMemo } from 'react';
import { Card } from '@/components/Card';

interface Region {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

interface DiagramLabelConfig {
  svgUrl?: string;
  imageUrl?: string;
  regions: Region[];
  labels: string[];
}

interface DiagramLabelProps {
  exercise: {
    id: string;
    prompt: string;
    config: DiagramLabelConfig;
    hints: string[];
  };
  onSubmit: (answer: Record<string, string>) => void;
  disabled?: boolean;
}

export function DiagramLabel({ exercise, onSubmit, disabled = false }: DiagramLabelProps) {
  const { svgUrl, imageUrl, regions = [], labels = [] } = exercise.config ?? {};

  const shuffledLabels = useMemo(
    // eslint-disable-next-line react-hooks/purity
    () => [...labels].sort(() => 0.5 - Math.random()),
    [labels],
  );

  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const usedLabels = new Set(Object.values(placements));
  const allPlaced = Object.keys(placements).length === regions.length;

  const handleLabelClick = (label: string) => {
    if (disabled) return;
    setSelectedLabel(selectedLabel === label ? null : label);
  };

  const handleRegionClick = (regionId: string) => {
    if (disabled || !selectedLabel) return;
    setPlacements((prev) => {
      const next = { ...prev };
      // Remove label from any other region
      for (const [k, v] of Object.entries(next)) {
        if (v === selectedLabel) delete next[k];
      }
      next[regionId] = selectedLabel;
      return next;
    });
    setSelectedLabel(null);
  };

  const removeLabel = (regionId: string) => {
    if (disabled) return;
    setPlacements((prev) => {
      const next = { ...prev };
      delete next[regionId];
      return next;
    });
  };

  const imgSrc = svgUrl || imageUrl;

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
        Select a label below, then click a region on the diagram to place it.
      </p>

      {/* Diagram area */}
      <Card
        style={{
          position: 'relative',
          padding: 0,
          overflow: 'hidden',
          opacity: disabled ? 0.6 : 1,
          minHeight: 300,
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="Diagram"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: 300,
              background: 'var(--bg-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                color: 'var(--text-tertiary)',
              }}
            >
              Diagram placeholder
            </span>
          </div>
        )}

        {/* Region hotspots */}
        {regions.map((region) => {
          const placed = placements[region.id];
          const isHighlighted = selectedLabel !== null && !placed;
          return (
            <button
              key={region.id}
              type="button"
              onClick={() => placed ? removeLabel(region.id) : handleRegionClick(region.id)}
              disabled={disabled || (!selectedLabel && !placed)}
              aria-label={
                placed
                  ? `Region ${region.id}: labeled "${placed}". Click to remove.`
                  : `Region ${region.id}: click to place label`
              }
              style={{
                position: 'absolute',
                left: `${region.x}%`,
                top: `${region.y}%`,
                width: `${region.w}%`,
                height: `${region.h}%`,
                background: placed
                  ? 'rgba(90, 158, 106, 0.25)'
                  : isHighlighted
                    ? 'rgba(240, 240, 236, 0.15)'
                    : 'rgba(240, 240, 236, 0.08)',
                border: placed
                  ? '2px solid var(--success)'
                  : isHighlighted
                    ? '2px dashed var(--signal)'
                    : '1px dashed var(--bg-border)',
                borderRadius: 'var(--radius-sm)',
                cursor: disabled || (!selectedLabel && !placed) ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all var(--transition-fast)',
                padding: 'var(--space-xs)',
              }}
            >
              {placed && (
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    background: 'var(--bg-surface)',
                    padding: '2px var(--space-xs)',
                    borderRadius: 'var(--radius-sm)',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {placed}
                </span>
              )}
            </button>
          );
        })}
      </Card>

      {/* Label bank */}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.6875rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-tertiary)',
            marginBottom: 'var(--space-sm)',
          }}
        >
          Labels
        </div>
        <div
          role="listbox"
          aria-label="Available labels"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-sm)',
          }}
        >
          {shuffledLabels.map((label) => {
            const isUsed = usedLabels.has(label);
            const isActive = selectedLabel === label;
            return (
              <button
                key={label}
                type="button"
                role="option"
                aria-selected={isActive}
                disabled={disabled || isUsed}
                onClick={() => handleLabelClick(label)}
                style={{
                  padding: 'var(--space-xs) var(--space-md)',
                  background: isActive
                    ? 'var(--signal)'
                    : isUsed
                      ? 'var(--bg-elevated)'
                      : 'var(--bg-surface)',
                  color: isActive
                    ? 'var(--bg-void)'
                    : isUsed
                      ? 'var(--text-tertiary)'
                      : 'var(--text-primary)',
                  border: `1px solid ${isActive ? 'var(--signal)' : 'var(--bg-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  cursor: disabled || isUsed ? 'not-allowed' : 'pointer',
                  opacity: isUsed ? 0.4 : 1,
                  textDecoration: isUsed ? 'line-through' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={disabled || !allPlaced}
        onClick={() => onSubmit(placements)}
        aria-label="Submit labels"
        style={{
          alignSelf: 'flex-start',
          padding: 'var(--space-md) var(--space-xl)',
          background: disabled || !allPlaced ? 'var(--bg-border)' : 'var(--signal)',
          color: disabled || !allPlaced ? 'var(--text-tertiary)' : 'var(--bg-void)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-display)',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: disabled || !allPlaced ? 'not-allowed' : 'pointer',
          transition: 'all var(--transition-fast)',
          letterSpacing: '0.02em',
        }}
      >
        Submit
      </button>
    </div>
  );
}
