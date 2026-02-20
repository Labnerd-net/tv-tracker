import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jwtSecret } from './envVars.js';

// Hash a plain‑text password (bcrypt, 10 rounds is a good default)
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

// Verify password against stored hash
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create a signed JWT for a given user id
export function signJwt(userId: number): string {
  return jwt.sign({ sub: userId }, jwtSecret, { expiresIn: '7d' });
}

// Middleware for protected routes – extracts user id from Authorization header
export async function authMiddleware(c: any, next: any) {
  const authHeader = c.req.header('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!token) {
    return c.json({ error: 'Missing token' }, 401);
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    // Attach user id to the context for downstream handlers
    c.set('userId', payload.sub);
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
}