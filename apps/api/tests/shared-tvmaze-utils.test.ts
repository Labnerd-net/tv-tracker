import { describe, it, expect } from 'vitest';
import { sanitizeTvMazeImageUrl } from '@shared/utils/tvmaze.js';

describe('sanitizeTvMazeImageUrl', () => {
  it('returns the URL unchanged for a valid https://static.tvmaze.com URL', () => {
    const url = 'https://static.tvmaze.com/uploads/images/medium_portrait/0/1.jpg';
    expect(sanitizeTvMazeImageUrl(url)).toBe(url);
  });

  it('returns empty string for an HTTP URL', () => {
    expect(sanitizeTvMazeImageUrl('http://static.tvmaze.com/img.jpg')).toBe('');
  });

  it('returns empty string for a wrong hostname', () => {
    expect(sanitizeTvMazeImageUrl('https://evil.example.com/img.jpg')).toBe('');
  });

  it('returns empty string for a subdomain of static.tvmaze.com', () => {
    expect(sanitizeTvMazeImageUrl('https://sub.static.tvmaze.com/img.jpg')).toBe('');
  });

  it('returns empty string for null', () => {
    expect(sanitizeTvMazeImageUrl(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(sanitizeTvMazeImageUrl(undefined)).toBe('');
  });

  it('returns empty string for an empty string', () => {
    expect(sanitizeTvMazeImageUrl('')).toBe('');
  });
});
