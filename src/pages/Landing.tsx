import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SEO } from '@/components/SEO';


export function Landing() {
  return (
    <div>
      <SEO
        title="Bedcoders — Learn to Code and Build with AI from Your Bed"
        description="Code from bed. Learn Claude API, prompt engineering, AI agents, and build real tools — from your couch, your bed, anywhere. No CS degree required."
        canonical="/"
      />
      {/* Hero */}
      <section style={{ padding: 'var(--space-4xl) var(--space-xl)', maxWidth: 900, margin: '0 auto' }}>
        <p style={{ color: 'var(--signal)', fontFamily: 'var(--font-display)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          coding from bed since 2026
        </p>
        <h1 style={{ fontSize: '3rem', marginBottom: 'var(--space-xl)', lineHeight: 1.1 }}>
          Code from bed.<br />
          <span style={{ color: 'var(--signal)' }}>No pants needed.</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: 'var(--space-2xl)', maxWidth: 640 }}>
          Learn the Claude API, prompt engineering, agents, and tool-building — from your bed, your couch, wherever. No CS degree. No dress code. Just real skills that ship.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBottom: 'var(--space-2xl)' }}>
          {['4 tracks', '840+ exercises', 'AI feedback', 'Verifiable certificate', 'no pants required'].map((stat) => (
            <span key={stat} style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', border: '1px solid var(--bg-border)', padding: '3px 10px', borderRadius: 6, fontFamily: 'var(--font-display)' }}>{stat}</span>
          ))}
        </div>
        <div className="hero-cta" style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <Link to="/signup">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                (window as any).trackEvent?.('cta_click', { cta: 'get_started', location: 'hero' });
                if (typeof (window as any).umami !== 'undefined') (window as any).umami.track('get-started-hero');
              }}
            >
              Start for Free
            </Button>
          </Link>
          <Link to="/pricing"><Button variant="secondary" size="lg">See pricing</Button></Link>
        </div>
      </section>

      {/* Who this is for */}
      <section style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-2xl)' }}>who's this for?</h2>
          <div className="grid-3">
            <Card>
              <h3 style={{ fontSize: '1rem', color: 'var(--signal)', marginBottom: 'var(--space-md)' }}>😴 the lazy coder</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                You want to build cool stuff without sitting through 40 hours of YouTube lectures. Same. Let's ship in 15-minute lessons.
              </p>
            </Card>
            <Card>
              <h3 style={{ fontSize: '1rem', color: 'var(--rust)', marginBottom: 'var(--space-md)' }}>🔄 the career switcher</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Starting from zero. Need a portfolio that proves something. No shame here — everyone starts somewhere, and you started today.
              </p>
            </Card>
            <Card>
              <h3 style={{ fontSize: '1rem', color: 'var(--gold)', marginBottom: 'var(--space-md)' }}>🤔 the AI-curious</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                You use Claude every day but have no idea how it actually works. Time to stop vibing and start building.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Curricula */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 'var(--space-sm)' }}>pick your vibe.</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)' }}>
          Four tracks. Each one self-contained. Start wherever — total beginner to agent wizard.
        </p>
        <div className="grid-2">
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
              <div style={{ width: 40, height: 4, background: 'var(--signal)', borderRadius: 2 }} />
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--signal)', border: '1px solid var(--signal)', padding: '2px 8px', borderRadius: 6 }}>Start here</span>
            </div>
            <h3 style={{ color: 'var(--signal)', marginBottom: 'var(--space-md)' }}>🛏️ Code from Bed</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-md)' }}>
              Variables, functions, control flow, and your first web app — built with Claude's help. Zero to deployed in 4 weeks.
            </p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
              No prior coding experience required.
            </p>
          </Card>
          {[
            { color: 'var(--rust)', title: '🤖 AI Literacy for Humans', badge: 'Intermediate', badgeColor: 'var(--rust)', desc: 'How LLMs actually work, prompt engineering, Claude API basics, hallucinations, ethics. Use AI like a pro, not a parrot.' },
            { color: 'var(--gold)', title: '⚡ Build Cool Tools Fast', badge: 'Hands-on', badgeColor: 'var(--gold)', desc: 'Ship CLI tools, web apps, and APIs in days. Stripe integration, real users, real deployments — no fluff.' },
            { color: 'var(--crystal)', title: '🚀 AI Agents that Work', badge: 'Advanced', badgeColor: 'var(--crystal)', desc: 'Build autonomous agents with tool use, memory, planning, and multi-step reasoning. Deploy to production.' },
          ].map((track) => (
            <Card key={track.title}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
                <div style={{ width: 40, height: 4, background: track.color, borderRadius: 2 }} />
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: track.badgeColor, border: `1px solid ${track.color}`, padding: '2px 8px', borderRadius: 6 }}>{track.badge}</span>
              </div>
              <h3 style={{ color: track.color, marginBottom: 'var(--space-md)' }}>{track.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>{track.desc}</p>
            </Card>
          ))}
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: 'var(--space-xl)' }}>
          First module free in every track. Pay once, access forever.
        </p>
      </section>

      {/* Features */}
      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-2xl)' }}>learning that doesn't suck</h2>
          <div className="grid-2">
            {[
              { title: '840+ practice exercises', desc: 'Coding challenges, real-world scenarios, case studies, and more. AI grades every answer with written feedback.' },
              { title: 'AI-powered feedback', desc: 'Submit an exercise at 2am and get expert-quality feedback instantly. No waiting for a tutor.' },
              { title: 'Learn at your own pace', desc: 'No deadlines. No cohorts. No FOMO. Lifetime access means you learn when it works for you.' },
              { title: 'Exam when you\'re ready', desc: 'Sit the track exam only when you feel confident. No deadline, no re-purchase, no pressure.' },
              { title: 'Verifiable certificate', desc: 'Every certificate has a public verification code. Share on LinkedIn. Employers can verify it instantly.' },
              { title: 'Micro-learning format', desc: '15-minute lessons, gamified XP, streak tracking, and 20 badges. Built to actually finish — not just start.' },
            ].map((f) => (
              <div key={f.title} style={{ display: 'flex', gap: 'var(--space-lg)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--signal)', marginTop: 8, flexShrink: 0 }} />
                <div>
                  <h4 style={{ marginBottom: 'var(--space-xs)' }}>{f.title}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', background: 'var(--bg-elevated)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-sm)' }}>try it free. no card, no BS.</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)' }}>
            First lesson in every track is completely free. If it's not good enough to pay for, don't.
          </p>
          <Card style={{ textAlign: 'center', maxWidth: 440, margin: '0 auto var(--space-2xl)', borderColor: 'var(--signal)' }}>
            <div style={{ width: 32, height: 3, background: 'var(--signal)', borderRadius: 2, margin: '0 auto var(--space-md)' }} />
            <p style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 500, marginBottom: 4 }}>€149 <span style={{ fontSize: '1rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>per track</span></p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-lg)' }}>one-time · lifetime access · exam included</p>
            <Link to="/pricing" style={{ textDecoration: 'none' }}><Button variant="primary" size="sm" style={{ width: '100%' }}>See pricing</Button></Link>
          </Card>
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
            No subscription · No recurring charges · <Link to="/for-teams" style={{ color: 'var(--signal)', textDecoration: 'none' }}>Team pricing &rarr;</Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'var(--space-4xl) var(--space-xl)', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>your bed is your classroom now.</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)', fontSize: '1.125rem' }}>
          First lesson free. No card. No pants. No excuses.
        </p>
        <Link to="/signup">
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              (window as any).trackEvent?.('cta_click', { cta: 'get_started', location: 'footer' });
              if (typeof (window as any).umami !== 'undefined') (window as any).umami.track('get-started-footer');
            }}
          >
            Start for Free 🛏️
          </Button>
        </Link>
      </section>
    </div>
  );
}
