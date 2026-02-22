import type { ShowData } from '@shared/types/tv-tracker.ts';

export function sortShows(shows: ShowData[], col: keyof ShowData, dir: 'asc' | 'desc'): ShowData[] {
  return [...shows].sort((a, b) => {
    const valA = a[col] ?? null;
    const valB = b[col] ?? null;
    if (valA === null && valB === null) return 0;
    if (valA === null) return dir === 'asc' ? 1 : -1;
    if (valB === null) return dir === 'asc' ? -1 : 1;
    return dir === 'asc'
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });
}
