#!/usr/bin/env node
// Rewrites lessonCount / totalMinutes in src/data/trackCatalog.ts from the
// seed data, which is the source of truth for what a learner actually gets.
//
// These two numbers sit next to the €69 price on every track page and feed
// the credential depth gate (src/data/credentialBar.ts), so a stale value is
// not cosmetic — it is either a false claim about the product or a track on
// sale that shouldn't be. src/data/__tests__/credentialBar.test.ts fails the
// build when they drift; this script is how you fix that in one step after
// adding curriculum.
//
//   node scripts/sync-catalog-counts.mjs          # rewrite
//   node scripts/sync-catalog-counts.mjs --check  # exit 1 if out of date
//
// Not a full generator: domain outlines and exam config are still authored by
// hand in trackCatalog.ts. Those are prose and policy; these are arithmetic.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const seedRoot = path.join(root, 'backend/prisma/seed-data/domains');
const catalogPath = path.join(root, 'src/data/trackCatalog.ts');
const checkOnly = process.argv.includes('--check');

/** Sum published lessons and minutes for one track from its seed data. */
function depthFor(trackSlug) {
  const trackDir = path.join(seedRoot, trackSlug);
  if (!fs.existsSync(trackDir)) return null;

  let lessonCount = 0;
  let totalMinutes = 0;
  for (const entry of fs.readdirSync(trackDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const lessonsFile = path.join(trackDir, entry.name, 'lessons.json');
    if (!fs.existsSync(lessonsFile)) continue;
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(lessonsFile, 'utf8'));
    } catch {
      // A file being written right now isn't a reason to abort the sync —
      // skip it and report, so the counts reflect the content that is
      // actually readable. In CI (--check) the tree is clean and any
      // unparseable file will fail the test suite loudly instead.
      console.warn(`  ! skipped unparseable ${path.relative(root, lessonsFile)}`);
      continue;
    }
    const lessons = Array.isArray(parsed) ? parsed : (parsed.lessons ?? []);
    lessonCount += lessons.length;
    totalMinutes += lessons.reduce((sum, l) => sum + (l.duration ?? 0), 0);
  }
  return { lessonCount, totalMinutes };
}

let source = fs.readFileSync(catalogPath, 'utf8');
const original = source;
const drift = [];

// Each track object starts with `slug: '<id>',`; its lessonCount and
// totalMinutes are the first such fields that follow.
for (const match of original.matchAll(/slug: '([^']+)',/g)) {
  const slug = match[1];
  const depth = depthFor(slug);
  if (!depth) continue;

  const start = source.indexOf(`slug: '${slug}',`);
  const nextSlug = source.indexOf('slug: \'', start + 10);
  const end = nextSlug === -1 ? source.length : nextSlug;
  const block = source.slice(start, end);

  const updated = block
    .replace(/lessonCount: (\d+),/, (m, n) => {
      if (Number(n) !== depth.lessonCount) drift.push(`${slug}: lessonCount ${n} → ${depth.lessonCount}`);
      return `lessonCount: ${depth.lessonCount},`;
    })
    .replace(/totalMinutes: (\d+),/, (m, n) => {
      if (Number(n) !== depth.totalMinutes) drift.push(`${slug}: totalMinutes ${n} → ${depth.totalMinutes}`);
      return `totalMinutes: ${depth.totalMinutes},`;
    });

  source = source.slice(0, start) + updated + source.slice(end);
}

// The backend keeps its own copy of the same numbers (it decides whether
// checkout is allowed and must not read the filesystem to do it). Rewrite it
// from the same source so the two can never disagree.
const depthPath = path.join(root, 'backend/src/lib/credentialBar.ts');
let depthSource = fs.readFileSync(depthPath, 'utf8');
const depthOriginal = depthSource;

depthSource = depthSource.replace(
  /^(\s*)('?)([a-z0-9-]+)\2: \{ lessonCount: (\d+), totalMinutes: (\d+) \},$/gm,
  (line, indent, quote, trackSlug, lessons, minutes) => {
    const depth = depthFor(trackSlug);
    if (!depth) return line;
    if (Number(lessons) !== depth.lessonCount || Number(minutes) !== depth.totalMinutes) {
      drift.push(
        `${trackSlug}: backend depth ${lessons}/${minutes} → ${depth.lessonCount}/${depth.totalMinutes}`,
      );
    }
    return `${indent}${quote}${trackSlug}${quote}: { lessonCount: ${depth.lessonCount}, totalMinutes: ${depth.totalMinutes} },`;
  },
);

if (drift.length === 0) {
  console.log('trackCatalog.ts and backend/credentialBar.ts are in sync with the seed data.');
  process.exit(0);
}

if (checkOnly) {
  console.error('trackCatalog.ts is out of date:\n  ' + drift.join('\n  '));
  console.error('\nRun: node scripts/sync-catalog-counts.mjs');
  process.exit(1);
}

if (source !== original) fs.writeFileSync(catalogPath, source);
if (depthSource !== depthOriginal) fs.writeFileSync(depthPath, depthSource);
console.log('Updated:\n  ' + drift.join('\n  '));
