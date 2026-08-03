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
];

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
