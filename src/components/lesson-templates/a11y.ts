/* ─── Shared accessibility primitives for interactive lesson templates ───
 * Extracted from GuessFirstTemplates.tsx when the depth templates
 * (worked-example, retrieval-check, case-sim, lab-brief) landed, so the
 * accessibility guarantees below have exactly one implementation instead
 * of one per template file.
 *
 * The guarantees, per the spoonie-accessibility guidelines:
 *   - every interactive control meets the 48x48px minimum touch target;
 *   - every reveal moves keyboard/screen-reader focus onto the newly-shown
 *     panel rather than stranding it on a control that just unmounted
 *     (WCAG 2.4.3);
 *   - correctness is always stated in real text, never carried by a colour
 *     wash plus an aria-hidden glyph (WCAG 1.4.1);
 *   - anything that can end in a "wrong" state offers a no-penalty retry,
 *     and the retry returns focus to the question rather than to
 *     document.body.
 */
import { useEffect, useRef } from 'react';

// 48x48px is the spoonie-accessibility minimum touch target — motor
// control (tremor, joint pain, one-handed phone use) makes anything
// smaller a real barrier, not a cosmetic nitpick.
export const MIN_TOUCH = 48;

/** Moves focus onto a newly-revealed panel the moment it appears, so a
 * keyboard or screen-reader user isn't stranded at a control that just
 * disappeared from the DOM. The target must have tabIndex={-1}. */
export function useRevealFocus<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (active) ref.current?.focus();
  }, [active]);
  return ref;
}

/** Mirror image of useRevealFocus, for the "Try again" path. reset()
 * unmounts the panel that holds the Try Again button, so without this the
 * browser drops focus onto document.body — which strands a keyboard or
 * screen-reader user back at the top of the page and makes the control
 * built so a wrong answer isn't a dead end into a dead end itself.
 *
 * Pass the expression that is true exactly when the widget is in its
 * pristine, pre-answer state. Focus is moved only on a RE-entry into that
 * state (never on first mount), so the target must have tabIndex={-1}. */
export function useReturnFocus<T extends HTMLElement>(atInitialState: boolean) {
  const ref = useRef<T | null>(null);
  const hasLeftInitialState = useRef(false);
  useEffect(() => {
    if (!atInitialState) {
      hasLeftInitialState.current = true;
      return;
    }
    if (hasLeftInitialState.current) {
      hasLeftInitialState.current = false;
      ref.current?.focus();
    }
  }, [atInitialState]);
  return ref;
}

/** Focus target for the question/prompt block a "Try again" returns to.
 * tabIndex={-1} keeps it out of the Tab order; the outline is suppressed
 * because it is only ever reached programmatically. */
export const questionBlockFocusStyle: React.CSSProperties = { flex: 1, outline: 'none' };

/** Visually hidden but present for assistive tech — real text in the DOM,
 * which aria-label alone would not give (and which braille displays and
 * "read from here" navigation need). Mirrors globals.css .sr-only. */
export const visuallyHidden: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
};

/* Deliberately gentle wording. The product never says "Wrong" or
 * "Incorrect" to a learner, and the not-quite glyph is a grey arrow rather
 * than a red cross on purpose — keep it that way. */
export const VERDICT_CORRECT = 'Correct';
export const VERDICT_NOT_QUITE = 'Not quite';

export const optionButtonStyle: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  border: '1px solid var(--bg-border)',
  borderRadius: 'var(--radius-sm)',
  padding: '12px 20px',
  minHeight: MIN_TOUCH,
  fontSize: '0.9375rem',
  fontFamily: 'inherit',
  cursor: 'pointer',
};

export const primaryActionButtonStyle: React.CSSProperties = {
  background: 'var(--signal)',
  color: 'var(--bg-void)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  padding: '12px 22px',
  minHeight: MIN_TOUCH,
  fontSize: '0.875rem',
  fontFamily: 'var(--font-display)',
  fontWeight: 500,
  cursor: 'pointer',
};

export const secondaryActionButtonStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--signal)',
  border: '1px solid var(--signal)',
  borderRadius: 'var(--radius-sm)',
  padding: '12px 22px',
  minHeight: MIN_TOUCH,
  fontSize: '0.875rem',
  fontFamily: 'inherit',
  fontWeight: 500,
  cursor: 'pointer',
};

/** Focusable wrapper for a revealed panel — tabIndex={-1} keeps it out of
 * normal Tab order (it's not a control) while still being a valid
 * programmatic focus target. outline is suppressed since this is never
 * reached by Tab, only by useRevealFocus. */
export const revealPanelFocusStyle: React.CSSProperties = { outline: 'none' };

/** Outer frame every template shares: bordered card, question band on top,
 * revealed panels stacked underneath. */
export const templateFrameStyle: React.CSSProperties = {
  border: '1px solid var(--bg-border)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
  marginBottom: 'var(--space-xl)',
};

/** The gold-washed band that holds the prompt before anything is revealed. */
export const questionBandStyle: React.CSSProperties = {
  background: 'rgba(201,168,76,0.07)',
  padding: 'var(--space-lg) var(--space-xl)',
};
