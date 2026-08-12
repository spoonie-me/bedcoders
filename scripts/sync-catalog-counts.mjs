/* Syncs every track's lessonCount/totalMinutes in src/data/trackCatalog.ts to
 * match what's actually authored in the seed data right now. Run this before
 * every commit that touches seed-data content — with agents landing lessons
 * continuously, doing this field-by-field by hand is a losing race.
 *
 *   node scripts/sync-catalog-counts.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { runAudit } from './curriculum-audit.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = join(ROOT, 'src', 'data', 'trackCatalog.ts');

const { tracks } = runAudit();
let src = readFileSync(CATALOG, 'utf-8');
let changed = 0;

for (const t of tracks) {
  const marker = `slug: '${t.track}',`;
  const idx = src.indexOf(marker);
  if (idx === -1) continue;
  const windowEnd = idx + 4000;
  let window = src.slice(idx, windowEnd);

  const lcMatch = /lessonCount:\s*\d+,/.exec(window);
  const tmMatch = /totalMinutes:\s*\d+,/.exec(window);
  if (!lcMatch || !tmMatch) continue;

  const newLc = `lessonCount: ${t.authoredLessons},`;
  const newTm = `totalMinutes: ${t.authoredMinutes},`;
  if (lcMatch[0] !== newLc || tmMatch[0] !== newTm) changed += 1;

  window = window.slice(0, lcMatch.index) + newLc + window.slice(lcMatch.index + lcMatch[0].length);
  const tmMatch2 = /totalMinutes:\s*\d+,/.exec(window);
  window = window.slice(0, tmMatch2.index) + newTm + window.slice(tmMatch2.index + tmMatch2[0].length);

  src = src.slice(0, idx) + window + src.slice(windowEnd);
}

writeFileSync(CATALOG, src, 'utf-8');
console.log(`Synced ${changed} track(s) in trackCatalog.ts`);
for (const t of tracks) {
  console.log(`  ${t.track}: ${t.authoredLessons} lessons, ${t.authoredMinutes} min`);
}
