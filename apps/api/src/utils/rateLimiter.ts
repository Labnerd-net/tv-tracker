/**
 * Simple in-memory rate limiter middleware for Hono
 * Tracks requests by IP address to prevent brute force attacks
 */

import { getConnInfo } from '@hono/node-server/conninfo';
import type { Context, Next } from 'hono';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// WARNING: In-memory store — state resets on process restart and does not
// synchronise across multiple API instances. Use a shared store (e.g. Redis)
// for multi-instance deployments.
const store = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
}

/**
 * Normalise an IPv4-mapped IPv6 address to plain IPv4.
 * e.g. "::ffff:127.0.0.1" → "127.0.0.1"
 */
function normaliseIp(ip: string): string {
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? mapped[1] : ip;
}

/**
 * Returns true when the given IP is a loopback address or RFC 1918 private range.
 * These are the only addresses that should be trusted as proxy intermediaries.
 */
export function isTrustedProxy(ip: string): boolean {
  const normalised = normaliseIp(ip);

  if (normalised === '127.0.0.1' || normalised === '::1') return true;

  const parts = normalised.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;

  const [a, b] = parts;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

// Probability of running a full store sweep on any given request.
// At 1%, ~1 in 100 requests will purge expired entries.
const CLEANUP_PROBABILITY = 0.01;

export function rateLimit(config: RateLimitConfig) {
  const { windowMs, maxRequests, message = 'Too many requests, please try again later' } = config;

  return async (c: Context, next: Next) => {
    // Resolve client IP — only trust forwarded headers from known proxy IPs
    let socketIp: string;
    try {
      socketIp = getConnInfo(c).remote.address ?? 'unknown';
    } catch {
      socketIp = 'unknown';
    }
    const ip = isTrustedProxy(socketIp)
      ? (c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
         c.req.header('x-real-ip') ||
         c.req.header('cf-connecting-ip') ||
         socketIp)
      : socketIp;

    const now = Date.now();
    const key = `${ip}:${c.req.path}`;

    let entry = store.get(key);

    // Initialize or reset entry if window expired
    if (!entry || entry.resetAt < now) {
      entry = {
        count: 0,
        resetAt: now + windowMs,
      };
      store.set(key, entry);
    }

    entry.count++;

    // Probabilistic cleanup: sweep expired entries on ~1% of requests
    if (Math.random() < CLEANUP_PROBABILITY) {
      for (const [k, e] of store.entries()) {
        if (e.resetAt < now) store.delete(k);
      }
    }

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      c.header('Retry-After', retryAfter.toString());
      return c.json(
        {
          ok: false,
          error: message,
          retryAfter,
        },
        429
      );
    }

    // Add rate limit headers
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', (maxRequests - entry.count).toString());
    c.header('X-RateLimit-Reset', new Date(entry.resetAt).toISOString());

    await next();
  };
}

/**
 * Preset: Strict rate limit for authentication endpoints
 * 5 attempts per 15 minutes
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

/**
 * Preset: Moderate rate limit for general API endpoints
 * 100 requests per 15 minutes
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many requests. Please try again later.',
});

export function resetForTesting() { store.clear(); }
