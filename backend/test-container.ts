const { PostgreSqlContainer } = require('@testcontainers/postgresql');

// One reusable container per machine. `withReuse()` makes start() attach to a
// running container with the same config instead of booting a new one, so only
// the first run pays the startup cost. Remove it with `docker rm -f blank-fullstack-test-pg`.
export function postgresContainer() {
  return new PostgreSqlContainer('postgres:16-alpine')
    .withName('blank-fullstack-test-pg')
    .withDatabase('test_db')
    .withUsername('test_user')
    .withPassword('test_password')
    .withReuse();
}
