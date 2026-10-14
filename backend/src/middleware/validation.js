/**
 * Server-Side Validation Middleware for InternHub
 * Enforces strict input validation, type safety, field boundaries, and unexpected-field rejection.
 */

// Email regex matching standard RFC 5322 pattern
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Reasonable international/domestic phone regex (digits, optional +, spaces, dashes, parentheses)
const PHONE_REGEX = /^\+?[\d\s\-().]{10,20}$/;

const ALLOWED_APPLICATION_FIELDS = new Set([
  'internshipId',
  'internship_id',
  'fullName',
  'full_name',
  'email',
  'phone',
  'college',
  'degree',
  'graduationYear',
  'graduation_year',
  'skills',
  'coverLetter',
  'cover_letter'
]);

/**
 * Validates the internship application submission payload.
 */
export function validateApplication(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request body format. JSON object required.',
      errors: { body: 'Request body must be a valid JSON object.' }
    });
  }

  // Reject unexpected fields to prevent prototype pollution or parameter tampering
  const incomingKeys = Object.keys(body);
  const unexpectedKeys = incomingKeys.filter(k => !ALLOWED_APPLICATION_FIELDS.has(k));
  if (unexpectedKeys.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Unexpected fields in payload: ${unexpectedKeys.join(', ')}`,
      errors: { fields: `Rejected unrecognized properties: ${unexpectedKeys.join(', ')}` }
    });
  }

  const errors = {};

  // 1. Internship ID
  const rawId = body.internship_id !== undefined ? body.internship_id : body.internshipId;
  const internshipId = Number(rawId);
  if (rawId === undefined || rawId === null || rawId === '' || !Number.isInteger(internshipId) || internshipId <= 0) {
    errors.internship_id = 'A valid positive integer internship ID is required.';
  }

  // 2. Full Name
  const rawName = body.full_name !== undefined ? body.full_name : body.fullName;
  if (typeof rawName !== 'string' || rawName.trim().length < 2 || rawName.trim().length > 100) {
    errors.full_name = 'Full name is required and must be between 2 and 100 characters.';
  }

  // 3. Email
  const rawEmail = body.email;
  if (typeof rawEmail !== 'string' || !EMAIL_REGEX.test(rawEmail.trim()) || rawEmail.trim().length > 120) {
    errors.email = 'A valid email address is required (maximum 120 characters).';
  }

  // 4. Phone
  const rawPhone = body.phone;
  if (typeof rawPhone !== 'string' || !PHONE_REGEX.test(rawPhone.trim())) {
    errors.phone = 'A valid phone number is required (10-20 characters, containing only digits, +, -, and spaces).';
  }

  // 5. College / University
  const rawCollege = body.college;
  if (typeof rawCollege !== 'string' || rawCollege.trim().length < 2 || rawCollege.trim().length > 150) {
    errors.college = 'College/University name is required and must be between 2 and 150 characters.';
  }

  // 6. Degree / Course
  const rawDegree = body.degree;
  if (typeof rawDegree !== 'string' || rawDegree.trim().length < 2 || rawDegree.trim().length > 100) {
    errors.degree = 'Course/Degree is required and must be between 2 and 100 characters.';
  }

  // 7. Graduation Year
  const rawYear = body.graduation_year !== undefined ? body.graduation_year : body.graduationYear;
  const gradYear = Number(rawYear);
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 5;
  const maxYear = currentYear + 8;
  if (rawYear === undefined || rawYear === null || !Number.isInteger(gradYear) || gradYear < minYear || gradYear > maxYear) {
    errors.graduation_year = `Graduation year must be a reasonable 4-digit year between ${minYear} and ${maxYear}.`;
  }

  // 8. Skills
  const rawSkills = body.skills;
  let parsedSkills = [];
  if (Array.isArray(rawSkills)) {
    parsedSkills = rawSkills
      .map(s => (typeof s === 'string' ? s.trim() : ''))
      .filter(s => s.length > 0);
  } else if (typeof rawSkills === 'string') {
    parsedSkills = rawSkills
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  if (parsedSkills.length === 0) {
    errors.skills = 'At least one skill is required.';
  } else if (parsedSkills.length > 20) {
    errors.skills = 'Maximum of 20 skills allowed.';
  } else if (parsedSkills.some(s => s.length > 50)) {
    errors.skills = 'Individual skills must not exceed 50 characters.';
  }

  // 9. Cover Letter (Optional)
  const rawCover = body.cover_letter !== undefined ? body.cover_letter : body.coverLetter;
  if (rawCover !== undefined && rawCover !== null && typeof rawCover === 'string' && rawCover.length > 2000) {
    errors.cover_letter = 'Cover letter must not exceed 2000 characters.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed for one or more fields.',
      errors
    });
  }

  // Attach sanitized and normalized payload to req.validatedData
  req.validatedData = {
    internship_id: internshipId,
    full_name: rawName.trim(),
    email: rawEmail.trim().toLowerCase(),
    phone: rawPhone.trim(),
    college: rawCollege.trim(),
    degree: rawDegree.trim(),
    graduation_year: gradYear,
    skills: parsedSkills,
    cover_letter: (typeof rawCover === 'string' ? rawCover.trim() : '')
  };

  next();
}
