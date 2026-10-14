import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { getDb, setDbInstance, closeDb } from '../src/db/database.js';
import { seedDatabase } from '../src/db/seed.js';

let app;
let testDb;

describe('InternHub API Integration & Security Tests', () => {
  before(async () => {
    // Initialize an isolated in-memory SQLite database
    testDb = await getDb(':memory:');
    setDbInstance(testDb);

    // Seed test internships
    await seedDatabase(testDb);

    // Initialize express app
    app = createApp();
  });

  after(async () => {
    await closeDb();
  });

  // Test 1: Successful internship API fetch
  it('1. GET /api/internships - should successfully fetch paginated internships', async () => {
    const res = await request(app)
      .get('/api/internships')
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    assert.equal(typeof res.body.total, 'number');
    assert.equal(res.body.page, 1);

    const firstItem = res.body.data[0];
    assert.ok(firstItem.id);
    assert.ok(firstItem.title);
    assert.ok(firstItem.company);
    assert.ok(Array.isArray(firstItem.skills_required));
  });

  // Test 2: Empty internship response
  it('2. GET /api/internships - should return empty array and total 0 for non-matching search', async () => {
    const res = await request(app)
      .get('/api/internships?search=NonExistentRoleXYZ12345')
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.length, 0);
    assert.equal(res.body.total, 0);
  });

  // Test 3: Domain filter
  it('3. GET /api/internships - should filter correctly by domain', async () => {
    const res = await request(app)
      .get('/api/internships?domain=Web Development')
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length > 0);
    for (const item of res.body.data) {
      assert.equal(item.domain, 'Web Development');
    }
  });

  // Test 4: Successful application submission
  it('4. POST /api/applications - should successfully submit a valid application', async () => {
    const payload = {
      internship_id: 1,
      full_name: 'Test Candidate One',
      email: 'candidate.one@testuniversity.edu',
      phone: '+1 (555) 123-4567',
      college: 'Test Institute of Technology',
      degree: 'B.S. Computer Science',
      graduation_year: 2027,
      skills: ['JavaScript', 'Node.js', 'SQL'],
      cover_letter: 'I am excited to apply for this engineering internship opportunity.'
    };

    const res = await request(app)
      .post('/api/applications')
      .set('X-Forwarded-For', '10.0.1.4')
      .send(payload)
      .expect(201);

    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Application submitted successfully');
    assert.ok(res.body.data.applicationId);
    assert.equal(res.body.data.internshipId, 1);
    assert.equal(res.body.data.status, 'submitted');
    // Ensure applicant PII is NOT echoed in public response
    assert.equal(res.body.data.email, undefined);
    assert.equal(res.body.data.phone, undefined);
  });

  // Test 5: Missing required fields
  it('5. POST /api/applications - should reject submission with missing required fields', async () => {
    const payload = {
      internship_id: 1,
      full_name: 'Incomplete Candidate',
      // missing email, phone, college, degree
      graduation_year: 2027,
      skills: ['Python']
    };

    const res = await request(app)
      .post('/api/applications')
      .set('X-Forwarded-For', '10.0.1.5')
      .send(payload)
      .expect(400);

    assert.equal(res.body.success, false);
    assert.ok(res.body.errors);
    assert.ok(res.body.errors.email);
    assert.ok(res.body.errors.phone);
    assert.ok(res.body.errors.college);
    assert.ok(res.body.errors.degree);
  });

  // Test 6: Invalid email format
  it('6. POST /api/applications - should reject invalid email address formats', async () => {
    const payload = {
      internship_id: 1,
      full_name: 'Bad Email User',
      email: 'not-an-email-address',
      phone: '+1 (555) 321-7654',
      college: 'University of Engineering',
      degree: 'B.S. Software Engineering',
      graduation_year: 2026,
      skills: ['Python']
    };

    const res = await request(app)
      .post('/api/applications')
      .set('X-Forwarded-For', '10.0.1.6')
      .send(payload)
      .expect(400);

    assert.equal(res.body.success, false);
    assert.ok(res.body.errors.email);
  });

  // Test 7: Invalid phone number
  it('7. POST /api/applications - should reject invalid phone numbers', async () => {
    const payload = {
      internship_id: 1,
      full_name: 'Bad Phone User',
      email: 'badphone@testuniversity.edu',
      phone: '12345', // Too short
      college: 'University of Engineering',
      degree: 'B.S. Software Engineering',
      graduation_year: 2026,
      skills: ['Python']
    };

    const res = await request(app)
      .post('/api/applications')
      .set('X-Forwarded-For', '10.0.1.7')
      .send(payload)
      .expect(400);

    assert.equal(res.body.success, false);
    assert.ok(res.body.errors.phone);
  });

  // Test 8: Invalid internship ID format
  it('8. POST /api/applications - should reject negative or non-numeric internship ID', async () => {
    const payload = {
      internship_id: -5,
      full_name: 'Negative ID User',
      email: 'negative.id@testuniversity.edu',
      phone: '+1 (555) 444-5555',
      college: 'State College',
      degree: 'B.A. Information Systems',
      graduation_year: 2027,
      skills: ['SQL']
    };

    const res = await request(app)
      .post('/api/applications')
      .set('X-Forwarded-For', '10.0.1.8')
      .send(payload)
      .expect(400);

    assert.equal(res.body.success, false);
    assert.ok(res.body.errors.internship_id);
  });

  // Test 9: Unknown internship ID (not in database)
  it('9. POST /api/applications - should return 404 when internship does not exist', async () => {
    const payload = {
      internship_id: 999999, // Non-existent ID
      full_name: 'Ghost Internship Applicant',
      email: 'ghost.applicant@testuniversity.edu',
      phone: '+1 (555) 888-9999',
      college: 'University of Systems',
      degree: 'B.S. Computer Science',
      graduation_year: 2028,
      skills: ['Go', 'Docker']
    };

    const res = await request(app)
      .post('/api/applications')
      .set('X-Forwarded-For', '10.0.1.9')
      .send(payload)
      .expect(404);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /does not exist/i);
  });

  // Test 10: Duplicate application prevention
  it('10. POST /api/applications - should reject duplicate application for same email & role with 409 Conflict', async () => {
    const payload = {
      internship_id: 2,
      full_name: 'Duplicate Candidate',
      email: 'unique.duplicate@testuniversity.edu',
      phone: '+1 (555) 999-1111',
      college: 'City University',
      degree: 'B.S. Information Technology',
      graduation_year: 2027,
      skills: ['UI Design', 'CSS']
    };

    const clientIp = '10.0.1.10';

    // First submission: should succeed (201)
    const firstRes = await request(app)
      .post('/api/applications')
      .set('X-Forwarded-For', clientIp)
      .send(payload)
      .expect(201);

    assert.equal(firstRes.body.success, true);

    // Second submission with same email & role: should be rejected (409)
    const secondRes = await request(app)
      .post('/api/applications')
      .set('X-Forwarded-For', clientIp)
      .send(payload)
      .expect(409);

    assert.equal(secondRes.body.success, false);
    assert.match(secondRes.body.message, /already submitted an application/i);
  });

  // Test 11: SQL injection resilience
  it('11. POST /api/applications - should safely handle SQL injection strings via parameterized queries', async () => {
    const injectionPayload = {
      internship_id: 1,
      full_name: "Robert'); DROP TABLE applications;--",
      email: 'sqli.test@university.edu',
      phone: '+1 (555) 000-1111',
      college: "Stanford' OR '1'='1",
      degree: 'B.S. Security Analysis',
      graduation_year: 2026,
      skills: ["' OR 1=1 --", 'Python'],
      cover_letter: "'; DELETE FROM internships; --"
    };

    const res = await request(app)
      .post('/api/applications')
      .set('X-Forwarded-For', '10.0.1.11')
      .send(injectionPayload)
      .expect(201);

    assert.equal(res.body.success, true);

    // Verify applications table still exists and record was stored safely
    const stored = await testDb.get('SELECT full_name FROM applications WHERE email = ?', ['sqli.test@university.edu']);
    assert.ok(stored);
    assert.equal(stored.full_name, "Robert'); DROP TABLE applications;--");

    // Verify internships table was NOT dropped or deleted
    const countRow = await testDb.get('SELECT COUNT(*) as count FROM internships');
    assert.ok(countRow.count > 0);
  });

  // Test 12: Oversized request body
  it('12. POST /api/applications - should reject payload exceeding size limit (100KB)', async () => {
    const giantText = 'A'.repeat(120 * 1024); // 120KB
    const oversizedPayload = {
      internship_id: 1,
      full_name: 'Giant Payload User',
      email: 'giant@test.edu',
      phone: '+1 (555) 000-0000',
      college: 'Big Data College',
      degree: 'CS',
      graduation_year: 2027,
      skills: ['BigData'],
      cover_letter: giantText
    };

    const res = await request(app)
      .post('/api/applications')
      .set('X-Forwarded-For', '10.0.1.12')
      .send(oversizedPayload);

    // Express json parser triggers 413 or 400
    assert.ok([400, 413].includes(res.status));
    assert.equal(res.body.success, false);
  });

  // Test 13: Rate limiting enforcement
  it('13. POST /api/applications - should trigger 429 when IP rate limit is exceeded', async () => {
    // We submit multiple requests from the same simulated IP
    const testIp = '198.51.100.42';
    const makeRequest = (email) => request(app)
      .post('/api/applications')
      .set('X-Forwarded-For', testIp)
      .send({
        internship_id: 3,
        full_name: 'Rate Limit Tester',
        email,
        phone: '+1 (555) 777-8888',
        college: 'Rate Limit College',
        degree: 'CS',
        graduation_year: 2027,
        skills: ['Testing']
      });

    // Make 5 requests (the allowed quota is 5 requests per 15 min)
    for (let i = 1; i <= 5; i++) {
      await makeRequest(`ratelimit${i}@test.edu`);
    }

    // 6th request should be blocked with 429 Too Many Requests
    const blockedRes = await makeRequest('ratelimit6@test.edu');
    assert.equal(blockedRes.status, 429);
    assert.equal(blockedRes.body.success, false);
    assert.match(blockedRes.body.message, /too many/i);
  });

  // Test 14: Database persistence
  it('14. Database Persistence - should accurately persist records with foreign keys and correct datatypes', async () => {
    const candidateEmail = 'persist.check@university.edu';
    const payload = {
      internship_id: 4,
      full_name: 'Persistence Validator',
      email: candidateEmail,
      phone: '+1 (555) 888-2222',
      college: 'Persistence Institute',
      degree: 'M.S. Distributed Systems',
      graduation_year: 2026,
      skills: ['C++', 'Rust', 'SQLite'],
      cover_letter: 'Validating persistence layer.'
    };

    const res = await request(app)
      .post('/api/applications')
      .set('X-Forwarded-For', '10.0.1.14')
      .send(payload)
      .expect(201);

    const appId = res.body.data.applicationId;
    const dbRecord = await testDb.get('SELECT * FROM applications WHERE id = ?', [appId]);

    assert.ok(dbRecord);
    assert.equal(dbRecord.internship_id, 4);
    assert.equal(dbRecord.full_name, 'Persistence Validator');
    assert.equal(dbRecord.email, candidateEmail);
    assert.equal(dbRecord.phone, '+1 (555) 888-2222');
    assert.equal(dbRecord.graduation_year, 2026);
    assert.equal(dbRecord.status, 'submitted');
    assert.deepEqual(JSON.parse(dbRecord.skills), ['C++', 'Rust', 'SQLite']);
    assert.ok(dbRecord.created_at);
  });

  // Test 15: Consistent error responses
  it('15. Consistent Error Responses - non-existent API routes return formatted JSON 404', async () => {
    const res = await request(app)
      .get('/api/unsupported-endpoint-path')
      .set('X-Forwarded-For', '10.0.1.15')
      .expect(404);

    assert.equal(res.body.success, false);
    assert.ok(res.body.message);
    assert.match(res.body.message, /not found/i);
  });
});
