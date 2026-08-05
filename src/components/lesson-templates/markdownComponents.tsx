/* ─── Shared Markdown component overrides for lesson content ───
 * Extracted from src/pages/Lesson.tsx so guess-first lesson templates
 * (src/components/lesson-templates/*) can render markdown-formatted
 * scenario/feedback/explanation strings with the same visual language
 * as the rest of the lesson body.
 */
export const markdownComponents = {
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 style={{ color: 'var(--text-primary)', marginBottom: 12, marginTop: 4, fontSize: '1.125rem' }}>{children}</h3>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong style={{ color: 'var(--text-primary)' }}>{children}</strong>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul style={{ paddingLeft: 'var(--space-xl)', listStyle: 'disc' }}>{children}</ul>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li style={{ marginBottom: 'var(--space-xs)' }}>{children}</li>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p style={{ marginBottom: 'var(--space-md)' }}>{children}</p>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code
      style={{
        fontFamily: 'var(--font-code)',
        background: 'var(--bg-elevated)',
        padding: '1px 5px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.875em',
      }}
    >
      {children}
    </code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre
      style={{
        fontFamily: 'var(--font-code)',
        background: 'var(--bg-elevated)',
        padding: 'var(--space-md)',
        borderRadius: 'var(--radius-sm)',
        overflowX: 'auto',
        fontSize: '0.8125rem',
        marginBottom: 'var(--space-md)',
      }}
    >
      {children}
    </pre>
  ),
};
