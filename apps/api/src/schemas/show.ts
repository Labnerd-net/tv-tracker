import { z } from 'zod';

export const tvMazeShowBodySchema = z
  .object({
    id: z.number({ error: 'Missing or invalid show id in request body' }),
    name: z.string().optional(),
  })
  .passthrough();

export const numericIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a positive integer'),
});
