interface BadgeProps {
  label: string;
  tier?: 'gold' | 'silver' | 'bronze' | 'crystal';
  size?: 'sm' | 'md';
}

const tierColors: Record<string, string> = {
  gold: 'var(--gold)',
  silver: 'var(--silver)',
  bronze: 'var(--bronze)',
  crystal: 'var(--crystal)',
};

export function Badge({ label, tier = 'bronze', size = 'md' }: BadgeProps) {
  const color = tierColors[tier];
  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-xs)',
        padding: isSmall ? '2px 8px' : '4px 12px',
        borderRadius: '999px',
        border: `1px solid ${color}`,
        color,
        fontSize: isSmall ? '0.6875rem' : '0.75rem',
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}
