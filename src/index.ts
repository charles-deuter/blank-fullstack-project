import app from './app';
import dotenv from 'dotenv';
import { pool } from './database/db';
dotenv.config();

const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing database pool');
  await pool.end();
  console.log('Database pool closed');
  process.exit(0);
});
