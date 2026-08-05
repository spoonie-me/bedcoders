import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PUBLIC_ROUTES = [
  '/',
  '/pricing',
  '/signup',
  '/login',
  '/blog',
  '/for-teams',
  '/about',
  '/employers',
  '/privacy',
  '/terms',
  '/cookies',
  // Catalogue + track detail. These are the first product (rather than
  // marketing) surfaces this suite covers.
  '/tracks',
  '/tracks/ai-orchestrated-dev',
];

// ─── KNOWN, UNADDRESSED COVERAGE GAP ───
// Everything above is a PUBLIC route. The actual product — /lesson/:id and
// the eight guess-first lesson templates it renders (ConceptFlow,
// DiagnoseMechanism, SpotFlaw, SequenceIt, BuildIt, EvidenceStack,
// PredictNumber, PromptBuild), plus /dashboard — sits behind authentication,
// and this harness has no way to log in: there is no seeded test account, no
// storageState fixture, and no auth-bypass hook in the app.
//
// So the lesson UI is NOT axe-checked by this suite. That is a real gap, not
// an oversight, and it is where the accessibility risk is highest: the
// templates are interactive, they mount and unmount panels, and they move
// focus. The 2026-08-05 screen-reader walkthrough found colour-only
// correctness feedback, focus dropped to document.body on every option
// selection, and a SequenceIt widget that was unusable by ear — none of
// which this file would have caught.
//
// Closing it needs a test-only authenticated session (seeded user +
// Playwright storageState, or a dev-mode login route), which is out of scope
// here. Until that exists, the lesson templates are covered only by the
// jsdom unit tests in
// src/components/lesson-templates/__tests__/GuessFirstTemplates.test.tsx —
// which assert focus and text semantics but CANNOT assert colour contrast or
// touch-target size, because jsdom performs no layout.

// The 2026-05-21 palette debt (color-contrast, link-in-text-block) is
// resolved as of the Soft Reset School redesign (2026-08-03) - verified by
// actually running this suite with the exclusion removed, not just assumed.
// Fixed: every color pair checked against its real background with WCAG
// math (not just the page background — Card/Button components render on
// bg-surface/bg-elevated, which needed their own verification), plus 7
// inline links found relying on an inline `textDecoration: 'none'` that a
// global stylesheet underline rule can never override.
const KNOWN_PALETTE_DEBT: string[] = [];

for (const route of PUBLIC_ROUTES) {
  test(`a11y: ${route} has no serious or critical WCAG violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(KNOWN_PALETTE_DEBT)
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(
      blocking,
      blocking.map((v) => `${v.id} (${v.impact}): ${v.help}`).join('\n'),
    ).toEqual([]);
  });
}

test('keyboard navigation: Tab reaches the primary CTA on /', async ({ page }) => {
  await page.goto('/');
  // Tab a handful of times and check that the focused element is interactive.
  for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? { tag: el.tagName, role: el.getAttribute('role') } : null;
  });
  expect(focused).not.toBeNull();
  expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focused!.tag);
});
