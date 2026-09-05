// Single source for the backend origin. Each server action used to carry its own
// `?? 'http://localhost:4000'` fallback; CONTEXT.md recorded that duplication as drift.
//
// This module is deliberately not `'use server'`: it exports plain values, and every
// export of a `'use server'` module becomes a public endpoint.
export const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

export function failureMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// The backend sends `{ message }` on a 4xx; fall back to the status when it didn't.
export async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.message ?? `${fallback} (HTTP ${res.status})`;
}
