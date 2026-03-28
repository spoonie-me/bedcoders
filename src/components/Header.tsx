import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { useAuth } from '@/lib/AuthContext';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--space-lg) var(--space-xl)',
        borderBottom: '1px solid var(--bg-border)',
        flexWrap: 'wrap',
        position: 'relative',
      }}
    >
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }} aria-label="Bedcoders home">
        <img src="/favicon.svg" alt="" width={24} height={24} style={{ display: 'block', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '1.125rem', letterSpacing: '-0.01em' }}>
          🛏️ Bedcoders
        </span>
      </Link>

      <button
        className="mobile-menu-toggle"
        onClick={() => setMenuOpen((o) => !o)}
        aria-expanded={menuOpen}
        aria-controls="main-nav"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          color: 'inherit',
          fontSize: '1.5rem',
          cursor: 'pointer',
          padding: 'var(--space-sm)',
          minWidth: 44,
          minHeight: 44,
        }}
      >
        {menuOpen ? '\u2715' : '\u2630'}
      </button>

      <nav
        id="main-nav"
        aria-label="Main navigation"
        className="main-nav"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-xl)',
        }}
      >
        <Link to="/pricing" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Pricing</Link>
        {user ? (
          <>
            <Link to="/dashboard" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Dashboard</Link>
            <Link to="/settings" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Settings</Link>
          </>
        ) : (
          <Link to="/for-teams" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>For Teams</Link>
        )}
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          {user ? (
            <Link to="/dashboard"><Button variant="primary" size="sm">Dashboard</Button></Link>
          ) : (
            <>
              <Link to="/login"><Button variant="secondary" size="sm">Log in</Button></Link>
              <Link to="/signup"><Button variant="primary" size="sm">Start free</Button></Link>
            </>
          )}
        </div>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-toggle { display: block !important; }
          .main-nav {
            display: ${menuOpen ? 'flex' : 'none'} !important;
            flex-direction: column;
            width: 100%;
            padding-top: var(--space-lg);
            gap: var(--space-md) !important;
          }
        }
      `}</style>
    </header>
  );
}
