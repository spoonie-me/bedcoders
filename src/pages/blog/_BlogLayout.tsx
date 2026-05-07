import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';

interface BlogLayoutProps {
  tag: string;
  tagColor: string;
  date: string;
  readTime: string;
  title: string;
  description: string;
  category: string;
  slug: string;
  children: ReactNode;
}

export function BlogLayout({
  tag, tagColor, date, readTime, title, description, category, slug, children,
}: BlogLayoutProps) {

  const ldJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    datePublished: date,
    publisher: {
      '@type': 'Organization',
      name: 'Bedcoders',
      url: 'https://bedcoders.com',
    },
    articleSection: category,
    url: `https://bedcoders.com/blog/${slug}`,
  });

  return (
    <article style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-4xl) var(--space-xl)' }}>

      <SEO
        title={title}
        description={description}
        canonical={`/blog/${slug}`}
        type="article"
      />

      {/* JSON-LD structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson }} />

      {/* Breadcrumb */}
      <nav style={{ marginBottom: 'var(--space-2xl)', fontSize: '0.8125rem', fontFamily: 'var(--font-display)', color: 'var(--text-tertiary)' }}>
        <Link to="/blog" style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>Blog</Link>
        <span style={{ margin: '0 8px' }}>→</span>
        <span>{category}</span>
      </nav>

      {/* Meta */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <span style={{
          fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
          color: tagColor, fontFamily: 'var(--font-display)', border: `1px solid ${tagColor}`,
          padding: '2px 9px', borderRadius: 6,
        }}>
          {tag}
        </span>
        <p style={{ marginTop: 'var(--space-md)', fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)' }}>
          {date} · {readTime}
        </p>
      </div>

      {children}

      {/* CTA */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
        borderRadius: 12, padding: 'var(--space-2xl)', textAlign: 'center', marginTop: 'var(--space-4xl)',
      }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', fontSize: '0.9375rem' }}>
          Ready to go from reader to practitioner?
        </p>
        <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-xl)' }}>
          Start building with AI — first lesson free.
        </h3>
        <Link to="/signup" style={{
          display: 'inline-block', background: 'var(--signal)', color: '#000',
          fontWeight: 700, fontSize: '0.9375rem', padding: '12px 28px',
          borderRadius: 8, textDecoration: 'none', fontFamily: 'var(--font-display)',
        }}>
          Start for free
        </Link>
      </div>

      {/* Back link */}
      <div style={{ marginTop: 'var(--space-2xl)' }}>
        <Link to="/blog" style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', fontFamily: 'var(--font-display)', textDecoration: 'none' }}>
          ← Back to blog
        </Link>
      </div>
    </article>
  );
}

// Style constants live in _blogStyles.ts to satisfy react-refresh/only-export-components
export { p, h2, h3, ul, hr, callout, faqItem } from './_blogStyles';
