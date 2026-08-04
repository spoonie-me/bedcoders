import { describe, it, expect } from 'vitest';
import {
  toEmployerView,
  toDirectoryCard,
  toSelfPreview,
  releaseContact,
  normaliseSkillKey,
  type TalentProfileSource,
  type TalentUserSource,
  type TalentViewInput,
} from '../talentVisibility.js';

/**
 * These tests exist because this module is the only thing standing between a
 * learner's data and an employer. A regression here is not a rendering bug —
 * it is a disclosure. Each `show*` flag gets its own case on purpose.
 */

const baseProfile: TalentProfileSource = {
  id: 'tp_1',
  publicHandle: 'srs-abc123',
  isDiscoverable: true,
  headline: 'Agent tooling',
  summary: 'A longer summary.',
  pronouns: 'they/them',
  openToWork: true,
  hoursPerWeekMin: 10,
  hoursPerWeekMax: 20,
  wantsRemote: true,
  wantsAsync: true,
  wantsPartTime: true,
  wantsFlexHours: true,
  wantsContract: false,
  earliestStart: new Date('2026-09-01T00:00:00Z'),
  showRealName: false,
  showCountry: false,
  showTimeZone: false,
  showPortfolio: false,
  showCertificates: false,
  showMastery: false,
  showLinks: false,
  links: JSON.stringify([{ label: 'GitHub', url: 'https://github.com/example' }]),
};

const baseUser: TalentUserSource = {
  name: 'Real Name',
  timeZone: 'Europe/Vienna',
  profile: { country: 'AT', displayName: 'Display Name' },
};

function input(overrides: Partial<TalentViewInput> = {}): TalentViewInput {
  return {
    profile: baseProfile,
    user: baseUser,
    projects: [
      {
        id: 'p1',
        title: 'Eval harness',
        description: 'Built an eval harness.',
        source: 'curriculum',
        repoUrl: 'https://github.com/example/harness',
        liveUrl: null,
        skills: JSON.stringify(['TypeScript', 'Evals']),
        isVisible: true,
        order: 0,
      },
      {
        id: 'p2',
        title: 'Hidden side project',
        description: 'Not for public consumption.',
        source: 'self',
        repoUrl: null,
        liveUrl: null,
        skills: JSON.stringify(['rust']),
        isVisible: false,
        order: 1,
      },
    ],
    certificates: [
      { trackId: 'ai', examScore: 88, issuedAt: new Date('2026-06-01T00:00:00Z'), verifyCode: 'CODE1' },
    ],
    mastery: [
      { domainId: 'd1', domainName: 'Agent Foundations', stars: 4, isMastered: true },
      { domainId: 'd2', domainName: 'Memory', stars: 2, isMastered: false },
    ],
    ...overrides,
  };
}

function withProfile(patch: Partial<TalentProfileSource>): TalentViewInput {
  return input({ profile: { ...baseProfile, ...patch } });
}

describe('the discoverability gate', () => {
  it('returns null when the learner has not opted in', () => {
    expect(toEmployerView(withProfile({ isDiscoverable: false }))).toBeNull();
  });

  it('hides a non-discoverable learner from directory cards too', () => {
    expect(toDirectoryCard(withProfile({ isDiscoverable: false }))).toBeNull();
  });

  it('returns a view once the learner opts in', () => {
    expect(toEmployerView(input())).not.toBeNull();
  });
});

describe('identity', () => {
  it('shows the pseudonymous handle, not the real name, by default', () => {
    const view = toEmployerView(input())!;
    expect(view.displayName).toBe('srs-abc123');
    expect(JSON.stringify(view)).not.toContain('Real Name');
    expect(JSON.stringify(view)).not.toContain('Display Name');
  });

  it('shows the display name only when the learner turned it on', () => {
    const view = toEmployerView(withProfile({ showRealName: true }))!;
    expect(view.displayName).toBe('Display Name');
  });

  it('falls back to the account name when no display name is set', () => {
    const view = toEmployerView({
      ...withProfile({ showRealName: true }),
      user: { ...baseUser, profile: { country: 'AT', displayName: null } },
    })!;
    expect(view.displayName).toBe('Real Name');
  });

  it('never includes an email address, at any setting', () => {
    const allOn = withProfile({
      showRealName: true,
      showCountry: true,
      showTimeZone: true,
      showPortfolio: true,
      showCertificates: true,
      showMastery: true,
      showLinks: true,
    });
    const serialised = JSON.stringify(toEmployerView(allOn));
    expect(serialised).not.toMatch(/@/);
  });
});

describe('per-field visibility', () => {
  it('omits hidden fields rather than nulling them, so absence is indistinguishable from unset', () => {
    const view = toEmployerView(input())!;
    expect('country' in view).toBe(false);
    expect('timeZone' in view).toBe(false);
    expect('projects' in view).toBe(false);
    expect('certificates' in view).toBe(false);
    expect('mastery' in view).toBe(false);
    expect('links' in view).toBe(false);
  });

  it('reveals country only with showCountry', () => {
    expect(toEmployerView(withProfile({ showCountry: true }))!.country).toBe('AT');
  });

  it('reveals time zone only with showTimeZone', () => {
    expect(toEmployerView(withProfile({ showTimeZone: true }))!.timeZone).toBe('Europe/Vienna');
  });

  it('reveals links only with showLinks', () => {
    const view = toEmployerView(withProfile({ showLinks: true }))!;
    expect(view.links).toEqual([{ label: 'GitHub', url: 'https://github.com/example' }]);
  });

  it('reveals certificates only with showCertificates', () => {
    const view = toEmployerView(withProfile({ showCertificates: true }))!;
    expect(view.certificates).toHaveLength(1);
    expect(view.certificates![0].verifyCode).toBe('CODE1');
  });

  it('reveals mastery only with showMastery', () => {
    const view = toEmployerView(withProfile({ showMastery: true }))!;
    expect(view.mastery).toHaveLength(2);
  });
});

describe('portfolio', () => {
  it('respects both the section flag and each project flag', () => {
    const view = toEmployerView(withProfile({ showPortfolio: true }))!;
    expect(view.projects).toHaveLength(1);
    expect(view.projects![0].title).toBe('Eval harness');
  });

  it('does not leak a hidden project through any field', () => {
    const view = toEmployerView(withProfile({ showPortfolio: true }))!;
    expect(JSON.stringify(view)).not.toContain('Hidden side project');
    expect(view.skills).not.toContain('rust');
  });

  it('labels provenance so employers can tell graded work from self-reported', () => {
    const view = toEmployerView(withProfile({ showPortfolio: true }))!;
    expect(view.projects![0].provenance).toBe('curriculum');
  });

  it('treats any unrecognised source as self-reported rather than verified', () => {
    const view = toEmployerView({
      ...withProfile({ showPortfolio: true }),
      projects: [
        {
          id: 'p3',
          title: 'Claimed',
          description: 'x',
          source: 'totally-legit',
          repoUrl: null,
          liveUrl: null,
          skills: '[]',
          isVisible: true,
          order: 0,
        },
      ],
    })!;
    expect(view.projects![0].provenance).toBe('self');
  });
});

describe('searchable skills', () => {
  it('is empty when nothing is visible, so hidden data cannot be used as a search oracle', () => {
    expect(toEmployerView(input())!.skills).toEqual([]);
  });

  it('derives skills from visible projects only', () => {
    const view = toEmployerView(withProfile({ showPortfolio: true }))!;
    expect(view.skills).toEqual(['evals', 'typescript']);
  });

  it('adds mastered domains but not unmastered ones', () => {
    const view = toEmployerView(withProfile({ showMastery: true }))!;
    expect(view.skills).toContain('agent-foundations');
    expect(view.skills).not.toContain('memory');
  });
});

describe('links', () => {
  it('drops non-http schemes', () => {
    const view = toEmployerView({
      ...withProfile({ showLinks: true }),
      profile: {
        ...baseProfile,
        showLinks: true,
        // eslint-disable-next-line no-script-url
        links: JSON.stringify([{ label: 'Bad', url: 'javascript:alert(1)' }]),
      },
    })!;
    expect(view.links).toEqual([]);
  });

  it('survives corrupt JSON without throwing', () => {
    const view = toEmployerView({
      ...withProfile({ showLinks: true }),
      profile: { ...baseProfile, showLinks: true, links: 'not json' },
    })!;
    expect(view.links).toEqual([]);
  });
});

describe('work shape', () => {
  it('reports what the learner asked for and carries no health-adjacent field', () => {
    const view = toEmployerView(input())!;
    expect(view.workShape).toMatchObject({
      openToWork: true,
      remote: true,
      async: true,
      partTime: true,
      flexibleHours: true,
      contract: false,
      hoursPerWeekMin: 10,
      hoursPerWeekMax: 20,
    });

    const keys = JSON.stringify(view).toLowerCase();
    for (const forbidden of ['diagnos', 'disabilit', 'accommodation', 'illness', 'condition', 'health']) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it('is always present, so "not looking" is expressible rather than absent', () => {
    const view = toEmployerView(withProfile({ openToWork: false }))!;
    expect(view.workShape.openToWork).toBe(false);
  });
});

describe('directory cards', () => {
  it('withholds the summary and full bodies, exposing counts instead', () => {
    const card = toDirectoryCard(
      withProfile({ showPortfolio: true, showCertificates: true, showMastery: true }),
    )!;
    expect('summary' in card).toBe(false);
    expect('projects' in card).toBe(false);
    expect(card.projectCount).toBe(1);
    expect(card.certificateCount).toBe(1);
    expect(card.masteredDomainCount).toBe(1);
  });

  it('still carries the matchable skills so filtering works on lists', () => {
    const card = toDirectoryCard(withProfile({ showPortfolio: true }))!;
    expect(card.skills).toEqual(['evals', 'typescript']);
  });
});

describe('self preview', () => {
  it('lifts only the discoverability gate, so a learner can check before going live', () => {
    const preview = toSelfPreview(withProfile({ isDiscoverable: false, showCountry: true }));
    expect(preview.country).toBe('AT');
    expect(preview.displayName).toBe('srs-abc123');
  });

  it('keeps every other flag honest — a hidden field is hidden in the preview too', () => {
    const preview = toSelfPreview(withProfile({ isDiscoverable: false }));
    expect('country' in preview).toBe(false);
    expect('projects' in preview).toBe(false);
  });
});

describe('contact release', () => {
  const user = { name: 'Real Name', email: 'learner@example.com' };

  it('refuses on a pending request', () => {
    expect(releaseContact({ status: 'pending', contactReleasedAt: null }, user)).toBeNull();
  });

  it('refuses on a declined request', () => {
    expect(releaseContact({ status: 'declined', contactReleasedAt: null }, user)).toBeNull();
  });

  it('refuses on a withdrawn request even if a release timestamp somehow exists', () => {
    expect(
      releaseContact({ status: 'withdrawn', contactReleasedAt: new Date() }, user),
    ).toBeNull();
  });

  it('releases only on an accepted request', () => {
    const released = releaseContact(
      { status: 'accepted', contactReleasedAt: new Date('2026-07-01T00:00:00Z') },
      user,
    );
    expect(released).toEqual({
      name: 'Real Name',
      email: 'learner@example.com',
      releasedAt: '2026-07-01T00:00:00.000Z',
    });
  });

  it('does not expose an empty name as a blank string', () => {
    const released = releaseContact(
      { status: 'accepted', contactReleasedAt: new Date('2026-07-01T00:00:00Z') },
      { name: null, email: 'learner@example.com' },
    );
    expect(released!.name).toBe('Soft Reset School graduate');
  });
});

describe('normaliseSkillKey', () => {
  it('lowercases and hyphenates so filters match regardless of how it was typed', () => {
    expect(normaliseSkillKey('  Prompt   Engineering ')).toBe('prompt-engineering');
  });

  it('caps length so a skill field cannot be used to smuggle a payload', () => {
    expect(normaliseSkillKey('a'.repeat(200))).toHaveLength(40);
  });
});
