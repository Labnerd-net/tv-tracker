import { z } from 'zod';

export const tvMazeShowBodySchema = z.looseObject({
  id: z.number({ error: 'Missing or invalid show id in request body' }),
  name: z.string().optional(),
});

export const numericIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a positive integer'),
});
