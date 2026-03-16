export const ok = (data: unknown) => ({ ok: true, data });
export const err = (msg: string) => ({ ok: false, error: msg });
