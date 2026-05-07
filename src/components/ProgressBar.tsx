interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({ value, color = 'var(--signal)', height = 8, showLabel = false, label = 'Progress' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', width: '100%' }}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        style={{
          flex: 1,
          height,
          background: 'var(--bg-border)',
          borderRadius: height / 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: '100%',
            background: color,
            borderRadius: height / 2,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      {showLabel && (
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: 36, textAlign: 'right' }}>
          {clamped}%
        </span>
      )}
    </div>
  );
}
