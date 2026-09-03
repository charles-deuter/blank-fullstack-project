import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

const NodeEnvironment = require('jest-environment-node').TestEnvironment;
const { PostgreSqlContainer } = require('@testcontainers/postgresql');

class PostgresEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup();

    this.container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_password')
      .start();

    const host = this.container.getHost();
    const port = this.container.getPort();
    const dbname = this.container.getDatabase();
    const username = this.container.getUsername();
    const password = this.container.getPassword();

    const client = new Client({
      connectionString: this.container.getConnectionUri(),
    });
    await client.connect();

    const db = drizzle(client);
    try {
      await migrate(db, {
        migrationsFolder: './migrations',
      });
    } catch (error) {
      if (error instanceof Error) {
        console.log(error.message);
      } else {
        console.log('Unexpected error type:', error);
      }

      throw new Error('Unable to apply migrations');
    }
    await client.end();

    this.global.process.env.DATABASE_HOST = host;
    this.global.process.env.DATABASE_PORT = port.toString();
    this.global.process.env.DATABASE_NAME = dbname;
    this.global.process.env.DATABASE_USER = username;
    this.global.process.env.DATABASE_PASSWORD = password;
  }

  async teardown() {
    if (this.container) {
      await this.container.stop();
    }

    await super.teardown();
  }
}

module.exports = PostgresEnvironment;
