// First import, so DATABASE_* and PORT are populated before ./app pulls in the
// database module and builds the pool from them.
import 'dotenv/config';
import app from './app';
import { pool } from './database/db';

// 4000 matches .env.example, dev.sh and the READMEs; 3000 belongs to the frontend.
const PORT = process.env.PORT || 4000;

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
