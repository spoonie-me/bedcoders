import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import { IS_DEV_MODE } from '@/lib/useApi';

/* ─── Types ─── */
interface ProfileData {
  displayName: string;
  bio: string;
  country: string;
}

interface PreferencesData {
  darkMode: boolean;
  language: string;
  reduceMotion: boolean;
  highContrast: boolean;
  fontSize: string;
  leaderboardOptIn: boolean;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const FONT_SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 'var(--space-md) var(--space-lg)',
  background: 'var(--bg-void)',
  border: '1px solid var(--bg-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '0.9375rem',
  fontFamily: 'inherit',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-display)',
  fontSize: '0.75rem',
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 'var(--space-sm)',
};

export function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile');

  const [profile, setProfile] = useState<ProfileData>({
    displayName: '',
    bio: '',
    country: '',
  });

  const [prefs, setPrefs] = useState<PreferencesData>({
    darkMode: true,
    language: 'en',
    reduceMotion: false,
    highContrast: false,
    fontSize: 'medium',
    leaderboardOptIn: false,
  });

  const [passwords, setPasswords] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (IS_DEV_MODE) {
      setProfile({ displayName: 'Dev User', bio: 'Building with AI from bed.', country: 'AT' });
      setPrefs({ darkMode: true, language: 'en', reduceMotion: false, highContrast: false, fontSize: 'medium', leaderboardOptIn: false });
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res = await api.get<{
          profile: { displayName: string | null; bio: string | null; country: string | null };
          preferences: PreferencesData;
        }>('/auth/profile');
        setProfile({
          displayName: res.profile.displayName ?? user?.name ?? '',
          bio: res.profile.bio ?? '',
          country: res.profile.country ?? '',
        });
        setPrefs(res.preferences);
      } catch {
        // Use auth user data as fallback
        setProfile({ displayName: user?.name ?? '', bio: '', country: '' });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', { profile });
      showMessage('success', 'Profile updated.');
    } catch {
      showMessage('error', 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await api.put('/auth/preferences', { preferences: prefs });
      showMessage('success', 'Preferences saved.');
    } catch {
      showMessage('error', 'Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      showMessage('error', 'New passwords do not match.');
      return;
    }
    if (passwords.newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showMessage('success', 'Password changed successfully.');
    } catch {
      showMessage('error', 'Failed to change password. Check your current password.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4xl)' }}><LoadingSpinner /></div>;
  }

  const tabs = [
    { key: 'profile' as const, label: 'Profile' },
    { key: 'preferences' as const, label: 'Preferences' },
    { key: 'security' as const, label: 'Security' },
  ];

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      <Link to="/dashboard" style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-xl)' }}>
        &larr; Back to Dashboard
      </Link>

      <div style={{ marginBottom: 'var(--space-3xl)' }}>
        <div style={{ width: 48, height: 4, background: 'var(--signal)', borderRadius: 2, marginBottom: 'var(--space-md)' }} />
        <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-sm)' }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
      </div>

      {/* Message toast */}
      {message && (
        <div style={{
          padding: 'var(--space-md) var(--space-lg)',
          marginBottom: 'var(--space-xl)',
          borderRadius: 'var(--radius-md)',
          background: message.type === 'success' ? 'rgba(90,158,106,0.1)' : 'rgba(196,107,58,0.1)',
          border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--rust)'}`,
          color: message.type === 'success' ? 'var(--success)' : 'var(--rust)',
          fontSize: '0.875rem',
        }}>
          {message.text}
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-2xl)', borderBottom: '1px solid var(--bg-border)', paddingBottom: 'var(--space-sm)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: 'var(--space-sm) var(--space-lg)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--signal)' : '2px solid transparent',
              color: activeTab === tab.key ? 'var(--signal)' : 'var(--text-tertiary)',
              fontFamily: 'var(--font-display)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          <div>
            <label style={labelStyle}>Display Name</label>
            <input
              type="text"
              value={profile.displayName}
              onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
              style={inputStyle}
              placeholder="How you appear on leaderboards"
            />
          </div>

          <div>
            <label style={labelStyle}>Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="A short intro about yourself"
              maxLength={280}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-xs)', display: 'block' }}>
              {profile.bio.length}/280
            </span>
          </div>

          <div>
            <label style={labelStyle}>Country</label>
            <input
              type="text"
              value={profile.country}
              onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
              style={inputStyle}
              placeholder="e.g. AT, DE, US"
              maxLength={2}
            />
          </div>

          <Button variant="primary" onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Saving…' : 'Save Profile'}
          </Button>
        </Card>
      )}

      {/* Preferences tab */}
      {activeTab === 'preferences' && (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.9375rem', fontWeight: 500 }}>Dark Mode</span>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', margin: 0 }}>Use dark theme</p>
            </div>
            <ToggleSwitch checked={prefs.darkMode} onChange={(v) => setPrefs((p) => ({ ...p, darkMode: v }))} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.9375rem', fontWeight: 500 }}>Reduce Motion</span>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', margin: 0 }}>Minimize animations</p>
            </div>
            <ToggleSwitch checked={prefs.reduceMotion} onChange={(v) => setPrefs((p) => ({ ...p, reduceMotion: v }))} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.9375rem', fontWeight: 500 }}>High Contrast</span>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', margin: 0 }}>Increase visual contrast</p>
            </div>
            <ToggleSwitch checked={prefs.highContrast} onChange={(v) => setPrefs((p) => ({ ...p, highContrast: v }))} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.9375rem', fontWeight: 500 }}>Leaderboard Opt-In</span>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', margin: 0 }}>Show your name on public leaderboards</p>
            </div>
            <ToggleSwitch checked={prefs.leaderboardOptIn} onChange={(v) => setPrefs((p) => ({ ...p, leaderboardOptIn: v }))} />
          </div>

          <div>
            <label style={labelStyle}>Font Size</label>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              {FONT_SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPrefs((p) => ({ ...p, fontSize: opt.value }))}
                  style={{
                    flex: 1,
                    padding: 'var(--space-sm) var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${prefs.fontSize === opt.value ? 'var(--signal)' : 'var(--bg-border)'}`,
                    background: prefs.fontSize === opt.value ? 'var(--bg-elevated)' : 'transparent',
                    color: prefs.fontSize === opt.value ? 'var(--signal)' : 'var(--text-tertiary)',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Button variant="primary" onClick={handleSavePreferences} disabled={saving}>
            {saving ? 'Saving…' : 'Save Preferences'}
          </Button>
        </Card>
      )}

      {/* Security tab */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
          <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Change Password</h3>

            <div>
              <label style={labelStyle}>Current Password</label>
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>New Password</label>
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                style={inputStyle}
                minLength={8}
              />
            </div>

            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <Button variant="primary" onClick={handleChangePassword} disabled={saving || !passwords.currentPassword || !passwords.newPassword}>
              {saving ? 'Changing…' : 'Change Password'}
            </Button>
          </Card>

          <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--rust)' }}>Danger Zone</h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', margin: 0 }}>
              Request a full export of your data or request account deletion. Per GDPR, we will process your request within 30 days.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <Button variant="ghost" size="sm" onClick={async () => {
                try {
                  await api.post('/auth/data-export');
                  showMessage('success', 'Data export requested. You will receive an email.');
                } catch {
                  showMessage('error', 'Failed to request data export.');
                }
              }}>
                Request Data Export
              </Button>
              <Button variant="ghost" size="sm" style={{ color: 'var(--rust)', borderColor: 'var(--rust)' }} onClick={async () => {
                if (!window.confirm('Are you sure? This will permanently delete your account and all data within 30 days.')) return;
                try {
                  await api.post('/auth/request-deletion');
                  showMessage('success', 'Account deletion requested. You have 30 days to cancel.');
                } catch {
                  showMessage('error', 'Failed to request account deletion.');
                }
              }}>
                Delete Account
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ─── Toggle switch component ─── */
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: 'none',
        background: checked ? 'var(--signal)' : 'var(--bg-border)',
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 0.2s',
      }}
    >
      <span style={{
        display: 'block',
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: checked ? 'var(--bg-void)' : 'var(--text-tertiary)',
        position: 'absolute',
        top: 3,
        left: checked ? 23 : 3,
        transition: 'left 0.2s',
      }} />
    </button>
  );
}
