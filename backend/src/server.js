import { createApp } from './app.js';
import { getDb } from './db/database.js';
import { seedDatabase } from './db/seed.js';
import path from 'path';
import express from 'express';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

async function startServer() {
  try {
    // 1. Ensure database is connected and initialized
    const db = await getDb();
    console.log('[Database] SQLite connected and schema initialized.');

    // 2. Seed initial internships if empty
    const seedResult = await seedDatabase(db);
    console.log(`[Seed] ${seedResult.message} (${seedResult.count} internships available).`);

    // 3. Create Express App
    const app = createApp();

    // 4. Standalone static frontend serving
    const frontendDir = path.resolve(process.cwd(), 'frontend');
    app.use(express.static(frontendDir));
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendDir, 'index.html'));
    });

    // 5. Start Listening
    app.listen(PORT, HOST, () => {
      console.log(`[InternHub] Server running on http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('[Startup Error]:', error);
    process.exit(1);
  }
}

startServer();
