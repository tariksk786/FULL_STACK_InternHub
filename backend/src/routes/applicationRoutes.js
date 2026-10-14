import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { submitApplication } from '../controllers/applicationController.js';
import { validateApplication } from '../middleware/validation.js';

const router = Router();

// Strict rate limiter for application submissions:
// 5 submissions per 15 minutes per IP address
export const applicationSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true, // Return standard `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  statusCode: 429,
  message: {
    success: false,
    message: 'Too many applications submitted from this IP address. Please wait 15 minutes before submitting again.'
  }
});

// POST /api/applications
router.post('/', applicationSubmissionLimiter, validateApplication, submitApplication);

export default router;
