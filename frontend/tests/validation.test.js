import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Client-side validation logic mirror for automated validation tests
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const PHONE_REGEX = /^\+?[\d\s\-().]{10,20}$/;

function validateClientField(fieldName, value) {
  const currentYear = new Date().getFullYear();

  switch (fieldName) {
    case 'fullName':
      if (!value || typeof value !== 'string' || value.trim().length < 2 || value.trim().length > 100) {
        return 'Full name must be between 2 and 100 characters.';
      }
      return null;

    case 'email':
      if (!value || typeof value !== 'string' || !EMAIL_REGEX.test(value.trim()) || value.trim().length > 120) {
        return 'Please enter a valid email address.';
      }
      return null;

    case 'phone':
      if (!value || typeof value !== 'string' || !PHONE_REGEX.test(value.trim())) {
        return 'Please enter a valid phone number (10–20 digits).';
      }
      return null;

    case 'college':
      if (!value || typeof value !== 'string' || value.trim().length < 2 || value.trim().length > 150) {
        return 'College / University name must be between 2 and 150 characters.';
      }
      return null;

    case 'degree':
      if (!value || typeof value !== 'string' || value.trim().length < 2 || value.trim().length > 100) {
        return 'Course / Degree must be between 2 and 100 characters.';
      }
      return null;

    case 'graduationYear': {
      const year = Number(value);
      if (!value || !Number.isInteger(year) || year < currentYear - 5 || year > currentYear + 8) {
        return `Graduation year must be between ${currentYear - 5} and ${currentYear + 8}.`;
      }
      return null;
    }

    case 'skills': {
      const skills = value ? String(value).split(',').map(s => s.trim()).filter(Boolean) : [];
      if (skills.length === 0) return 'Please enter at least one skill.';
      if (skills.length > 20) return 'Please enter at most 20 skills.';
      if (skills.some(s => s.length > 50)) return 'Individual skills must not exceed 50 characters.';
      return null;
    }

    case 'coverLetter':
      if (value && String(value).length > 2000) {
        return 'Cover letter must not exceed 2000 characters.';
      }
      return null;

    default:
      return null;
  }
}

describe('Frontend Form Validation & Filter Rules', () => {
  it('should accept valid applicant details across all fields', () => {
    assert.equal(validateClientField('fullName', 'Jordan Lee'), null);
    assert.equal(validateClientField('email', 'jordan.lee@college.edu'), null);
    assert.equal(validateClientField('phone', '+1 (555) 234-5678'), null);
    assert.equal(validateClientField('college', 'University of Technology'), null);
    assert.equal(validateClientField('degree', 'B.S. Computer Science'), null);
    assert.equal(validateClientField('graduationYear', 2027), null);
    assert.equal(validateClientField('skills', 'JavaScript, React, Node.js'), null);
    assert.equal(validateClientField('coverLetter', 'Hello, this is my cover letter.'), null);
  });

  it('should reject names that are too short or too long', () => {
    assert.ok(validateClientField('fullName', 'A'));
    assert.ok(validateClientField('fullName', ' '));
    assert.ok(validateClientField('fullName', 'A'.repeat(101)));
  });

  it('should reject invalid email structures', () => {
    assert.ok(validateClientField('email', 'bademail'));
    assert.ok(validateClientField('email', '@domain.com'));
    assert.ok(validateClientField('email', 'user@'));
    assert.ok(validateClientField('email', 'user@domain'));
  });

  it('should reject invalid phone structures', () => {
    assert.ok(validateClientField('phone', '123'));
    assert.ok(validateClientField('phone', 'abcdefghij'));
  });

  it('should reject unreasonable graduation years', () => {
    assert.ok(validateClientField('graduationYear', 1990));
    assert.ok(validateClientField('graduationYear', 2050));
    assert.ok(validateClientField('graduationYear', 'invalid'));
  });

  it('should enforce skills count boundaries', () => {
    assert.ok(validateClientField('skills', ''));
    // 21 skills
    const manySkills = Array.from({ length: 21 }, (_, i) => `Skill${i}`).join(',');
    assert.ok(validateClientField('skills', manySkills));
  });

  it('should enforce cover letter max character length', () => {
    assert.equal(validateClientField('coverLetter', 'Short note'), null);
    assert.ok(validateClientField('coverLetter', 'x'.repeat(2001)));
  });
});
