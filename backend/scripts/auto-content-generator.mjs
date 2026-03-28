#!/usr/bin/env node
/**
 * Bedcoders Auto Content Generator
 * Runs twice weekly via cron. Generates a blog post using Claude,
 * saves to DB, schedules social post.
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

// SEO-targeted topics — rotate through these
const TOPIC_ROTATION = [
  { title: 'How to Build Real Apps From Bed Using Claude Code', keywords: 'claude code, coding from bed, AI coding' },
  { title: 'A Complete Guide to the Claude API for Beginners', keywords: 'claude api tutorial, anthropic api, llm api' },
  { title: 'Prompt Engineering Basics: What Actually Works in 2026', keywords: 'prompt engineering course, prompt engineering basics' },
  { title: 'Building With AI When Your Energy Is Limited', keywords: 'coding accessibility, chronic illness developer, low energy coding' },
  { title: 'How I Built a Full-Stack App From My Pillow', keywords: 'build with AI, AI coding tools, coding from bed' },
  { title: 'Claude Code vs Cursor vs Copilot: An Honest Comparison', keywords: 'claude code vs cursor, AI coding tools comparison' },
  { title: 'Getting Started With Claude Code: A Practical Tutorial', keywords: 'claude code tutorial, how to use claude code' },
  { title: 'Coding With Chronic Illness: Real Strategies That Work', keywords: 'coding for disabled, chronic illness developer, remote coding' },
  { title: 'How to Use AI Agents to Write Better Code Faster', keywords: 'AI agents coding, agentic coding, claude agent sdk' },
  { title: 'The Accessible Developer Stack: Tools That Work From Any Position', keywords: 'coding accessibility tools, remote coding setup, bed coding setup' },
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
  // Count existing published/scheduled posts to determine rotation index
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
        content: `Write a practical, opinionated blog post for Bedcoders.com — a platform for developers with chronic illness who code using AI tools like Claude Code.

Title: "${topic.title}"
Target keywords: ${topic.keywords}

Voice: Direct, personal, no fluff. First-person when appropriate. Validates the real constraints of coding with chronic illness. Celebrates building real things from bed. Does NOT romanticise illness — treats constraint as a starting point, not an obstacle.

Format: Markdown. 1200–1500 words. Structure:
- Hook (1-2 sentences that name the real problem)
- 3-5 practical sections with H2 headings
- Real code snippets where relevant (Claude API, Claude Code shell commands, etc.)
- Ending with one concrete thing the reader can do today

Do NOT include: toxic positivity, inspiration porn, "you can overcome this" framing, listicles with 20 points, generic advice that ignores real constraints.

DO include: specific tools, actual commands, honest tradeoffs, constraint-aware tips.

Return ONLY the markdown. No preamble.`,
      },
    ],
  });

  return message.content[0].text;
}

// BlogPost uses authorEmail (no User FK) — no user lookup needed

async function scheduleForNextSlot() {
  // Post on Tuesday and Friday at 9am UTC
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

  // Find next Tuesday (2) or Friday (5)
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

    // Check slug doesn't already exist
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
        metaDescription: `${topic.title} — practical guide for developers coding with AI and chronic illness.`.substring(0, 160),
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
