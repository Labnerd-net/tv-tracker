import { describe, it, expect } from 'vitest';
import { ensureNumericId } from '../src/db/helpers.js';

describe('ensureNumericId', () => {
  it('returns a number for a valid numeric string', () => {
    expect(ensureNumericId('42')).toBe(42);
  });

  it('throws for a non-numeric string', () => {
    expect(() => ensureNumericId('abc')).toThrow('Invalid numeric ID: "abc"');
  });
});
