import { Badge } from './Badge';
import { ProgressBar } from './ProgressBar';
import { xpProgress } from '@/lib/gamification';

interface GamificationData {
  totalXp: number;
  level: number;
  xpProgress?: { level: number; currentXp: number; xpToNextLevel: number; progressPercent: number };
  currentStreak: number;
  bestStreak: number;
  recentBadges?: Array<{ key?: string; name: string; tier: string; earnedAt?: string }>;
  // Legacy compat
  badges?: Array<{ label: string; tier: 'gold' | 'silver' | 'bronze' | 'crystal' }>;
}

const TIER_MAP: Record<string, 'gold' | 'silver' | 'bronze' | 'crystal'> = {
  gold: 'gold',
  silver: 'silver',
  bronze: 'bronze',
  crystal: 'crystal',
  platinum: 'gold',
};

export function GamificationPanel({ data }: { data: GamificationData }) {
  const progress = data.xpProgress ?? xpProgress(data.totalXp);

  // Merge badge formats (legacy array vs API array)
  const badgeItems = data.recentBadges
    ? data.recentBadges.map((b) => ({
        label: b.name,
        tier: TIER_MAP[b.tier] ?? ('bronze' as const),
      }))
    : data.badges ?? [];

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-xl)',
      }}
    >
      <h3 style={{ marginBottom: 'var(--space-xl)', fontSize: '1rem' }}>Your Progress</h3>

      {/* Level + XP */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem' }}>
            Level {progress.level}
          </span>
          <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: '0.875rem' }}>
            {data.totalXp} XP
          </span>
        </div>
        <ProgressBar value={progress.progressPercent} color="var(--gold)" />
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: 'var(--space-xs)' }}>
          {progress.xpToNextLevel - progress.currentXp} XP to level {progress.level + 1}
        </p>
      </div>

      {/* Streak */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Current streak</span>
          <span style={{ color: 'var(--rust)', fontFamily: 'var(--font-display)', fontWeight: 500 }}>
            {data.currentStreak} days
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-xs)' }}>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Best streak</span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
            {data.bestStreak} days
          </span>
        </div>
      </div>

      {/* Badges */}
      {badgeItems.length > 0 && (
        <div>
          <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: 'var(--space-md)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Badges earned
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
            {badgeItems.map((b) => (
              <Badge key={b.label} label={b.label} tier={b.tier} size="sm" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
