/* ─── Shared presentational components for interactive lesson templates ───
 * Components only — the constants, hooks and style objects they build on
 * live in ./a11y so this file stays fast-refresh clean.
 */
import { VERDICT_CORRECT, VERDICT_NOT_QUITE, secondaryActionButtonStyle } from './a11y';

/** The verdict as real, visible, screen-reader-available text.
 * WCAG 1.4.1 (Use of Colour, Level A): before this existed, whether the
 * learner got it right was carried only by the panel's green-vs-rust wash
 * and an aria-hidden ✓/→ glyph, so a screen-reader user got no indication
 * at all. Rendered BEFORE the feedback prose so it is heard first. */
export function Verdict({ correct }: { correct: boolean }) {
  return (
    <p
      style={{
        margin: '0 0 var(--space-xs)',
        fontWeight: 600,
        fontFamily: 'var(--font-display)',
        fontSize: '0.6875rem',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: correct ? 'var(--success)' : 'var(--text-tertiary)',
      }}
    >
      {correct ? VERDICT_CORRECT : VERDICT_NOT_QUITE}
    </p>
  );
}

/** Consistent, low-pressure "start over" control — every template that can
 * end in a "wrong" state offers this once the answer is revealed, so
 * getting it wrong is never a dead end. */
export function TryAgainButton({ onClick, label = 'Try again ↺' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} style={{ ...secondaryActionButtonStyle, marginBottom: 'var(--space-lg)' }}>
      {label}
    </button>
  );
}

/** Small uppercase label naming a revealed panel ("The concept", "Answer",
 * "Rubric"). Real text, so screen readers announce what the panel is rather
 * than leaving it to the colour wash. */
export function PanelLabel({ children, color = 'var(--signal)' }: { children: React.ReactNode; color?: string }) {
  return (
    <p
      style={{
        margin: '0 0 var(--space-xs)',
        fontWeight: 600,
        color,
        fontFamily: 'var(--font-display)',
        fontSize: '0.6875rem',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}
    >
      {children}
    </p>
  );
}
