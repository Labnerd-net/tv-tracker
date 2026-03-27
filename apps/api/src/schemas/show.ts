import { z } from 'zod';

const scheduleSchema = z.object({
  days: z.array(z.string()),
  time: z.string(),
});

const episodeLinkSchema = z.object({ href: z.string() });

const linksSchema = z.object({
  nextepisode: episodeLinkSchema.nullable().optional(),
  previousepisode: episodeLinkSchema.nullable().optional(),
});

const networkSchema = z.object({ name: z.string() });

const imageSchema = z.object({ medium: z.string() });

const embeddedEpisodeSchema = z.object({ airdate: z.string() });

const embeddedSchema = z.object({
  nextepisode: embeddedEpisodeSchema.nullable().optional(),
  previousepisode: embeddedEpisodeSchema.nullable().optional(),
});

export const tvMazeShowBodySchema = z.object({
  id: z.number({ error: 'Missing or invalid show id in request body' }),
  name: z.string({ error: 'Missing or invalid show name in request body' }),
  status: z.string().optional(),
  schedule: scheduleSchema.optional(),
  _links: linksSchema.optional(),
  image: imageSchema.nullable().optional(),
  network: networkSchema.nullable().optional(),
  webChannel: networkSchema.nullable().optional(),
  _embedded: embeddedSchema.nullable().optional(),
});

export type TvMazeShowInput = z.infer<typeof tvMazeShowBodySchema>;

export const numericIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a positive integer'),
});
