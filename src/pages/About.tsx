import { Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { SEO, breadcrumbLd } from '@/components/SEO';

export function About() {
  return (
    <div>
      <SEO
        title="About — why we teach what we teach"
        description="A paramedic who became the patient, and the actual reasoning behind four tracks: why AI-enabled and AI-resistant skills, why not entry-level coding or entry-level medical coding, and why this isn't a cure narrative."
        canonical="/about"
        jsonLd={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ])}
      />

      {/* Hero */}
      <section style={{ padding: 'var(--space-4xl) var(--space-xl)', maxWidth: 720, margin: '0 auto' }}>
        <p style={{ color: 'var(--signal)', fontFamily: 'var(--font-display)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          why we teach what we teach
        </p>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--space-xl)', lineHeight: 1.12 }}>
          Nine years responding to emergencies.<br />Then years being one nobody reached in time.
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem' }}>
          That's not a metaphor borrowed for a pitch deck. It's the actual reason this exists, and it's why every choice below was argued for, not assumed.
        </p>
      </section>

      {/* Origin, full version */}
      <section style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-lg)' }}>the verdict, and what came after it</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', marginBottom: 'var(--space-lg)' }}>
            Nine years in the Israeli Red Cross, trained to be the person who shows up. Then years of being dismissed by doctor after doctor, before a diagnosis that took far longer than it should have. A verdict, delivered like a fact: you won't work again.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', marginBottom: 'var(--space-lg)' }}>
            The rebuild wasn't a single dramatic recovery. It was self-taught, methodical, and it didn't happen once — it happened in pieces, over years, with real setbacks in between. That's the actual shape of chronic illness: not a straight line from broken to fixed, but a repeated, gentler kind of starting again.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>That's the whole reason this isn't framed as recovery or a cure.</strong> A cure narrative has an ending. This doesn't need one — it needs to work for a body that changes without warning, indefinitely, and still be worth doing.
          </p>
        </div>
      </section>

      {/* Why this framework */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>why "machines handle information, humans handle transformation"</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', marginBottom: 'var(--space-lg)' }}>
          The obvious question about AI and disabled labor isn't "can AI do this job" — it's always been "what should only a human do here." Everything taught here answers that question one of two ways, and we picked both answers on purpose rather than hedging toward one.
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem' }}>
          <strong style={{ color: 'var(--signal)' }}>AI-enabled</strong> work exists because directing an AI tool well no longer requires a 40-hour week to produce a full week's output — your ceiling stops being your hours. <strong style={{ color: 'var(--crystal)' }}>AI-resistant</strong> work exists because some judgment — what a screen reader user actually experiences, what a flawed clinical record actually means — can't be automated away, and shouldn't be treated as if it can.
        </p>
      </section>

      {/* Why these 4 tracks specifically */}
      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-2xl)' }}>why these four tracks, specifically</h2>
          <div className="grid-2" style={{ display: 'grid', gap: 'var(--space-xl)' }}>
            <Card>
              <h3 style={{ color: 'var(--signal)', fontSize: '1.0625rem', marginBottom: 'var(--space-md)' }}>AI-Orchestrated Software Development</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Chosen first because the data backs it hardest: freelance developers who direct AI tools well report meaningfully higher earnings than those who don't. This isn't a hopeful bet — it's the track with the clearest evidence behind it.
              </p>
            </Card>
            <Card>
              <h3 style={{ color: 'var(--gold)', fontSize: '1.0625rem', marginBottom: 'var(--space-md)' }}>AI Workflow & Automation Consulting</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Real demand, but we deliberately don't quote the inflated $200–500/hr figures that circulate online — those are SEO bait, not grounded numbers. We teach to the honest, verifiable range instead.
              </p>
            </Card>
            <Card>
              <h3 style={{ color: 'var(--crystal)', fontSize: '1.0625rem', marginBottom: 'var(--space-md)' }}>AI-Oversight Health Informatics</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Deliberately not entry-level medical coding — that layer is exactly what AI is automating fastest right now. We teach the exception-handling and review layer AI routes complex cases to, which is the part of the job that's actually durable.
              </p>
            </Card>
            <Card>
              <h3 style={{ color: 'var(--rust)', fontSize: '1.0625rem', marginBottom: 'var(--space-md)' }}>Accessibility QA with Lived Experience</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Modeled on a real precedent: a 14-week remote certification program that already proved lived experience plus screen-reader fluency is a genuine, hireable edge — not a nice-to-have. We're not guessing that this works; someone already showed it does.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'var(--space-4xl) var(--space-xl)', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>see the tracks, or talk to us about hiring</h2>
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/signup"><Button variant="primary" size="lg">Start for Free</Button></Link>
          <Link to="/employers"><Button variant="secondary" size="lg">For Employers</Button></Link>
        </div>
      </section>
    </div>
  );
}
