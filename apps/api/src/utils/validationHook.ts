import type { Hook } from '@hono/zod-validator';
import type { BlankEnv } from 'hono/types';
import { err } from './response.js';

export const validationHook = ((result, c) => {
  if (!result.success) {
    return c.json(err(result.error.issues[0].message), 400);
  }
}) satisfies Hook<unknown, BlankEnv, string>;
