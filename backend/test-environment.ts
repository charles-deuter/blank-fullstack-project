import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { postgresContainer } from './test-container';

const NodeEnvironment = require('jest-environment-node').TestEnvironment;

// Each spec file gets its own freshly migrated database on the shared container.
class PostgresEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup();

    this.container = await postgresContainer().start();
    this.adminUri = this.container.getConnectionUri();
    this.dbName = `test_${randomUUID().replace(/-/g, '')}`;

    await this.runAsAdmin(`CREATE DATABASE "${this.dbName}"`);

    const dbUri = new URL(this.adminUri);
    dbUri.pathname = `/${this.dbName}`;

    const client = new Client({ connectionString: dbUri.toString() });
    await client.connect();
    try {
      await migrate(drizzle(client), { migrationsFolder: './migrations' });
    } catch (error) {
      console.log(error instanceof Error ? error.message : error);
      throw new Error('Unable to apply migrations');
    } finally {
      await client.end();
    }

    this.global.process.env.DATABASE_HOST = this.container.getHost();
    this.global.process.env.DATABASE_PORT = this.container.getPort().toString();
    this.global.process.env.DATABASE_NAME = this.dbName;
    this.global.process.env.DATABASE_USER = this.container.getUsername();
    this.global.process.env.DATABASE_PASSWORD = this.container.getPassword();
  }

  async teardown() {
    if (this.dbName) {
      // FORCE closes any straggling connections; the container itself stays up for reuse.
      await this.runAsAdmin(`DROP DATABASE IF EXISTS "${this.dbName}" WITH (FORCE)`);
    }

    await super.teardown();
  }

  async runAsAdmin(statement: string) {
    const admin = new Client({ connectionString: this.adminUri });
    await admin.connect();
    try {
      await admin.query(statement);
    } finally {
      await admin.end();
    }
  }
}

module.exports = PostgresEnvironment;
