/**
 * Discord REST API helpers for Soft Reset School.
 * Ported from Spooniversity's src/lib/discord.ts pattern (per-track channels,
 * welcome embed on purchase, office-hours embed). Runs serverlessly — no
 * persistent gateway connection needed for channel posts.
 *
 * Deliberately simpler than Spooniversity's version: no role-granting, no
 * Discord-account linking. Bedcoders' User model has no discordUserId field
 * and no OAuth linking flow, and per PRD.md 4.4 the community model is
 * async-first and opt-in rather than access-gated — channels are open, not
 * role-restricted. If role-based gating is wanted later, that requires a
 * schema migration (discordUserId on User) and a linking flow, neither of
 * which exists yet — don't assume it's there.
 *
 * No-ops safely (returns false / does nothing) if DISCORD_BOT_TOKEN or
 * DISCORD_GUILD_ID env vars are missing — this server doesn't exist yet as
 * of 2026-08-04, so every call here is currently a no-op in production. Set
 * both env vars once a real Discord server + bot application are created.
 */

const DISCORD_API = 'https://discord.com/api/v10';
const BOT_TOKEN = () => process.env.DISCORD_BOT_TOKEN || '';
const GUILD_ID = () => process.env.DISCORD_GUILD_ID || '';

// Track slug → Discord channel name. Covers both the original 4 tracks and
// the 4 Soft Reset School tracks (see backend/src/lib/stripe.ts ALL_TRACKS
// for which are currently purchasable — ai-workflow-consulting and
// ai-oversight-health-informatics are seeded here for when they're added
// back to ALL_TRACKS, not because they're sellable today).
const TRACK_CHANNEL_NAMES: Record<string, string> = {
  fundamentals: 'track-code-from-bed',
  ai: 'track-ai-literacy',
  tools: 'track-build-cool-tools',
  advanced: 'track-ai-agents',
  'ai-orchestrated-dev': 'track-ai-assisted-dev',
  'ai-workflow-consulting': 'track-ai-automation-consulting',
  'ai-oversight-health-informatics': 'track-ai-augmented-coding',
  'accessibility-qa-lived-experience': 'track-digital-accessibility-qa',
};

const TRACK_DESCRIPTIONS: Record<string, string> = {
  fundamentals: 'Your first lessons — code from bed, no experience required.',
  ai: 'Directing AI tools well enough that your hours stop capping your output.',
  tools: 'Shipping real, small software fast.',
  advanced: 'Building agentic AI systems that actually work.',
  'ai-orchestrated-dev': 'Directing AI coding tools and catching what they get confidently wrong.',
  'ai-workflow-consulting': 'Designing where AI belongs in a real process — and where it doesn\'t.',
  'ai-oversight-health-informatics': 'Expert-level review of AI-generated clinical records, not entry-level coding.',
  'accessibility-qa-lived-experience': 'Accessibility QA grounded in real assistive-technology use, not a checklist.',
};

// ─── Low-level helpers ───────────────────────────────────────────

async function discordFetch(path: string, init?: RequestInit) {
  const token = BOT_TOKEN();
  if (!token) return null;
  return fetch(`${DISCORD_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

// ─── Channel management ──────────────────────────────────────────

/** Returns the channel ID for a track, creating it if it doesn't exist. */
export async function ensureTrackChannel(trackId: string): Promise<string | null> {
  const token = BOT_TOKEN();
  const guildId = GUILD_ID();
  if (!token || !guildId) return null;

  const channelName = TRACK_CHANNEL_NAMES[trackId];
  if (!channelName) return null;

  const listRes = await discordFetch(`/guilds/${guildId}/channels`);
  if (!listRes?.ok) return null;
  const channels: Array<{ id: string; name: string }> = await listRes.json();

  const existing = channels.find((c) => c.name === channelName);
  if (existing) return existing.id;

  const createRes = await discordFetch(`/guilds/${guildId}/channels`, {
    method: 'POST',
    body: JSON.stringify({
      name: channelName,
      type: 0, // GuildText
      topic: TRACK_DESCRIPTIONS[trackId] ?? '',
    }),
  });
  if (!createRes?.ok) return null;
  const created: { id: string } = await createRes.json();
  return created.id;
}

// ─── Welcome message ─────────────────────────────────────────────

/**
 * Posts a welcome embed to a track's channel. Async-first framing is
 * explicit in the copy itself (PRD.md 4.4), not left as an unstated policy —
 * the focus-group finding was that "optional" community features silently
 * become pressure unless the UI says otherwise.
 */
export async function postWelcomeToTrack(email: string, trackId: string): Promise<void> {
  const token = BOT_TOKEN();
  if (!token) return;

  const channelId = await ensureTrackChannel(trackId);
  if (!channelId) return;

  const trackDesc = TRACK_DESCRIPTIONS[trackId] ?? trackId;

  const embed = {
    title: `Welcome to ${trackId}`,
    description: trackDesc,
    color: 0xd4563b, // rust, matches the redesigned palette
    fields: [
      { name: 'Learning', value: 'Work at your own pace — no deadlines, ever. Nobody tracks whether you post here.', inline: true },
      { name: 'Study Party', value: 'Opt-in matching with 2-3 others on a similar track, whenever you want it — never automatic.', inline: true },
      { name: 'Office Hours', value: 'Optional, text-first, recorded/transcribed if voice.', inline: true },
      { name: 'Questions?', value: 'Ask here whenever — no response-time expectation, this is async by design.', inline: false },
    ],
    footer: { text: `Soft Reset School · ${email}` },
  };

  await discordFetch(`/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ embeds: [embed] }),
  });
}

// ─── Office hours schedule ───────────────────────────────────────

/** Posts an office hours schedule embed to a track channel. */
export async function postOfficeHours(
  trackId: string,
  sessions: Array<{ day: string; time: string; timezone: string }>,
): Promise<void> {
  const channelId = await ensureTrackChannel(trackId);
  if (!channelId) return;

  const embed = {
    title: 'Office Hours This Week',
    description: sessions.map((s) => `**${s.day}** — ${s.time} ${s.timezone}`).join('\n'),
    color: 0xd4563b,
    footer: { text: 'Links posted 30 mins before each session. Recording/transcript posted after for anyone who can\'t attend live.' },
  };

  await discordFetch(`/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ embeds: [embed] }),
  });
}
