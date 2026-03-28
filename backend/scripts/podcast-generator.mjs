#!/usr/bin/env node
/**
 * Bedcoders Podcast Generator
 * Finds published posts without audio, converts to MP3 via ElevenLabs,
 * uploads to Vercel Blob, updates DB record.
 *
 * Usage: node scripts/podcast-generator.mjs
 * Runs automatically after the publish cron job.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob';

const prisma = new PrismaClient();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'kfczssZqSEstD1sFbyma';
const SITE_URL = process.env.SITE_URL || 'https://bedcoders.com';

// Strip markdown for cleaner audio
function stripMarkdown(md) {
  return md
    .replace(/#{1,6}\s/g, '') // headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // bold
    .replace(/\*(.+?)\*/g, '$1') // italic
    .replace(/`{1,3}[^`]*`{1,3}/g, 'code example') // code blocks → spoken label
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links → just text
    .replace(/^[-*+]\s/gm, '') // list bullets
    .replace(/^\d+\.\s/gm, '') // numbered lists
    .replace(/\n{3,}/g, '\n\n') // excess newlines
    .trim();
}

// Add natural podcast intro/outro
function wrapForPodcast(title, content, epNum) {
  const intro = `Welcome to the Bedcoders Podcast. I'm Roi Shternin. This is episode ${epNum}: ${title}.\n\n`;
  const outro = `\n\nThat's it for this episode. If you're coding from bed, from the floor, from wherever your body lets you — you're in the right place. Find the full post and all episodes at bedcoders.com. See you next time.`;
  return intro + content + outro;
}

async function generateAudio(text) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.4,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs error: ${response.status} — ${err}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function getEpisodeNumber() {
  const count = await prisma.blogPost.count({
    where: { podcastPublished: true },
  });
  return count + 1;
}

async function main() {
  try {
    // Find published posts without audio, oldest first
    const posts = await prisma.blogPost.findMany({
      where: {
        status: 'published',
        audioUrl: null,
      },
      orderBy: { publishedAt: 'asc' },
      take: 3, // process max 3 per run to avoid ElevenLabs quota burn
    });

    if (posts.length === 0) {
      console.log('No posts need audio generation.');
      return;
    }

    console.log(`Found ${posts.length} post(s) to convert to audio.`);

    for (const post of posts) {
      console.log(`\nProcessing: "${post.title}"`);

      const epNum = await getEpisodeNumber();
      const cleanText = stripMarkdown(post.content);
      const podcastText = wrapForPodcast(post.title, cleanText, epNum);

      // Truncate to ~4000 chars to stay within ElevenLabs limits per request
      const truncated = podcastText.length > 4000
        ? podcastText.substring(0, 3900) + '... Listen to the full episode at bedcoders.com.'
        : podcastText;

      console.log(`  Generating audio (${truncated.length} chars)...`);
      const audioBuffer = await generateAudio(truncated);

      // Upload to Vercel Blob
      const filename = `bedcoders-ep${epNum}-${post.slug}.mp3`;
      console.log(`  Uploading to blob storage as ${filename}...`);

      const blob = await put(`podcast/${filename}`, audioBuffer, {
        access: 'public',
        contentType: 'audio/mpeg',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      // Update DB
      await prisma.blogPost.update({
        where: { id: post.id },
        data: {
          audioUrl: blob.url,
          podcastPublished: true,
          podcastEpNum: epNum,
          podcastDuration: Math.ceil(truncated.length / 15), // ~15 chars/sec estimate
        },
      });

      console.log(`  ✅ Episode ${epNum} ready: ${blob.url}`);
    }

  } catch (err) {
    console.error('Podcast generation error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
