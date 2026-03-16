import type { Hook } from '@hono/zod-validator';

export const validationHook: Hook<unknown, any, any> = (result, c) => {
  if (!result.success) {
    return c.json({ ok: false, error: result.error.issues[0].message }, 400);
  }
};
