interface ExerciseFeedbackProps {
  feedback?: string;
  score?: number;
  explanation?: string;
}

export function ExerciseFeedback({ feedback, score, explanation }: ExerciseFeedbackProps) {
  if (!feedback && score === undefined && !explanation) return null;

  const scoreColor =
    score !== undefined
      ? score >= 70
        ? 'var(--success)'
        : 'var(--rust)'
      : undefined;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)',
        marginTop: 'var(--space-lg)',
      }}
    >
      {score !== undefined && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontWeight: 700,
              color: scoreColor,
              lineHeight: 1,
            }}
          >
            {score}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              color: 'var(--text-tertiary)',
            }}
          >
            / 100
          </span>
        </div>
      )}

      {feedback && (
        <div
          style={{
            padding: 'var(--space-md)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--bg-border)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9375rem',
            lineHeight: 1.6,
            color: 'var(--text-primary)',
          }}
        >
          {feedback}
        </div>
      )}

      {explanation && (
        <div
          style={{
            padding: 'var(--space-md)',
            background: 'var(--bg-elevated)',
            borderLeft: `3px solid var(--signal)`,
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
          }}
        >
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-display)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-tertiary)',
              marginBottom: 'var(--space-xs)',
            }}
          >
            Explanation
          </span>
          {explanation}
        </div>
      )}
    </div>
  );
}
