export function ensureNumericId(id: string): number {
  const n = Number(id);
  if (Number.isNaN(n)) throw new Error(`Invalid numeric ID: "${id}"`);
  return n;
}
