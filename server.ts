import { createApp } from './backend/src/app.js';
import { getDb } from './backend/src/db/database.js';
import { seedDatabase } from './backend/src/db/seed.js';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import express from 'express';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

async function bootstrap() {
  try {
    // 1. Initialize SQLite Database & Tables
    const db = await getDb();
    console.log('[Database] Connected to SQLite database.');

    // 2. Ensure Seed Data
    const seed = await seedDatabase(db);
    console.log(`[Seed] ${seed.message} (${seed.count} total internships).`);

    // 3. Create Express App (with /api routes already mounted)
    const app = createApp();

    // 4. Mount Vite middlewares in development mode as required
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distDir = path.resolve(process.cwd(), 'dist');
      if (fs.existsSync(distDir)) {
        app.use(express.static(distDir));
        app.get('*', (req, res) => {
          res.sendFile(path.join(distDir, 'index.html'));
        });
      } else {
        const frontendDir = path.resolve(process.cwd(), 'frontend');
        app.use(express.static(frontendDir));
        app.get('*', (req, res) => {
          res.sendFile(path.join(frontendDir, 'index.html'));
        });
      }
    }

    // 5. Start Listening on Port 3000
    app.listen(PORT, HOST, () => {
      console.log(`[InternHub] Full-Stack Server active on http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error('[Bootstrap Error]:', err);
    process.exit(1);
  }
}

bootstrap();
