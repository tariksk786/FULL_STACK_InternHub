# InternHub — Automated Test Execution Report

**Project:** InternHub — Secure Full-Stack Internship Portal  
**Execution Date:** 2026-10-14  
**Test Runner:** Node.js Built-in Test Runner (`node:test`) with Supertest  
**Environment:** Linux x86_64, Node.js v22.23.2, LibSQL / SQLite Engine, Express.js 4.21  

---

## 1. Test Objective

The objective of this automated test suite is to verify the functional, relational, and security integrity of the InternHub full-stack application. Key verification criteria include:
- REST API contract compliance for retrieval, filtering, pagination, and application submission.
- Client-side and server-side validation error classification and rejection.
- Prevention of duplicate student submissions across identical roles.
- Resilience against SQL Injection attempts via parameterized queries.
- Enforcement of strict request body limits (100KB) and rate limits (5 submissions per 15 minutes per IP address).
- Centralized error handling without disclosure of stack traces or database internals.
- Verification of database persistence in isolated SQLite storage without applicant PII leakage in public endpoints.

---

## 2. Test Environment & Setup

- **Database:** Isolated In-Memory SQLite database (`:memory:`) with `PRAGMA foreign_keys = ON;`.
- **Seeding:** Automated execution of `seedDatabase()` inserting 10 verified opportunities across Web Development, Data Science & AI, Cloud & DevOps, Cybersecurity, UI/UX Design, and Mobile Development.
- **Teardown:** Clean connection closure after test execution (`closeDb()`).
- **Simulated Clients:** Supertest HTTP client with distinct simulated IP addresses (`X-Forwarded-For`) to test rate limiting accurately in isolation.

---

## 3. Test Cases & Execution Results

| # | Test Case Description | Target Endpoint | Expected Result | Actual Result | Status |
|---|-----------------------|-----------------|-----------------|---------------|:------:|
| 1 | Paginated internships fetch | `GET /api/internships` | HTTP 200, array of items, pagination metadata | HTTP 200, valid JSON array with count/total/page | **PASS** |
| 2 | Empty search results | `GET /api/internships?search=NonExistent` | HTTP 200, `data: []`, `total: 0` | HTTP 200, empty array, total = 0 | **PASS** |
| 3 | Domain filtering | `GET /api/internships?domain=Web+Development` | HTTP 200, only Web Development records | HTTP 200, all records matched domain | **PASS** |
| 4 | Valid application submission | `POST /api/applications` | HTTP 201, `applicationId`, status 'submitted', no applicant PII echoed | HTTP 201, ref ID returned, PII redacted | **PASS** |
| 5 | Missing required fields | `POST /api/applications` | HTTP 400, specific field error messages | HTTP 400, error object detailing missing fields | **PASS** |
| 6 | Invalid email syntax | `POST /api/applications` | HTTP 400, `errors.email` defined | HTTP 400, email rejected by regex validator | **PASS** |
| 7 | Invalid phone syntax | `POST /api/applications` | HTTP 400, `errors.phone` defined | HTTP 400, phone rejected by length/format | **PASS** |
| 8 | Invalid internship ID | `POST /api/applications` | HTTP 400, `errors.internship_id` | HTTP 400, negative integer rejected | **PASS** |
| 9 | Non-existent internship ID | `POST /api/applications` | HTTP 404, "Internship does not exist" | HTTP 404, not found response | **PASS** |
| 10 | Duplicate application check | `POST /api/applications` | HTTP 409 Conflict on 2nd submission | HTTP 409, duplicate message returned | **PASS** |
| 11 | SQL Injection strings | `POST /api/applications` | Safely treated as text literals via parameterized queries | HTTP 201, DB table intact, query executed safely | **PASS** |
| 12 | Oversized payload (>100KB) | `POST /api/applications` | HTTP 400 or 413 Payload Too Large | HTTP 400/413, rejected before processing | **PASS** |
| 13 | Application Rate Limiting | `POST /api/applications` | HTTP 429 after 5 requests from same IP | HTTP 429 Too Many Requests on 6th request | **PASS** |
| 14 | Database persistence check | Direct SQLite Query | Record stored with all columns & valid JSON skills array | Record matches inserted values exactly | **PASS** |
| 15 | Consistent 404 error format | `GET /api/unsupported-endpoint` | HTTP 404 JSON format with `{ success: false, message: ... }` | HTTP 404 formatted JSON | **PASS** |
| 16 | Valid client form check | Pure JS Validator | Returns `null` error | Returns `null` | **PASS** |
| 17 | Client name length bounds | Pure JS Validator | Rejects length < 2 or > 100 | Returns error message | **PASS** |
| 18 | Client email regex bounds | Pure JS Validator | Rejects invalid email structure | Returns error message | **PASS** |
| 19 | Client phone regex bounds | Pure JS Validator | Rejects non-numeric/short phone | Returns error message | **PASS** |
| 20 | Client graduation year bounds | Pure JS Validator | Rejects out-of-range years | Returns error message | **PASS** |
| 21 | Client skills count bounds | Pure JS Validator | Rejects empty or > 20 skills | Returns error message | **PASS** |
| 22 | Client cover letter max length| Pure JS Validator | Rejects length > 2000 chars | Returns error message | **PASS** |

---

## 4. Test Summary Statistics

- **Total Tests Executed:** 22
- **Passed:** 22 (100%)
- **Failed:** 0 (0%)
- **Skipped / Cancelled:** 0
- **Total Duration:** 835 ms

---

## 5. Raw Terminal Test Output

```
> react-example@0.0.0 test
> node --test backend/tests/api.test.js frontend/tests/validation.test.js

TAP version 13
# Subtest: InternHub API Integration & Security Tests
    # Subtest: 1. GET /api/internships - should successfully fetch paginated internships
    ok 1 - 1. GET /api/internships - should successfully fetch paginated internships
    # Subtest: 2. GET /api/internships - should return empty array and total 0 for non-matching search
    ok 2 - 2. GET /api/internships - should return empty array and total 0 for non-matching search
    # Subtest: 3. GET /api/internships - should filter correctly by domain
    ok 3 - 3. GET /api/internships - should filter correctly by domain
    # Subtest: 4. POST /api/applications - should successfully submit a valid application
    ok 4 - 4. POST /api/applications - should successfully submit a valid application
    # Subtest: 5. POST /api/applications - should reject submission with missing required fields
    ok 5 - 5. POST /api/applications - should reject submission with missing required fields
    # Subtest: 6. POST /api/applications - should reject invalid email address formats
    ok 6 - 6. POST /api/applications - should reject invalid email address formats
    # Subtest: 7. POST /api/applications - should reject invalid phone numbers
    ok 7 - 7. POST /api/applications - should reject invalid phone numbers
    # Subtest: 8. POST /api/applications - should reject negative or non-numeric internship ID
    ok 8 - 8. POST /api/applications - should reject negative or non-numeric internship ID
    # Subtest: 9. POST /api/applications - should return 404 when internship does not exist
    ok 9 - 9. POST /api/applications - should return 404 when internship does not exist
    # Subtest: 10. POST /api/applications - should reject duplicate application for same email & role with 409 Conflict
    ok 10 - 10. POST /api/applications - should reject duplicate application for same email & role with 409 Conflict
    # Subtest: 11. POST /api/applications - should safely handle SQL injection strings via parameterized queries
    ok 11 - 11. POST /api/applications - should safely handle SQL injection strings via parameterized queries
    # Subtest: 12. POST /api/applications - should reject payload exceeding size limit (100KB)
    ok 12 - 12. POST /api/applications - should reject payload exceeding size limit (100KB)
    # Subtest: 13. POST /api/applications - should trigger 429 when IP rate limit is exceeded
    ok 13 - 13. POST /api/applications - should trigger 429 when IP rate limit is exceeded
    # Subtest: 14. Database Persistence - should accurately persist records with foreign keys and correct datatypes
    ok 14 - 14. Database Persistence - should accurately persist records with foreign keys and correct datatypes
    # Subtest: 15. Consistent Error Responses - non-existent API routes return formatted JSON 404
    ok 15 - 15. Consistent Error Responses - non-existent API routes return formatted JSON 404
    1..15
ok 1 - InternHub API Integration & Security Tests
# Subtest: Frontend Form Validation & Filter Rules
    # Subtest: should accept valid applicant details across all fields
    ok 1 - should accept valid applicant details across all fields
    # Subtest: should reject names that are too short or too long
    ok 2 - should reject names that are too short or too long
    # Subtest: should reject invalid email structures
    ok 3 - should reject invalid email structures
    # Subtest: should reject invalid phone structures
    ok 4 - should reject invalid phone structures
    # Subtest: should reject unreasonable graduation years
    ok 5 - should reject unreasonable graduation years
    # Subtest: should enforce skills count boundaries
    ok 6 - should enforce skills count boundaries
    # Subtest: should enforce cover letter max character length
    ok 7 - should enforce cover letter max character length
    1..7
ok 2 - Frontend Form Validation & Filter Rules
1..2
# tests 22
# suites 2
# pass 22
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 835.116844
```

---

## 6. Known Limitations & Recommendations

1. **In-Memory Rate Limiting:** The current rate limiter uses Node process memory (`MemoryStore`). In a multi-instance autoscaled production deployment (e.g., behind multiple Cloud Run containers), a shared Redis store (e.g. `rate-limit-redis`) should be plugged into `express-rate-limit`.
2. **File Attachments / Resumes:** The application currently captures structured academic text and skills. If resume PDF uploads are introduced in future tasks, a dedicated antivirus scanner (ClamAV) and signed object storage (GCS / S3) should be integrated with file signature validation.
