interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-md)',
        padding: 'var(--space-md) var(--space-lg)',
        background: 'rgba(196,107,58,0.1)',
        border: '1px solid var(--error)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-lg)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          color: 'var(--error)',
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--error)',
            cursor: 'pointer',
            fontSize: '1.125rem',
            padding: 0,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
}
