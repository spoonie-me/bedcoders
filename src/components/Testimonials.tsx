import { TESTIMONIALS } from '@/data/testimonials';

const TRACK_COLORS: Record<string, string> = {
  fundamentals: 'var(--signal)',
  ai: 'var(--rust)',
  tools: 'var(--gold)',
  advanced: 'var(--crystal)',
};

const TRACK_NAMES: Record<string, string> = {
  fundamentals: 'Code from Bed',
  ai: 'AI Literacy',
  tools: 'Build Cool Tools',
  advanced: 'AI Agents',
};

export function Testimonials() {
  return (
    <section style={{ padding: 'var(--space-3xl) var(--space-xl)', background: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 'var(--space-sm)' }}>Career outcomes you can reach</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)' }}>
          Illustrative examples of the transitions our curriculum is designed to support.
        </p>

        <div className="grid-2">
          {TESTIMONIALS.filter((t) => t.approved).slice(0, 4).map((t) => {
            const color = TRACK_COLORS[t.track] ?? 'var(--signal)';
            return (
              <div
                key={t.id}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--bg-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-xl)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-md)',
                }}
              >
                {/* Avatar + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: color,
                    color: 'var(--bg-void)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    flexShrink: 0,
                  }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: '0.9375rem', margin: 0 }}>{t.name}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', margin: 0 }}>{t.role}</p>
                  </div>
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '0.6875rem',
                    fontFamily: 'var(--font-display)',
                    color: color,
                    border: `1px solid ${color}`,
                    borderRadius: '999px',
                    padding: '2px 8px',
                    whiteSpace: 'nowrap',
                  }}>
                    {TRACK_NAMES[t.track]}
                  </span>
                </div>

                {/* Outcome */}
                <p style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>
                  {t.outcome}
                </p>

                {/* Quote */}
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
            );
          })}
        </div>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-xl)', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
          Want to share your story?{' '}
          <a href="/share-story" style={{ color: 'var(--signal)', textDecoration: 'none' }}>Tell us what changed for you &rarr;</a>
        </p>
        <p style={{ textAlign: 'center', marginTop: 'var(--space-md)', fontSize: '0.75rem', color: 'var(--text-tertiary)', opacity: 0.6 }}>
          Personas are illustrative examples based on typical career transitions. Individual results will vary.
        </p>
      </div>
    </section>
  );
}
