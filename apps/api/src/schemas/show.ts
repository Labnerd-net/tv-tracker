import { z } from 'zod';

export const tvMazeShowBodySchema = z.looseObject({
  id: z.number({ error: 'Missing or invalid show id in request body' }),
  name: z.string({ error: 'Missing or invalid show name in request body' }),
});

export const numericIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a positive integer'),
});
