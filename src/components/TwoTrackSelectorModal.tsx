import { useState } from 'react';
import { Button } from '@/components/Button';

const TRACKS = [
  { id: 'fundamentals', name: '🛏️ Code from Bed', color: 'var(--signal)' },
  { id: 'ai', name: '🤖 AI Literacy', color: 'var(--rust)' },
  { id: 'tools', name: '⚡ Build Cool Tools', color: 'var(--gold)' },
  { id: 'advanced', name: '🚀 AI Agents', color: 'var(--crystal)' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function TwoTrackSelectorModal({ isOpen, onClose }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  async function handleCheckout() {
    if (selected.length !== 2 || loading) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('bc_token');
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ planId: 'two_tracks', trackId: selected[0], secondTrackId: selected[1] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `Server error (${res.status})` }));
        setError(data.error ?? 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Checkout session could not be created. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose two tracks"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-xl)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-2xl)',
        maxWidth: 540,
        width: '100%',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Choose two tracks</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: '1.25rem', cursor: 'pointer', lineHeight: 1, padding: 0 }}
            aria-label="Close"
          >&#10005;</button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-xl)' }}>
          Select any two tracks &mdash; &euro;299 one-time, lifetime access.
        </p>

        {/* Track cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
          {TRACKS.map((t) => {
            const isSelected = selected.includes(t.id);
            const isDisabled = !isSelected && selected.length >= 2;
            return (
              <button
                key={t.id}
                onClick={() => toggle(t.id)}
                disabled={isDisabled}
                style={{
                  background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-void)',
                  border: `2px solid ${isSelected ? t.color : 'var(--bg-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-lg)',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.4 : 1,
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ width: 28, height: 3, background: t.color, borderRadius: 2, marginBottom: 'var(--space-sm)' }} />
                <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>{t.name}</p>
                {isSelected && (
                  <p style={{ color: t.color, fontSize: '0.75rem', marginTop: 'var(--space-xs)', fontFamily: 'var(--font-display)' }}>&#10003; Selected</p>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-md)' }}>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', margin: 0 }}>
            {selected.length === 0 && 'Choose 2 tracks to continue'}
            {selected.length === 1 && 'Choose 1 more track'}
            {selected.length === 2 && `${TRACKS.find(t => t.id === selected[0])?.name} + ${TRACKS.find(t => t.id === selected[1])?.name}`}
          </p>
          <Button
            variant="primary"
            disabled={selected.length !== 2 || loading}
            onClick={handleCheckout}
          >
            {loading ? 'Redirecting…' : 'Continue — €299'}
          </Button>
        </div>
        {error && <p style={{ color: 'var(--rust)', fontSize: '0.8125rem', marginTop: 'var(--space-md)', margin: `var(--space-md) 0 0` }}>{error}</p>}
      </div>
    </div>
  );
}
