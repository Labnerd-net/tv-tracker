// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validationHook = (result: any, c: any) => {
  if (!result.success) {
    return c.json({ ok: false, error: result.error.issues[0].message }, 400);
  }
};
