/** Shared runtime constants — override via env vars for different deployments */

export const GROQ_MODEL       = process.env.GROQ_MODEL       || 'llama-3.3-70b-versatile';
export const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '3', 10);
export const GROQ_TIMEOUT_MS  = parseInt(process.env.GROQ_TIMEOUT_MS  || '45000', 10);

export const CACHE_TTL = {
  assignments: 30,   // seconds
  papers:      300,  // 5 minutes
};

/** Rejects after `ms` milliseconds — use with Promise.race for API timeouts */
export function withTimeout<T>(promise: Promise<T>, ms: number = GROQ_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
    ),
  ]);
}
