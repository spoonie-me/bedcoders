#!/usr/bin/env node
/**
 * Bedcoders Auto Content Generator
 * Runs twice weekly via cron. Generates a blog post in Roi's voice using Claude.
 *
 * Usage: node scripts/auto-content-generator.mjs
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Topics that live at the intersection of constraint, code, and chronic illness
const TOPIC_ROTATION = [
  { title: 'How to Build Real Apps From Bed Using Claude Code', keywords: 'claude code, coding from bed, AI coding' },
  { title: 'The Spoon Theory of Software: Shipping When Energy Is Finite', keywords: 'spoon theory developer, energy management coding, chronic illness developer' },
  { title: 'Prompt Engineering Is a Disability Accommodation', keywords: 'prompt engineering, AI accessibility, coding with chronic illness' },
  { title: 'Why I Stopped Apologising for My Coding Setup', keywords: 'coding from bed, disabled developer, adaptive coding setup' },
  { title: 'Building With AI When Your Body Has Other Plans', keywords: 'AI coding tools, coding accessibility, low energy development' },
  { title: 'Claude Code vs Cursor vs Copilot: What Actually Matters When You Have 2 Hours', keywords: 'claude code vs cursor, AI coding tools comparison, productivity' },
  { title: 'The Minimum Viable Developer Setup', keywords: 'minimalist dev setup, coding accessibility, AI tools' },
  { title: 'When Your Brain Works Differently: Cognitive Accessibility in Code', keywords: 'cognitive accessibility, ADHD coding, brain fog developer' },
  { title: 'How I Shipped a SaaS From a Hospital Bed', keywords: 'coding with illness, build in public, AI productivity' },
  { title: 'Rest Is Not the Opposite of Productivity — It Is Productivity', keywords: 'developer burnout, rest as strategy, sustainable coding' },
];

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function getNextTopic() {
  const count = await prisma.blogPost.count({
    where: { status: { in: ['published', 'scheduled'] } },
  });
  return TOPIC_ROTATION[count % TOPIC_ROTATION.length];
}

async function generatePost(topic) {
  console.log(`Generating post: "${topic.title}"...`);

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are ghostwriting a blog post for Roi Shternin — author, keynote speaker, and founder of Bedcoders.com. Roi has POTS (Postural Orthostatic Tachycardia Syndrome) and codes from bed using AI tools. He thinks in constraints — not "despite" limitations but "within" them.

Write a blog post for Bedcoders.com.

Title: "${topic.title}"
Target keywords: ${topic.keywords}

ROI'S VOICE — follow these closely:
- First person, always. "I", not "one" or "we"
- Short sentences. White space. Breath between thoughts.
- Direct observations, not generic advice. Name the real thing.
- Both/and thinking — "I am exhausted AND I shipped something today"
- Constraint is the starting point, not the villain. It's where clarity lives.
- Specific, not vague. Tools, commands, real situations.
- Never inspirational-poster energy. No "you've got this!" No "just push through."
- Occasional dry humour. Not jokes — just honest observations that happen to be funny.
- The reader is a developer with chronic illness or disability. Treat them like a peer, not a patient.

FORMAT — Markdown, 1000–1400 words:
- Opening: 2–3 sentences that name the exact situation (not a question, not a hook — a statement of fact)
- 3–4 sections with H2 headings
- At least one real code snippet or specific tool command where it fits naturally
- Closing: one concrete thing the reader can do today — specific, low-energy, doable

DO NOT include:
- Toxic positivity or inspiration porn
- "Anyone can do this!" framing
- Long intros warming up to the point
- Bullet lists of 8+ items
- Generic SEO padding

Return ONLY the markdown. No preamble, no "Here is the post:" — just the content.`,
      },
    ],
  });

  return message.content[0].text;
}

async function scheduleForNextSlot() {
  // Post on Tuesday and Friday at 9am UTC
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

  let daysUntilNext;
  if (day < 2) daysUntilNext = 2 - day;
  else if (day < 5) daysUntilNext = 5 - day;
  else daysUntilNext = 9 - day; // next Tuesday

  const scheduled = new Date(now);
  scheduled.setUTCDate(now.getUTCDate() + daysUntilNext);
  scheduled.setUTCHours(9, 0, 0, 0);
  return scheduled;
}

async function main() {
  try {
    const topic = await getNextTopic();
    const content = await generatePost(topic);
    const slug = generateSlug(topic.title);
    const scheduledFor = await scheduleForNextSlot();

    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) {
      console.log(`Post with slug "${slug}" already exists. Skipping.`);
      return;
    }

    const post = await prisma.blogPost.create({
      data: {
        title: topic.title,
        slug,
        content,
        excerpt: content.split('\n').find(l => l.length > 80 && !l.startsWith('#'))?.substring(0, 200) || '',
        metaTitle: topic.title.substring(0, 60),
        metaDescription: `${topic.title} — from Bedcoders, the community for developers with chronic illness.`.substring(0, 160),
        keywords: topic.keywords,
        authorEmail: 'hello@bedcoders.com',
        status: 'scheduled',
        scheduledFor,
      },
    });

    console.log(`✅ Post scheduled: "${post.title}"`);
    console.log(`   Slug: ${post.slug}`);
    console.log(`   Publishes: ${scheduledFor.toISOString()}`);
    console.log(`   ID: ${post.id}`);

  } catch (err) {
    console.error('Error generating post:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
