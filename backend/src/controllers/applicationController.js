import { getDb } from '../db/database.js';

/**
 * Controller: Submit an internship application
 * Handles verification, duplicate check, and parameterized insertion.
 */
export async function submitApplication(req, res, next) {
  try {
    const db = await getDb();
    const data = req.validatedData;

    // 1. Confirm the internship exists using parameterized query
    const internship = await db.get(
      'SELECT id, title FROM internships WHERE id = ?',
      [data.internship_id]
    );

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: `Internship with ID ${data.internship_id} does not exist.`
      });
    }

    // 2. Check for duplicate application (same internship and email)
    const existing = await db.get(
      'SELECT id FROM applications WHERE internship_id = ? AND LOWER(email) = LOWER(?)',
      [data.internship_id, data.email]
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted an application for this internship position.',
        data: {
          existingApplicationId: existing.id,
          internshipId: data.internship_id
        }
      });
    }

    // 3. Insert application using parameterized query
    const skillsJson = JSON.stringify(data.skills);
    const insertResult = await db.run(
      `INSERT INTO applications (
        internship_id, full_name, email, phone, college, degree, graduation_year, skills, cover_letter, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
      [
        data.internship_id,
        data.full_name,
        data.email,
        data.phone,
        data.college,
        data.degree,
        data.graduation_year,
        skillsJson,
        data.cover_letter || null
      ]
    );

    const applicationId = insertResult.lastID;

    // Return minimal response preserving privacy (no personal data in public API response)
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId,
        internshipId: data.internship_id,
        internshipTitle: internship.title,
        status: 'submitted',
        createdAt: new Date().toISOString()
      }
    });
  } catch (err) {
    // Check for SQLite UNIQUE constraint race condition
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        success: false,
        message: 'A duplicate application with this email already exists for this internship.'
      });
    }
    next(err);
  }
}
