import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';

/** Check if analytics consent was given */
export function hasAnalyticsConsent(): boolean {
  try {
    const raw = localStorage.getItem('cookieConsent');
    if (!raw) return false;
    const consent = JSON.parse(raw);
    return consent.analytics === true;
  } catch {
    return false;
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!consent) setVisible(true);
  }, []);

  useEffect(() => {
    if (visible && bannerRef.current) {
      const firstButton = bannerRef.current.querySelector('button');
      if (firstButton) firstButton.focus();
    }
  }, [visible]);

  const accept = (analytics: boolean) => {
    localStorage.setItem('cookieConsent', JSON.stringify({
      essential: true,
      analytics,
      marketing: false,
      consentVersion: '1.0',
      consentedAt: new Date().toISOString(),
    }));
    setVisible(false);

    // Dispatch event so analytics can initialize if consented
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: { analytics } }));
  };

  if (!visible) return null;

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-label="Cookie consent"
      aria-modal="false"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--bg-elevated)',
        borderTop: '1px solid var(--bg-border)',
        padding: 'var(--space-xl)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-xl)',
        flexWrap: 'wrap',
      }}
    >
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', flex: 1, minWidth: 200 }}>
        We use essential cookies to keep you logged in. Analytics cookies are optional.{' '}
        <Link to="/cookies" style={{ color: 'var(--signal)' }}>Learn more</Link>
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-md)', flexShrink: 0 }}>
        <Button variant="ghost" size="sm" onClick={() => accept(false)}>Essential only</Button>
        <Button variant="primary" size="sm" onClick={() => accept(true)}>Accept all</Button>
      </div>
    </div>
  );
}
