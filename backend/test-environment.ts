import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

const NodeEnvironment = require('jest-environment-node').TestEnvironment;

// Each spec file gets its own freshly migrated database on the container that
// test-global-setup.ts started.
class PostgresEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup();

    const adminUri = process.env.TEST_PG_URI;
    if (!adminUri) {
      throw new Error(
        'TEST_PG_URI is not set; is globalSetup configured in jest.config.ts?',
      );
    }
    this.adminUri = adminUri;
    this.dbName = `test_${randomUUID().replace(/-/g, '')}`;

    await this.runAsAdmin(`CREATE DATABASE "${this.dbName}"`);

    const dbUri = new URL(adminUri);
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

    this.global.process.env.DATABASE_HOST = dbUri.hostname;
    this.global.process.env.DATABASE_PORT = dbUri.port;
    this.global.process.env.DATABASE_NAME = this.dbName;
    this.global.process.env.DATABASE_USER = decodeURIComponent(dbUri.username);
    this.global.process.env.DATABASE_PASSWORD = decodeURIComponent(dbUri.password);
  }

  async teardown() {
    if (this.dbName) {
      // FORCE closes any straggling connections so the drop cannot hang.
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
