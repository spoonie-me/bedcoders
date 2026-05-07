// Email sequences for all Roi's projects
// Each sequence is an array of emails sent N days after subscribing

export interface EmailStep {
  step: number;
  delayDays: number; // days after previous step (0 = immediate)
  subject: string;
  html: string;
}

export interface EmailSequence {
  id: string;
  name: string;
  fromName: string;
  fromEmail: string;
  steps: EmailStep[];
}

const SITE = 'https://spooniversity.com';
const UNSUBSCRIBE_URL = 'https://bedcoders.com/api/unsubscribe';

// ─── Spooniversity Launch Sequence ────────────────────────────────────────────
const spooniversityLaunch: EmailSequence = {
  id: 'spooniversity_launch',
  name: 'Spooniversity Launch',
  fromName: 'Roi Shternin',
  fromEmail: 'roi@spooniversity.com',
  steps: [
    {
      step: 0,
      delayDays: 0,
      subject: 'I built something for us',
      html: `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.7; padding: 20px;">
  <p>Hi,</p>

  <p>I have POTS. Most days I work from bed. I've spent the last few years building things — apps, communities, systems — while managing a body that doesn't always cooperate.</p>

  <p>The thing nobody told me when I got sick: <strong>you can still build. You just have to build differently.</strong></p>

  <p>I kept that knowledge to myself for too long. The tools, the shortcuts, the ways to make things work when your energy is limited. The stuff that took me years to figure out.</p>

  <p>So I built Spooniversity.</p>

  <p>It's a learning platform for chronically ill people who want to build things — skills, projects, businesses — on their own terms. Not "despite" illness. Within it.</p>

  <p>It's ready. And I wanted you to be the first to know.</p>

  <p>→ <a href="${SITE}" style="color: #6366f1;">Take a look at Spooniversity</a></p>

  <p>More soon.</p>

  <p>— Roi</p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
  <p style="font-size: 12px; color: #999;">
    You're getting this because you signed up for updates from Roi Shternin.<br>
    <a href="${UNSUBSCRIBE_URL}?email={{EMAIL}}" style="color: #999;">Unsubscribe</a>
  </p>
</div>`,
    },
    {
      step: 1,
      delayDays: 3,
      subject: "Here's what's inside Spooniversity",
      html: `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.7; padding: 20px;">
  <p>Hi,</p>

  <p>A few days ago I told you about Spooniversity. Today I want to show you what's actually inside.</p>

  <p><strong>Spooniversity is for chronically ill people who want to learn, build, and earn — on their own terms.</strong></p>

  <p>Here's what you get:</p>

  <ul style="padding-left: 20px;">
    <li style="margin-bottom: 12px;"><strong>Courses built for your reality</strong> — Paced for bad days. Designed so you can stop and start without losing progress.</li>
    <li style="margin-bottom: 12px;"><strong>Community</strong> — People who get it. No "just push through" energy. Real support from people living the same constraints.</li>
    <li style="margin-bottom: 12px;"><strong>Practical skills</strong> — Things you can actually use: AI tools, building online, managing energy and output.</li>
    <li style="margin-bottom: 12px;"><strong>Your pace. Your schedule.</strong> — No live calls you have to attend. No cohort that moves without you.</li>
  </ul>

  <p>It's <strong>$49</strong>. Not a subscription. You pay once, you're in.</p>

  <p>→ <a href="${SITE}" style="color: #6366f1;">Join Spooniversity</a></p>

  <p>— Roi</p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
  <p style="font-size: 12px; color: #999;">
    <a href="${UNSUBSCRIBE_URL}?email={{EMAIL}}" style="color: #999;">Unsubscribe</a>
  </p>
</div>`,
    },
    {
      step: 2,
      delayDays: 5,
      subject: 'Last thing (I promise)',
      html: `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.7; padding: 20px;">
  <p>Hi,</p>

  <p>I don't want to be that person who sends five emails about the same thing. So this is the last one about Spooniversity for a while.</p>

  <p>Just one honest thing:</p>

  <p>When I was first diagnosed, I spent months looking for resources that understood what it's like to learn and build when your body is unpredictable. I found inspiration porn. I found advice for healthy people. I found nothing for people like us.</p>

  <p>Spooniversity is what I wish had existed.</p>

  <p>If that resonates — <a href="${SITE}" style="color: #6366f1;">it's $49 and the door is open</a>.</p>

  <p>If it's not for you right now, that's fine too. I'll still be here, writing and building.</p>

  <p>— Roi</p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
  <p style="font-size: 12px; color: #999;">
    <a href="${UNSUBSCRIBE_URL}?email={{EMAIL}}" style="color: #999;">Unsubscribe</a>
  </p>
</div>`,
    },
  ],
};

// ─── Bedcoders Welcome Sequence ───────────────────────────────────────────────
const bedcodersWelcome: EmailSequence = {
  id: 'bedcoders_welcome',
  name: 'Bedcoders Welcome',
  fromName: 'Bedcoders',
  fromEmail: 'hello@bedcoders.com',
  steps: [
    {
      step: 0,
      delayDays: 0,
      subject: 'Welcome to Bedcoders',
      html: `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.7; padding: 20px;">
  <p>You're in.</p>

  <p>Bedcoders is for developers who code from bed, the couch, or wherever your body lands today. We use AI tools — Claude Code, the Anthropic API, whatever works — to ship real things within real constraints.</p>

  <p>No hustle culture. No "10x developer" nonsense. Just people building things that matter, in the time and energy they have.</p>

  <p><strong>New posts every Tuesday and Friday.</strong> Practical, specific, written for the way we actually work.</p>

  <p>→ <a href="https://bedcoders.com" style="color: #6366f1;">Start reading at Bedcoders</a></p>

  <p>— Roi</p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
  <p style="font-size: 12px; color: #999;">
    <a href="${UNSUBSCRIBE_URL}?email={{EMAIL}}" style="color: #999;">Unsubscribe</a>
  </p>
</div>`,
    },
  ],
};

// ─── Substack Migration Sequence ─────────────────────────────────────────────
// Sent to the 3,721 imported Substack subscribers.
// One email only: tells them where Roi moved, easy unsubscribe.
// After 3 days, survivors are enrolled in spooniversity_launch automatically.
const substackMigration: EmailSequence = {
  id: 'substack_migration',
  name: 'Substack Migration',
  fromName: 'Roi Shternin',
  fromEmail: 'roi@roishternin.com',
  steps: [
    {
      step: 0,
      delayDays: 0,
      subject: 'I moved (and wanted you to know)',
      html: `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.7; padding: 20px;">
  <p>Hi,</p>

  <p>You're getting this because you subscribed to my Substack newsletter at some point. I wanted to let you know I've moved.</p>

  <p>I'm no longer sending through Substack. My writing, projects, and updates now live on my own platform — which means I own the list, you own your data, and nobody takes a cut.</p>

  <p>Nothing else changes. Same voice. Same irregular writing schedule. Same refusal to send you content just to hit a quota.</p>

  <p>If you'd like to stay on the list, you don't need to do anything. You'll hear from me when I have something worth saying.</p>

  <p>If you'd prefer not to receive emails from me on this new platform, unsubscribe below. No hard feelings, no dark patterns.</p>

  <p>— Roi</p>

  <p style="font-size: 13px; color: #666; margin-top: 30px;">
    P.S. I'm also about to launch something I've been building for a while — a learning platform for chronically ill people who want to build things. If that sounds relevant to you, you'll hear about it soon.
  </p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
  <p style="font-size: 12px; color: #999;">
    You're receiving this because you previously subscribed to Roi Shternin's Substack newsletter.<br>
    Your data is stored securely and never sold or shared.<br>
    <a href="${UNSUBSCRIBE_URL}?email={{EMAIL}}" style="color: #999;">Unsubscribe permanently</a>
  </p>
</div>`,
    },
  ],
};

// ─── Registry ─────────────────────────────────────────────────────────────────
export const SEQUENCES: Record<string, EmailSequence> = {
  spooniversity_launch: spooniversityLaunch,
  bedcoders_welcome: bedcodersWelcome,
  substack_migration: substackMigration,
};

export function getSequence(id: string): EmailSequence | null {
  return SEQUENCES[id] ?? null;
}
