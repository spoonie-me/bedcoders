/**
 * prerender.mjs — build-time static route pre-generation
 *
 * Copies the Vite SPA shell (dist/index.html) into each public marketing
 * route as dist/<route>/index.html. Vercel's filesystem handler then serves
 * these directly, returning real HTTP 200s with the correct path. Anything
 * NOT in this list (or not a known app route in vercel.json) gets a genuine
 * HTTP 404 — fixing the soft-404 problem from the SPA catch-all rewrite.
 *
 * Also generates dist/404.html so Vercel can serve the SPA's NotFound page
 * with a real 404 status code.
 */

import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dir, '..', 'dist');
const SHELL = join(DIST, 'index.html');

if (!existsSync(SHELL)) {
  console.error('❌  dist/index.html not found — run vite build first');
  process.exit(1);
}

// Public marketing routes to prerender as real static files.
// Each becomes dist/<route>/index.html.
// Authenticated app routes (/dashboard, /lesson/*, etc.) are handled
// by vercel.json → SPA fallback, NOT prerendered.
const PUBLIC_ROUTES = [
  // Core marketing
  'pricing',
  'for-teams',
  'welcome',
  'share-story',

  // Auth (low-content but indexable)
  'signup',
  'login',

  // Blog index + all posts
  'blog',
  'blog/what-is-ai-literacy',
  'blog/build-your-first-ai-app',
  'blog/coding-with-chronic-illness',
  'blog/prompt-engineering-guide',

  // Legal / compliance
  'imprint',
  'privacy',
  'terms',
  'cookies',
  'dpa',
];

let count = 0;
for (const route of PUBLIC_ROUTES) {
  const dir = join(DIST, route);
  mkdirSync(dir, { recursive: true });
  copyFileSync(SHELL, join(dir, 'index.html'));
  count++;
}

// 404 fallback — Vercel serves this with a real HTTP 404 for unknown routes.
copyFileSync(SHELL, join(DIST, '404.html'));

console.log(`✓ prerender: ${count} routes + 404.html`);
