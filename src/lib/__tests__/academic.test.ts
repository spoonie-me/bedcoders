import { describe, it, expect } from 'vitest';
import { isAcademicEmail } from '../academic';

describe('isAcademicEmail', () => {
  it.each([
    ['student@mit.edu', true],
    ['prof@oxford.ac.uk', true],
    ['user@tu-wien.ac.at', true],
    ['s@uni.edu.au', true],
    ['x@uni.ac.jp', true],
    ['x@uni.edu.sg', true],
  ])('accepts academic domain %s', (email, expected) => {
    expect(isAcademicEmail(email)).toBe(expected);
  });

  it.each([
    ['user@gmail.com', false],
    ['founder@bedcoders.com', false],
    ['no-at-symbol', false],
    ['', false],
    ['@no-local.edu', true],
    ['UPPER@MIT.EDU', true],
  ])('rejects non-academic / handles edge case %s', (email, expected) => {
    expect(isAcademicEmail(email)).toBe(expected);
  });

  it('handles malformed input without throwing', () => {
    expect(() => isAcademicEmail(undefined as unknown as string)).not.toThrow();
    expect(isAcademicEmail(undefined as unknown as string)).toBe(false);
  });
});
