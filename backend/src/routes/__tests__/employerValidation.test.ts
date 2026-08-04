// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';

// These two used to be regexes over unbounded request-body strings, and CodeQL
// flagged both as polynomial-backtracking sinks. They were rewritten to run in
// linear time; these tests pin the behaviour so the rewrite cannot quietly
// change what counts as a valid email or what a company slug looks like.

let isValidEmail: (value: string) => boolean;
let slugify: (name: string) => string;

beforeAll(async () => {
  process.env.JWT_SECRET ??= 'test-secret-that-is-long-enough-for-hs256';
  process.env.DATABASE_URL ??= 'postgresql://user:pass@localhost:5432/db?schema=bedcoders';
  const mod = await import('../employers.js');
  isValidEmail = mod.isValidEmail;
  slugify = mod.slugify;
});

describe('isValidEmail', () => {
  it.each([
    'a@b.co',
    'someone@example.com',
    'first.last@sub.domain.example.co.uk',
    'user+tag@example.org',
  ])('accepts %s', (value) => {
    expect(isValidEmail(value)).toBe(true);
  });

  it.each([
    ['empty', ''],
    ['no at sign', 'nobody.example.com'],
    ['two at signs', 'a@b@example.com'],
    ['leading at sign', '@example.com'],
    ['no domain', 'someone@'],
    ['no dot in domain', 'someone@example'],
    ['dot leads the domain', 'someone@.com'],
    ['dot ends the domain', 'someone@example.'],
    ['whitespace in local part', 'some one@example.com'],
    ['whitespace in domain', 'someone@exa mple.com'],
  ])('rejects %s', (_label, value) => {
    expect(isValidEmail(value)).toBe(false);
  });

  it('rejects anything past the RFC practical maximum', () => {
    expect(isValidEmail(`${'a'.repeat(250)}@example.com`)).toBe(false);
  });

  it('stays linear on the input CodeQL called out', () => {
    // The old regex backtracked on runs of "!." after an "@". Bounded input
    // plus index scanning means this returns immediately.
    const hostile = `!@!.${'!.'.repeat(5000)}`;
    const started = performance.now();
    expect(isValidEmail(hostile)).toBe(false);
    expect(performance.now() - started).toBeLessThan(50);
  });
});

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Acme Widgets')).toBe('acme-widgets');
  });

  it('collapses runs of punctuation into a single separator', () => {
    expect(slugify('Acme  ***  Widgets')).toBe('acme-widgets');
  });

  it('trims leading and trailing separators', () => {
    expect(slugify('---Acme---')).toBe('acme');
  });

  it('falls back rather than returning an empty slug', () => {
    expect(slugify('!!!')).toBe('company');
    expect(slugify('')).toBe('company');
  });

  it('caps the slug length', () => {
    expect(slugify('a'.repeat(200)).length).toBeLessThanOrEqual(48);
  });

  it('stays linear on the input CodeQL called out', () => {
    const hostile = '-'.repeat(50000);
    const started = performance.now();
    expect(slugify(hostile)).toBe('company');
    expect(performance.now() - started).toBeLessThan(50);
  });
});
