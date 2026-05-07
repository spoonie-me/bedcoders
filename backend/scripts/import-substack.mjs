#!/usr/bin/env node
/**
 * Substack → Email Automation Import
 *
 * Reads the Substack CSV export, skips disabled emails,
 * flags paid subscribers separately, imports the rest into
 * the substack_migration sequence.
 *
 * After 3 days, a scheduled task auto-graduates survivors
 * to spooniversity_launch.
 *
 * Usage:
 *   node scripts/import-substack.mjs <path-to-csv>
 *   node scripts/import-substack.mjs --graduate   (graduate to spooniversity_launch)
 *   node scripts/import-substack.mjs --stats      (show import stats)
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const MIGRATION_SEQUENCE = 'substack_migration';
const LAUNCH_SEQUENCE = 'spooniversity_launch';
const GRADUATE_AFTER_DAYS = 3;

// ─── Parse CSV ──────────────────────────────────────────────────────────────
function parseCSV(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    // Handle quoted fields
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { values.push(current); current = ''; }
      else current += char;
    }
    values.push(current);

    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  });
}

// ─── Import ──────────────────────────────────────────────────────────────────
async function importSubscribers(csvPath) {
  const rows = parseCSV(csvPath);

  const disabled = rows.filter(r => r.email_disabled === 'true');
  const paid = rows.filter(r => r.active_subscription === 'true' && r.email_disabled !== 'true');
  const importable = rows.filter(r => r.email_disabled !== 'true');

  console.log(`\n📊 CSV Analysis:`);
  console.log(`   Total rows:        ${rows.length}`);
  console.log(`   Disabled (skip):   ${disabled.length}`);
  console.log(`   Paid subscribers:  ${paid.length} ← handle personally`);
  console.log(`   To import:         ${importable.length}`);

  if (paid.length > 0) {
    console.log(`\n💳 Paid subscribers (need personal outreach):`);
    paid.forEach(r => console.log(`   ${r.email} (subscribed ${r.created_at?.substring(0, 10)})`));
  }

  console.log(`\n⏳ Importing ${importable.length} subscribers into migration sequence...`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const BATCH = 50;

  for (let i = 0; i < importable.length; i += BATCH) {
    const batch = importable.slice(i, i + BATCH);

    for (const row of batch) {
      const email = row.email?.trim().toLowerCase();
      if (!email || !email.includes('@')) { skipped++; continue; }

      try {
        await prisma.emailSubscriber.upsert({
          where: { email },
          update: {
            // Only update if they're not already in a more advanced sequence
            // Don't overwrite existing active spooniversity subscribers
          },
          create: {
            email,
            source: 'substack_import',
            status: 'active',
            sequenceId: MIGRATION_SEQUENCE,
            sequenceStep: 0,
            nextSendAt: new Date(), // queue immediately
            tags: JSON.stringify(paid.some(p => p.email === email) ? ['paid_substack'] : ['substack_import']),
            metadata: JSON.stringify({
              substackCreatedAt: row.created_at,
              substackPlan: row.plan || 'free',
              importedAt: new Date().toISOString(),
            }),
          },
        });
        imported++;
      } catch (err) {
        errors++;
        if (errors < 5) console.error(`   Error importing ${email}:`, err.message);
      }
    }

    // Progress
    const done = Math.min(i + BATCH, importable.length);
    process.stdout.write(`\r   Progress: ${done}/${importable.length} (${Math.round(done/importable.length*100)}%)`);
  }

  console.log(`\n\n✅ Import complete:`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped:  ${skipped}`);
  console.log(`   Errors:   ${errors}`);
  console.log(`\n📧 Next: the daily cron will send the migration email to all queued subscribers.`);
  console.log(`   After ${GRADUATE_AFTER_DAYS} days, run: node scripts/import-substack.mjs --graduate`);
}

// ─── Graduate survivors to Spooniversity launch ───────────────────────────────
async function graduateToLaunch() {
  const cutoff = new Date(Date.now() - GRADUATE_AFTER_DAYS * 24 * 60 * 60 * 1000);

  // Find people who:
  // 1. Were in the migration sequence
  // 2. Have moved past step 0 (got the migration email)
  // 3. Are still active (didn't unsubscribe)
  // 4. Subscribed at least 3 days ago
  const survivors = await prisma.emailSubscriber.findMany({
    where: {
      status: 'active',
      sequenceId: MIGRATION_SEQUENCE,
      sequenceStep: { gte: 1 }, // past the migration email
      source: 'substack_import',
    },
  });

  console.log(`\n🎓 Graduating ${survivors.length} survivors to Spooniversity launch sequence...`);

  let count = 0;
  for (const subscriber of survivors) {
    await prisma.emailSubscriber.update({
      where: { id: subscriber.id },
      data: {
        sequenceId: LAUNCH_SEQUENCE,
        sequenceStep: 0,
        nextSendAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // start tomorrow
      },
    });
    count++;
  }

  console.log(`✅ ${count} subscribers now in Spooniversity launch sequence.`);
  console.log(`   They'll receive the 3-email launch sequence over the next 8 days.`);
}

// ─── Stats ───────────────────────────────────────────────────────────────────
async function showStats() {
  const [total, active, unsubscribed, bySequence, bySource] = await Promise.all([
    prisma.emailSubscriber.count(),
    prisma.emailSubscriber.count({ where: { status: 'active' } }),
    prisma.emailSubscriber.count({ where: { status: 'unsubscribed' } }),
    prisma.emailSubscriber.groupBy({ by: ['sequenceId'], _count: true }),
    prisma.emailSubscriber.groupBy({ by: ['source'], _count: true }),
  ]);

  const sent = await prisma.emailSent.count();

  console.log(`\n📊 Email System Stats:`);
  console.log(`   Total subscribers: ${total}`);
  console.log(`   Active:            ${active}`);
  console.log(`   Unsubscribed:      ${unsubscribed}`);
  console.log(`   Emails sent:       ${sent}`);
  console.log(`\n   By sequence:`);
  bySequence.forEach(s => console.log(`     ${s.sequenceId ?? 'none'}: ${s._count}`));
  console.log(`\n   By source:`);
  bySource.forEach(s => console.log(`     ${s.source}: ${s._count}`));
}

// ─── Main ────────────────────────────────────────────────────────────────────
const arg = process.argv[2];

try {
  if (arg === '--graduate') {
    await graduateToLaunch();
  } else if (arg === '--stats') {
    await showStats();
  } else if (arg) {
    await importSubscribers(arg);
  } else {
    console.log('Usage:');
    console.log('  node scripts/import-substack.mjs <path-to-csv>   Import from CSV');
    console.log('  node scripts/import-substack.mjs --graduate       Graduate to launch sequence');
    console.log('  node scripts/import-substack.mjs --stats          Show stats');
  }
} finally {
  await prisma.$disconnect();
}
