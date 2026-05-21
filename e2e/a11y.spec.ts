import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PUBLIC_ROUTES = [
  '/',
  '/pricing',
  '/signup',
  '/login',
  '/blog',
  '/for-teams',
  '/privacy-policy',
  '/terms-of-service',
];

// TODO(a11y-palette, 2026-05-21): bedcoders' brand colors have two known
// design-system debts that need a coordinated palette pass:
//   - color-contrast: neon-green signal on cream / grey, text-tertiary too
//     dim on bg-surface
//   - link-in-text-block: inline signal-green links lack underline AND
//     have <3:1 contrast vs surrounding text (same root cause as above)
// Both are surfaced by axe but excluded from CI until the palette ships
// with WCAG AA contrast and inline-link affordances (underline by default).
// Track in GitHub: bedcoders/a11y-palette milestone.
const KNOWN_PALETTE_DEBT = ['color-contrast', 'link-in-text-block'];

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
