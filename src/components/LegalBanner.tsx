interface LegalBannerProps {
  message: string;
}

export function LegalBanner({ message }: LegalBannerProps) {
  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--bg-border)',
        padding: 'var(--space-md) var(--space-xl)',
        textAlign: 'center',
        color: 'var(--text-tertiary)',
        fontSize: '0.75rem',
        fontFamily: 'var(--font-display)',
      }}
    >
      {message}
    </div>
  );
}
