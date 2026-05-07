import { Card } from '@/components/Card';
import { SEO } from '@/components/SEO';

const ADVISORS = [
  // Learner perspective
  {
    name: 'Sarah Chen',
    role: 'The Lazy Coder',
    emoji: '🛏️',
    color: 'var(--signal)',
    bio: 'Freelance designer turned part-time developer. Works from bed 3 days/week due to chronic fatigue. Wants to ship tools fast — without grinding through theory.',
    priority: '"Show me working code in 5 minutes, not 5 hours of explanation."',
    perspective: 'learner',
    recommendations: [
      'Keep lessons 10–15 min max. If I can\'t finish it before fatigue hits, I won\'t start.',
      'Lead with the thing I\'ll build, then teach the why. Theory without context doesn\'t stick.',
      'Make it resumable. I need to stop mid-lesson and pick up exactly where I left off.',
      'No streak penalties. My body doesn\'t care about my XP streak.',
    ],
  },
  {
    name: 'Marcus',
    role: 'The Career Switcher',
    emoji: '🚀',
    color: 'var(--rust)',
    bio: 'Former salesperson, completely new to coding. Works from bed on bad pain days. Needs portfolio proof — not just knowledge.',
    priority: '"I need real projects for my portfolio. I need proof I learned something."',
    perspective: 'learner',
    recommendations: [
      'Certificates and portfolio links front and center — that\'s the ROI I\'m selling to employers.',
      'Every track should end with something I shipped. Not just exercises — a real thing.',
      'Celebrate small wins explicitly. The "beginner shame" thing is real and I\'ve almost quit because of it.',
      'Tell me what role this gets me. Abstract skills aren\'t motivating. "Ship a Claude API tool" is.',
    ],
  },
  {
    name: 'Alex',
    role: 'The AI Native',
    emoji: '🤖',
    color: 'var(--gold)',
    bio: 'Product manager who uses Claude daily. Tech-savvy but no formal AI training. Wants depth — not hype.',
    priority: '"Skip the hype. Teach me the model\'s actual limits and how to work around them."',
    perspective: 'learner',
    recommendations: [
      'Show failure cases. I learn more from "here\'s why this prompt fails" than from polished demos.',
      'Be honest about hallucinations. Most AI content glosses over this. Don\'t.',
      'Go deep on prompt engineering. Not surface-level tips — the actual mechanics.',
      'Assume I know nothing about the code, but treat me like an intelligent adult.',
    ],
  },
  // Instructor perspective
  {
    name: 'Dr. Jamie Rodriguez',
    role: 'Curriculum Designer',
    emoji: '📐',
    color: 'var(--crystal)',
    bio: 'Former computer science teacher with 15 years designing adult education. Disability advocate. Believes scaffolding and accessibility aren\'t optional.',
    priority: '"Every lesson must have clear learning objectives and measure if they\'re met."',
    perspective: 'instructor',
    recommendations: [
      'Map every lesson to Bloom\'s Taxonomy. Foundation = Remember/Understand. Application = Apply/Analyze. Mastery = Evaluate/Create.',
      'Accessibility first: transcripts for every video, alt text for every diagram, keyboard navigation everywhere.',
      'No gatekeeping — assume zero prior knowledge at the start of every track.',
      'Representation matters: use examples featuring chronically ill and disabled people as protagonists, not as edge cases.',
      'Progressive difficulty is non-negotiable. You can\'t skip scaffolding. You can\'t learn functions before you understand variables.',
    ],
  },
  // Business perspective
  {
    name: 'Elena Vasquez',
    role: 'Growth & Product Lead',
    emoji: '📈',
    color: 'var(--green)',
    bio: 'Founder/operator experience. Cares about retention and unit economics. Thinks most course platforms are broken by design.',
    priority: '"Every feature and pricing decision should ask: does this keep people engaged?"',
    perspective: 'business',
    recommendations: [
      'Make the free tier feel valuable — not a dead-end ad for the paid tier. Generous free tier = trust = conversion.',
      'Price for your audience: people coding from bed, disabled folks, career switchers. Not Silicon Valley.',
      '€12/month is the sweet spot. Sticky enough to not think about, low enough to not feel guilty.',
      'Churn prevention starts at onboarding. The first 15 minutes determine whether someone comes back.',
      'Track completion rates, not sign-up rates. That\'s the real product metric.',
    ],
  },
];

const DECISIONS = [
  {
    question: 'How long should lessons be?',
    votes: [
      { advisor: 'Sarah', vote: '10 min max. I bail on 30-min videos.', color: 'var(--signal)' },
      { advisor: 'Dr. Jamie', vote: '15 min optimal. Long enough to scaffold, short enough to retain.', color: 'var(--crystal)' },
      { advisor: 'Elena', vote: '15 min gets the most completions. Drop-off starts at 20 min.', color: 'var(--green)' },
    ],
    decision: '15 minutes target. 10–20 min acceptable. Micro-pods of 5 min within lessons.',
  },
  {
    question: 'Free tier: how generous?',
    votes: [
      { advisor: 'Sarah', vote: 'One full lesson — enough to know if I\'m into it.', color: 'var(--signal)' },
      { advisor: 'Marcus', vote: 'Show me the certificate I\'ll earn. Make it feel reachable.', color: 'var(--rust)' },
      { advisor: 'Elena', vote: 'Generous free tier converts better. Don\'t make it feel like a dead end.', color: 'var(--green)' },
    ],
    decision: 'Free tier: 1 full lesson per track (user chooses which track). No card required.',
  },
  {
    question: 'Should we gate content by score?',
    votes: [
      { advisor: 'Sarah', vote: 'Let me skip hard theory and jump to projects.', color: 'var(--signal)' },
      { advisor: 'Dr. Jamie', vote: 'Scaffolding matters. Foundation must be earned before Application.', color: 'var(--crystal)' },
      { advisor: 'Elena', vote: 'If people skip, some will fail on later challenges. Tier-based gating at 70%.', color: 'var(--green)' },
    ],
    decision: 'Foundation tier always open. Application and Mastery unlock at 70% of previous tier. Users can ask for help.',
  },
  {
    question: 'Pricing: subscription vs. one-time?',
    votes: [
      { advisor: 'Marcus', vote: 'I need to see ROI first. One-time is safer when you\'re not sure.', color: 'var(--rust)' },
      { advisor: 'Alex', vote: '€12/month is fine if the content is actually good.', color: 'var(--gold)' },
      { advisor: 'Elena', vote: '€12/month is sticky. Annual discount drives retention. One Pro tier for simplicity.', color: 'var(--green)' },
    ],
    decision: '€12/month or €120/year. One Pro tier. Free tier generous. Team seats at €15/user/month.',
  },
];

export function Advisors() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 'var(--space-4xl) var(--space-xl)' }}>
      <SEO
        title="Board of Advisors — Bedcoders"
        description="Meet the advisory board that shapes Bedcoders: learner, instructor, and business perspectives on curriculum and pricing."
        canonical="/advisors"
      />

      {/* Header */}
      <div style={{ marginBottom: 'var(--space-4xl)' }}>
        <p style={{ color: 'var(--signal)', fontFamily: 'var(--font-display)', fontSize: '0.8125rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 'var(--space-md)' }}>
          Board of Advisors
        </p>
        <h1 style={{ fontSize: '2.25rem', lineHeight: 1.15, marginBottom: 'var(--space-lg)' }}>
          The voices that shape<br />
          <span style={{ color: 'var(--signal)' }}>what we build.</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', maxWidth: 600 }}>
          Every product decision at Bedcoders gets weighed against three perspectives: the learner who needs it, the instructor who designs it, and the operator who has to make it sustainable. Here's who those voices are.
        </p>
      </div>

      {/* Learner perspective */}
      <section style={{ marginBottom: 'var(--space-4xl)' }}>
        <h2 style={{ marginBottom: 'var(--space-sm)', fontSize: '1.5rem' }}>Learner Perspective</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)', fontSize: '0.9375rem' }}>
          Three real user archetypes. Their constraints shape every feature decision.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-xl)' }}>
          {ADVISORS.filter(a => a.perspective === 'learner').map(advisor => (
            <Card key={advisor.name} style={{ borderTop: `3px solid ${advisor.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                <span style={{ fontSize: '2rem' }}>{advisor.emoji}</span>
                <div>
                  <h3 style={{ fontSize: '1rem', margin: 0 }}>{advisor.name}</h3>
                  <p style={{ color: advisor.color, fontSize: '0.8125rem', margin: 0, fontFamily: 'var(--font-display)' }}>{advisor.role}</p>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 'var(--space-lg)' }}>
                {advisor.bio}
              </p>
              <p style={{ fontStyle: 'italic', color: 'var(--text-tertiary)', fontSize: '0.875rem', borderLeft: `2px solid ${advisor.color}`, paddingLeft: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                {advisor.priority}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {advisor.recommendations.map((rec, i) => (
                  <li key={i} style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <span style={{ color: advisor.color, flexShrink: 0, marginTop: 2 }}>→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* Instructor perspective */}
      <section style={{ marginBottom: 'var(--space-4xl)' }}>
        <h2 style={{ marginBottom: 'var(--space-sm)', fontSize: '1.5rem' }}>Instructor Perspective</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)', fontSize: '0.9375rem' }}>
          Pedagogical rigor and accessibility standards. The "how we teach" voice.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-xl)' }}>
          {ADVISORS.filter(a => a.perspective === 'instructor').map(advisor => (
            <Card key={advisor.name} style={{ borderTop: `3px solid ${advisor.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                <span style={{ fontSize: '2rem' }}>{advisor.emoji}</span>
                <div>
                  <h3 style={{ fontSize: '1rem', margin: 0 }}>{advisor.name}</h3>
                  <p style={{ color: advisor.color, fontSize: '0.8125rem', margin: 0, fontFamily: 'var(--font-display)' }}>{advisor.role}</p>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 'var(--space-lg)' }}>
                {advisor.bio}
              </p>
              <p style={{ fontStyle: 'italic', color: 'var(--text-tertiary)', fontSize: '0.875rem', borderLeft: `2px solid ${advisor.color}`, paddingLeft: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                {advisor.priority}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {advisor.recommendations.map((rec, i) => (
                  <li key={i} style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <span style={{ color: advisor.color, flexShrink: 0, marginTop: 2 }}>→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* Business perspective */}
      <section style={{ marginBottom: 'var(--space-4xl)' }}>
        <h2 style={{ marginBottom: 'var(--space-sm)', fontSize: '1.5rem' }}>Business Perspective</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)', fontSize: '0.9375rem' }}>
          Sustainability, retention, and pricing strategy. The "why this works as a business" voice.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-xl)' }}>
          {ADVISORS.filter(a => a.perspective === 'business').map(advisor => (
            <Card key={advisor.name} style={{ borderTop: `3px solid ${advisor.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                <span style={{ fontSize: '2rem' }}>{advisor.emoji}</span>
                <div>
                  <h3 style={{ fontSize: '1rem', margin: 0 }}>{advisor.name}</h3>
                  <p style={{ color: advisor.color, fontSize: '0.8125rem', margin: 0, fontFamily: 'var(--font-display)' }}>{advisor.role}</p>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 'var(--space-lg)' }}>
                {advisor.bio}
              </p>
              <p style={{ fontStyle: 'italic', color: 'var(--text-tertiary)', fontSize: '0.875rem', borderLeft: `2px solid ${advisor.color}`, paddingLeft: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                {advisor.priority}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {advisor.recommendations.map((rec, i) => (
                  <li key={i} style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <span style={{ color: advisor.color, flexShrink: 0, marginTop: 2 }}>→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* Decisions */}
      <section>
        <h2 style={{ marginBottom: 'var(--space-sm)', fontSize: '1.5rem' }}>Board Decisions</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)', fontSize: '0.9375rem' }}>
          When perspectives conflict, we document the trade-off and make a call. Here's the record.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
          {DECISIONS.map((d, i) => (
            <Card key={i}>
              <h3 style={{ fontSize: '1.0625rem', marginBottom: 'var(--space-lg)' }}>{d.question}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                {d.votes.map((v, j) => (
                  <div key={j} style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                    <span style={{ color: v.color, fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', marginTop: 2 }}>{v.advisor}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontStyle: 'italic' }}>"{v.vote}"</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-lg)', borderLeft: '3px solid var(--signal)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--signal)', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Decision: </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{d.decision}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
