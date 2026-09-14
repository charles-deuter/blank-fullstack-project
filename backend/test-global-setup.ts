import type { Config } from '@jest/types';

const { PostgreSqlContainer } = require('@testcontainers/postgresql');

type PgGlobal = { __pgContainer?: { stop(): Promise<unknown> } };

// One container per Jest process. Workers are forked after this runs, so they
// inherit TEST_PG_URI. Jest calls this hook on every watch-mode re-run, so the
// container started by an earlier run is kept instead of booted again.
export default async function globalSetup(_globalConfig: Config.GlobalConfig) {
  if ((globalThis as PgGlobal).__pgContainer) return;

  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('test_db')
    .withUsername('test_user')
    .withPassword('test_password')
    .start();

  process.env.TEST_PG_URI = container.getConnectionUri();
  (globalThis as PgGlobal).__pgContainer = container;
}
