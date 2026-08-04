import { describe, it, expect } from 'vitest';
import {
  formatSalary,
  formatHours,
  jobTags,
  workShapeTags,
  visibleFieldCount,
  type Job,
  type OwnTalentProfile,
  type WorkShape,
} from '../hiring';

const shape = (overrides: Partial<WorkShape> = {}): WorkShape => ({
  openToWork: true,
  remote: false,
  async: false,
  partTime: false,
  flexibleHours: false,
  contract: false,
  ...overrides,
});

describe('formatSalary', () => {
  it('renders a range with the period suffix', () => {
    expect(formatSalary({ min: 50000, max: 70000, currency: 'EUR', period: 'year' })).toContain('/yr');
  });

  it('collapses an equal min and max to a single figure', () => {
    const out = formatSalary({ min: 60000, max: 60000, currency: 'EUR', period: 'year' });
    expect(out).not.toContain('–');
  });

  it('uses the hourly suffix for hourly pay', () => {
    expect(formatSalary({ min: 40, max: 60, currency: 'EUR', period: 'hour' })).toContain('/hr');
  });

  it('says so plainly rather than inventing "competitive" when a range is missing', () => {
    expect(formatSalary({ min: null, max: null, currency: 'EUR', period: 'year' })).toBe(
      'Pay range not stated',
    );
  });
});

describe('formatHours', () => {
  it('returns null when nothing is set, so callers can omit the chip', () => {
    expect(formatHours(null, null)).toBeNull();
  });

  it('renders a range', () => {
    expect(formatHours(10, 20)).toBe('10–20 hrs/week');
  });

  it('collapses an equal min and max', () => {
    expect(formatHours(15, 15)).toBe('15 hrs/week');
  });

  it('handles an open-ended lower bound', () => {
    expect(formatHours(10, null)).toBe('From 10 hrs/week');
  });

  it('handles an open-ended upper bound', () => {
    expect(formatHours(null, 20)).toBe('Up to 20 hrs/week');
  });
});

describe('workShapeTags', () => {
  it('lists only what the learner asked for', () => {
    expect(workShapeTags(shape({ remote: true, async: true }))).toEqual(['Remote', 'Async']);
  });

  it('is empty when nothing is set rather than defaulting to anything', () => {
    expect(workShapeTags(shape())).toEqual([]);
  });

  it('keeps a stable order regardless of which flags are on', () => {
    const all = workShapeTags(
      shape({ remote: true, async: true, partTime: true, flexibleHours: true, contract: true }),
    );
    expect(all).toEqual(['Remote', 'Async', 'Flexible hours', 'Part time', 'Contract']);
  });

  it('does not encode openToWork as a tag — that is a separate state', () => {
    expect(workShapeTags(shape({ openToWork: false, remote: true }))).toEqual(['Remote']);
  });
});

describe('jobTags', () => {
  const job = (overrides: Partial<Job> = {}): Job =>
    ({
      id: 'j1',
      title: 'Role',
      description: '',
      location: null,
      isRemote: false,
      isAsyncFriendly: false,
      hasFlexibleHours: false,
      employmentType: 'full_time',
      hoursPerWeekMin: null,
      hoursPerWeekMax: null,
      salary: { min: 1, max: 2, currency: 'EUR', period: 'year' },
      skills: [],
      status: 'published',
      publishedAt: null,
      closesAt: null,
      company: null,
      ...overrides,
    }) as Job;

  it('surfaces the flags this audience filters on', () => {
    expect(jobTags(job({ isRemote: true, isAsyncFriendly: true, hasFlexibleHours: true }))).toEqual([
      'Remote',
      'Async',
      'Flexible hours',
    ]);
  });

  it('claims nothing when the employer claimed nothing', () => {
    expect(jobTags(job())).toEqual([]);
  });
});

describe('visibleFieldCount', () => {
  const profile = (overrides: Partial<OwnTalentProfile> = {}): OwnTalentProfile =>
    ({
      showRealName: false,
      showCountry: false,
      showTimeZone: false,
      showPortfolio: false,
      showCertificates: false,
      showMastery: false,
      showLinks: false,
      ...overrides,
    }) as OwnTalentProfile;

  it('is zero for a fresh profile — nothing is shared by default', () => {
    expect(visibleFieldCount(profile())).toBe(0);
  });

  it('counts each opted-in field', () => {
    expect(visibleFieldCount(profile({ showRealName: true, showPortfolio: true }))).toBe(2);
  });

  it('tops out at the seven optional fields', () => {
    expect(
      visibleFieldCount(
        profile({
          showRealName: true,
          showCountry: true,
          showTimeZone: true,
          showPortfolio: true,
          showCertificates: true,
          showMastery: true,
          showLinks: true,
        }),
      ),
    ).toBe(7);
  });
});
