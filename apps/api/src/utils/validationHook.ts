import type { Hook } from '@hono/zod-validator';
import type { BlankEnv } from 'hono/types';

export const validationHook: Hook<unknown, BlankEnv, string> = (result, c) => {
  if (!result.success) {
    return c.json({ ok: false, error: result.error.issues[0].message }, 400);
  }
};
