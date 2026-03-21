import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { LoadingSpinner } from '@/components/ProtectedRoute';
import { learningApi } from '@/lib/api';
import { IS_DEV_MODE } from '@/lib/useApi';

const TRACK_META: Record<string, { name: string; color: string }> = {
  fundamentals: { name: '🛏️ Code from Bed', color: 'var(--signal)' },
  ai: { name: '🤖 AI Literacy for Humans', color: 'var(--rust)' },
  tools: { name: '⚡ Build Cool Tools Fast', color: 'var(--gold)' },
  advanced: { name: '🚀 AI Agents that Work', color: 'var(--crystal)' },
};

interface LeaderboardEntry {
  rank: number;
  totalXp: number;
  displayName: string;
  avatar: string | null;
  isCurrentUser: boolean;
}

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, totalXp: 12450, displayName: 'Maria K.', avatar: null, isCurrentUser: false },
  { rank: 2, totalXp: 11200, displayName: 'James P.', avatar: null, isCurrentUser: false },
  { rank: 3, totalXp: 9875, displayName: 'Sarah M.', avatar: null, isCurrentUser: false },
  { rank: 4, totalXp: 8340, displayName: 'You', avatar: null, isCurrentUser: true },
  { rank: 5, totalXp: 7920, displayName: 'Alex W.', avatar: null, isCurrentUser: false },
  { rank: 6, totalXp: 6580, displayName: 'Priya R.', avatar: null, isCurrentUser: false },
  { rank: 7, totalXp: 5340, displayName: 'Tom H.', avatar: null, isCurrentUser: false },
  { rank: 8, totalXp: 4200, displayName: 'Lisa C.', avatar: null, isCurrentUser: false },
  { rank: 9, totalXp: 3150, displayName: 'David L.', avatar: null, isCurrentUser: false },
  { rank: 10, totalXp: 2480, displayName: 'Emma B.', avatar: null, isCurrentUser: false },
];

export function Leaderboard() {
  const { trackId } = useParams<{ trackId: string }>();
  const track = TRACK_META[trackId ?? 'fundamentals'] ?? TRACK_META.fundamentals;

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<{ rank: number; totalXp: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (IS_DEV_MODE) {
      setEntries(DEMO_LEADERBOARD);
      setCurrentUserRank({ rank: 4, totalXp: 8340 });
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res = await learningApi.getLeaderboard(trackId ?? 'fundamentals');
        setEntries(res.leaderboard);
        setCurrentUserRank(res.currentUser);
      } catch {
        setEntries(DEMO_LEADERBOARD);
        setCurrentUserRank({ rank: 4, totalXp: 8340 });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [trackId]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4xl)' }}><LoadingSpinner /></div>;
  }

  const maxXp = entries.length > 0 ? entries[0].totalXp : 1;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      <Link to="/dashboard" style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-xl)' }}>
        &larr; Back to Dashboard
      </Link>

      <div style={{ marginBottom: 'var(--space-3xl)' }}>
        <div style={{ width: 48, height: 4, background: track.color, borderRadius: 2, marginBottom: 'var(--space-md)' }} />
        <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-sm)' }}>Leaderboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{track.name}</p>
      </div>

      {/* Track selector */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-2xl)', flexWrap: 'wrap' }}>
        {Object.entries(TRACK_META).map(([id, meta]) => (
          <Link
            key={id}
            to={`/leaderboard/${id}`}
            style={{
              padding: 'var(--space-sm) var(--space-lg)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${id === trackId ? meta.color : 'var(--bg-border)'}`,
              background: id === trackId ? 'var(--bg-elevated)' : 'transparent',
              color: id === trackId ? meta.color : 'var(--text-tertiary)',
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-display)',
              textDecoration: 'none',
            }}
          >
            {meta.name.split(' ')[0]}
          </Link>
        ))}
      </div>

      {/* Current user position */}
      {currentUserRank && (
        <Card style={{ marginBottom: 'var(--space-2xl)', borderLeft: `3px solid ${track.color}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Rank</span>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: track.color, margin: 0 }}>#{currentUserRank.rank}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total XP</span>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--gold)', margin: 0 }}>{currentUserRank.totalXp.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Leaderboard entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {entries.map((entry) => {
          const isTop3 = entry.rank <= 3;
          const medalColors = ['var(--gold)', 'var(--static)', '#CD7F32'];

          return (
            <div
              key={entry.rank}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-lg)',
                padding: 'var(--space-md) var(--space-lg)',
                background: entry.isCurrentUser ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                border: `1px solid ${entry.isCurrentUser ? track.color : 'var(--bg-border)'}`,
                borderRadius: 'var(--radius-md)',
              }}
            >
              {/* Rank */}
              <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
                {isTop3 ? (
                  <span style={{ fontSize: '1.25rem', color: medalColors[entry.rank - 1] }}>
                    {entry.rank === 1 ? '\uD83E\uDD47' : entry.rank === 2 ? '\uD83E\uDD48' : '\uD83E\uDD49'}
                  </span>
                ) : (
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>
                    {entry.rank}
                  </span>
                )}
              </div>

              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: entry.isCurrentUser ? track.color : 'var(--bg-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 600, color: entry.isCurrentUser ? 'var(--bg-void)' : 'var(--text-tertiary)',
                  flexShrink: 0,
                }}>
                  {entry.displayName.charAt(0).toUpperCase()}
                </div>
                <span style={{
                  fontSize: '0.9375rem',
                  fontWeight: entry.isCurrentUser ? 600 : 400,
                  color: entry.isCurrentUser ? track.color : 'var(--text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {entry.displayName}
                  {entry.isCurrentUser && <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}> (you)</span>}
                </span>
              </div>

              {/* XP bar */}
              <div style={{ width: 140, flexShrink: 0 }}>
                <ProgressBar value={(entry.totalXp / maxXp) * 100} color={entry.isCurrentUser ? track.color : 'var(--bg-border)'} height={6} />
              </div>

              {/* XP value */}
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 600,
                color: entry.isCurrentUser ? 'var(--gold)' : 'var(--text-secondary)',
                minWidth: 70, textAlign: 'right', flexShrink: 0,
              }}>
                {entry.totalXp.toLocaleString()} XP
              </span>
            </div>
          );
        })}
      </div>

      {entries.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '1rem' }}>No leaderboard entries yet. Start learning to be the first!</p>
        </Card>
      )}
    </div>
  );
}
