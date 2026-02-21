import { createHash, randomUUID } from 'node:crypto';

export function generateRefreshToken(): { raw: string; hash: string } {
  const raw = randomUUID();
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}
