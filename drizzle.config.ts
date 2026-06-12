import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // Specify your database dialect: 'postgresql', 'mysql', or 'sqlite'
  dialect: 'postgresql',

  // Path to your schema file(s). You can use a glob for multiple files.
  schema: './src/database/schema.ts',

  // Folder where Drizzle Kit will store snapshots (not strictly for push, but required)
  out: './drizzle',

  // Database connection details
  dbCredentials: {
    host: process.env.DATABASE_HOST!,
    port: Number(process.env.DATABASE_PORT) || 5432,
    user: process.env.DATABASE_USER!,
    password: process.env.DATABASE_PASSWORD!,
    database: process.env.DATABASE_NAME!,
  },
});
