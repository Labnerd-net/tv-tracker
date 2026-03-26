import { hc } from 'hono/client';
import type { AppType } from '@api/app';
import { authenticatedFetch } from './requests';

export const client = hc<AppType>('/', { fetch: authenticatedFetch });
