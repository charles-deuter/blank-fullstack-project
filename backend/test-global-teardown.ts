import type { Config } from '@jest/types';

type PgGlobal = { __pgContainer?: { stop(): Promise<unknown> } };

// In watch mode the container outlives this hook so the next re-run skips the
// boot; Testcontainers' reaper removes it once the watch process exits.
export default async function globalTeardown(globalConfig: Config.GlobalConfig) {
  if (globalConfig.watch || globalConfig.watchAll) return;

  await (globalThis as PgGlobal).__pgContainer?.stop();
  delete (globalThis as PgGlobal).__pgContainer;
}
