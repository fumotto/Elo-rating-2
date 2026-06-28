export type RetryOptions = {
  retries?: number;
  initialDelayMs?: number;
};

export async function withRetries<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
) {
  const retries = opts.retries ?? 2;
  const initialDelayMs = opts.initialDelayMs ?? 300;

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt += 1;
      const msg = err && err.message ? String(err.message) : "";
      const status = err && (err.status || err.statusCode);

      const isTransient =
        /failed to fetch|network|timeout|timed out/i.test(msg) ||
        (typeof status === "number" && (status >= 500 || status === 429));

      if (attempt > retries || !isTransient) {
        throw err;
      }

      const wait = initialDelayMs * Math.pow(2, attempt - 1);
      // simple backoff
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}
