import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const host = process.env.DATABASE_HOST;
const port = process.env.DATABASE_PORT;
const database = process.env.DATABASE_NAME;
const user = process.env.DATABASE_USER;
const password = process.env.DATABASE_PASSWORD;

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema.ts',
  out: './migrations',
  dbCredentials: {
    url: `postgres://${user}:${password}@${host}:${port}/${database}`,
  },
  migrations: {
    prefix: 'timestamp',
    schema: 'public',
  },
});
