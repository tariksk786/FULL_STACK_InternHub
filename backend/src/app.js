import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import internshipRoutes from './routes/internshipRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Trust reverse proxy (e.g. Google Cloud Run, Nginx, AI Studio proxy)
  app.set('trust proxy', 1);

  // Security Headers via Helmet with iframe support for AI Studio preview
  app.use(
    helmet({
      frameguard: false, // Disables X-Frame-Options: SAMEORIGIN so AI Studio iFrame can embed
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https:', 'http:', 'ws:', 'wss:'],
          frameAncestors: ['*'], // Allow AI Studio dev environment iframe
          objectSrc: ["'none'"],
          upgradeInsecureRequests: []
        }
      },
      crossOriginEmbedderPolicy: false
    })
  );

  // Permissive CORS for development/preview iframe
  app.use(
    cors({
      origin: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: false
    })
  );

  // General Read/API Rate Limiting (150 requests per 15 min per IP)
  const apiGeneralLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP address. Please try again later.'
    }
  });

  // Apply general limiter to /api routes
  app.use('/api', apiGeneralLimiter);

  // Body parser with strict size limits (100KB) to prevent payload exhaustion attacks
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      status: 'healthy',
      service: 'internhub-api',
      timestamp: new Date().toISOString()
    });
  });

  // Mount API routes
  app.use('/api/internships', internshipRoutes);
  app.use('/api/applications', applicationRoutes);

  // Serve static assets from frontend directory as fallback
  const frontendDir = path.resolve(process.cwd(), 'frontend');
  app.use('/frontend', express.static(frontendDir));

  // 404 handler for unmatched API routes
  app.use('/api/*', notFoundHandler);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
