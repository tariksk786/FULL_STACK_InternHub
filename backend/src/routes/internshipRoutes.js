import { Router } from 'express';
import { getAllInternships, getInternshipById } from '../controllers/internshipController.js';

const router = Router();

// GET /api/internships - List internships with search, filter, and pagination
router.get('/', getAllInternships);

// GET /api/internships/:id - Get single internship details
router.get('/:id', getInternshipById);

export default router;
