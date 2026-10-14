# InternHub — Secure Full-Stack Internship Portal

**Task 3: Secure Application Integration**  
A production-ready, security-hardened full-stack internship portal connecting students with verified high-impact opportunities. Built with a responsive Vanilla JavaScript frontend, Express.js REST API, SQLite persistent storage, strict server-side validation, rate limiting, and zero third-party framework overhead.

---

## 1. Project Overview

InternHub bridges students and recruiters through an accessible, highly responsive internship discovery and application system. It replaces hardcoded frontend fixtures with a dynamic RESTful architecture backed by a persistent SQLite database. The application enforces defense-in-depth security principles: strict input sanitization, parameterized queries, rate limiting, CSP headers, applicant privacy protections, and comprehensive error shielding.

### Key Highlights
- **Framework-Free Frontend:** Zero React/Vue/Angular bloat — crafted entirely with semantic HTML5, modern CSS3 variables, and vanilla ES modules.
- **Accessible Native Dialogs:** Built with native HTML `<dialog>` supporting keyboard traps, visible focus rings, Escape-to-close, and focus restoration to the trigger element.
- **Safe DOM Construction:** Never inserts untrusted API responses into `innerHTML`. Uses `document.createElement`, `textContent`, and safe DOM attributes exclusively.
- **Relational Persistence:** SQLite database with foreign key enforcement (`PRAGMA foreign_keys = ON;`), indexing, and unique constraint checks to prevent duplicate applications.
- **Defense-in-Depth Security:** Helmet security headers, custom Content Security Policy (CSP), CORS protection, 100KB payload limits, centralized error handling without stack trace leakage, and rate limiting (5 submissions per 15 min per IP).
- **Automated Verification:** 22 automated tests covering API contracts, SQL injection resistance, payload boundaries, duplicate detection, rate limiting, and client-side form validation.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES Modules), Fetch API | Semantic markup, responsive design, safe DOM rendering, and async HTTP calls |
| **Backend** | Node.js, Express.js | REST API routing, rate limiting, request validation, and static asset serving |
| **Database** | SQLite with `@libsql/client` engine | Relational data persistence, foreign key enforcement, indexing, and parameterized queries |
| **Security** | Helmet, express-rate-limit, CORS | CSP headers, IP-based submission throttling, and cross-origin restrictions |
| **Testing** | Node.js Test Runner (`node:test`), Supertest | Automated API integration tests, security test cases, and validation unit tests |

---

## 3. System Architecture Diagram

```
+---------------------------------------------------------------------------------+
|                                 CLIENT BROWSER                                  |
|                                                                                 |
|   +-----------------------+     +--------------------+    +-----------------+   |
|   | Search & Domain       |     | Internship Cards   |    | Accessible Form |   |
|   | Filters (Debounced)   |     | Safe DOM Rendering |    | Native <dialog> |   |
|   +-----------+-----------+     +---------+----------+    +--------+--------+   |
|               |                           ^                        |            |
|               v                           |                        v            |
|       [ api.js: Fetch Client with AbortController, Timeout, & Offline Guard ]  |
+---------------------------------------+----------------------------+------------+
                                        |                            |
                     GET /api/internships                            POST /api/applications
                                        |                            |
+---------------------------------------v----------------------------v------------+
|                              EXPRESS.JS BACKEND                                 |
|                                                                                 |
|   [ Helmet CSP & Security Headers ]    [ Restricted CORS ]                      |
|   [ General Rate Limiter: 150/15min ]  [ Application Rate Limiter: 5/15min ]     |
|   [ Body Size Limiter: 100KB ]         [ Centralized Error Handler (No Leaks) ] |
|                                                                                 |
|   +-------------------------------+    +------------------------------------+   |
|   | internshipController.js       |    | validation.js & applicationCtrl.js |   |
|   | - Parameterized Search        |    | - Field boundary & regex checks    |   |
|   | - Domain Filter               |    | - Duplicate application prevention |   |
|   | - Pagination Calculation      |    | - Safe insertion into DB           |   |
|   +---------------+---------------+    +-----------------+------------------+   |
+-------------------|--------------------------------------|----------------------+
                    |                                      |
                    | Parameterized SQL Queries            | Parameterized SQL Queries
                    v                                      v
+---------------------------------------------------------------------------------+
|                             SQLITE DATABASE ENGINE                              |
|                                                                                 |
|   Tables:                                                                       |
|   - internships (id, title, company, domain, location, stipend, skills, etc.)   |
|   - applications (id, internship_id, full_name, email, phone, college, etc.)    |
|   Constraints: FOREIGN KEY (internship_id), UNIQUE(internship_id, email)        |
+---------------------------------------------------------------------------------+
```

---

## 4. Project Directory Structure

```
internhub-fullstack/
├── frontend/
│   ├── index.html                  # Accessible Vanilla HTML5 interface
│   ├── css/
│   │   └── style.css               # Production CSS3 styles & design tokens
│   ├── js/
│   │   ├── app.js                  # Main UI controller & safe DOM builder
│   │   └── api.js                  # Fetch API wrapper with AbortController
│   └── tests/
│       └── validation.test.js      # Frontend validation unit tests
├── backend/
│   ├── src/
│   │   ├── server.js               # Standalone backend server entry point
│   │   ├── app.js                  # Express app factory with security middlewares
│   │   ├── db/
│   │   │   ├── database.js         # SQLite connection & schema initialization
│   │   │   └── seed.js             # Realistic internship opportunities seed
│   │   ├── routes/
│   │   │   ├── internshipRoutes.js  # GET /api/internships endpoints
│   │   │   └── applicationRoutes.js # POST /api/applications with rate limiting
│   │   ├── controllers/
│   │   │   ├── internshipController.js
│   │   │   └── applicationController.js
│   │   └── middleware/
│   │       ├── validation.js       # Strict server-side input validator
│   │       └── errorHandler.js     # Centralized error handler (no stack leaks)
│   ├── tests/
│   │   └── api.test.js             # 15 automated security & API integration tests
│   ├── schema.sql                  # Canonical SQLite DDL schema
│   ├── package.json                # Backend dependency declarations
│   └── .env.example                # Backend environment configuration
├── screenshots/
│   └── README.md                   # Visual UI screenshots guide
├── schema.sql                      # Root schema definition
├── server.ts                       # Integrated full-stack runner (Port 3000)
├── TEST_REPORT.md                  # Test execution report (22/22 passing)
├── SECURITY_CHECKLIST.md           # OWASP-aligned security audit verification
├── README.md                       # Complete documentation
└── package.json                    # Project configuration & test scripts
```

---

## 5. Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v22+ recommended)
- **npm** or **bun**

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd internhub-fullstack
npm install
```

### 2. Environment Configuration
Copy the template `.env.example` into `.env`:
```bash
cp .env.example .env
```
Default configuration values:
```env
PORT=3000
NODE_ENV=development
DB_PATH=internhub.sqlite
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
APPLICATION_RATE_LIMIT=5
```

### 3. Database Initialization & Seeding
The database and tables are created automatically on server startup. To manually re-seed the database:
```bash
npm run seed
```

---

## 6. Running the Application

### Development Server (Integrated Full-Stack)
Starts the unified server running the Express API and serving the frontend on **port 3000**:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Production Execution
```bash
npm start
```

---

## 7. API Documentation

### 7.1. List Internships
- **Route:** `GET /api/internships`
- **Query Parameters:**
  - `search` *(optional)*: Search keyword matched against role title, company, description, or skills.
  - `domain` *(optional)*: Exact domain filter (e.g., `Web Development`, `Data Science & AI`, `Cybersecurity`).
  - `page` *(optional, default: 1)*: Page number for pagination.
  - `limit` *(optional, default: 6)*: Number of items per page (maximum: 50).
- **Success Response (HTTP 200):**
```json
{
  "success": true,
  "count": 6,
  "total": 10,
  "page": 1,
  "totalPages": 2,
  "data": [
    {
      "id": 1,
      "title": "Full-Stack Software Engineer Intern",
      "company": "Apex Cloud Systems",
      "domain": "Web Development",
      "location": "Remote (US/Global)",
      "type": "Full-time",
      "duration": "3 Months",
      "stipend": "$2,500 / month",
      "skills_required": ["JavaScript", "Node.js", "Express", "SQLite", "REST APIs"],
      "description": "Build modern customer-facing web services...",
      "posted_date": "2026-10-01",
      "deadline": "2026-11-15"
    }
  ]
}
```

### 7.2. Get Single Internship
- **Route:** `GET /api/internships/:id`
- **Success Response (HTTP 200):** Single internship record object.
- **Error Response (HTTP 404):** `{ "success": false, "message": "Internship not found" }`

### 7.3. Submit Internship Application
- **Route:** `POST /api/applications`
- **Rate Limit:** 5 requests per 15 minutes per IP address.
- **Request Body:**
```json
{
  "internship_id": 1,
  "full_name": "Jordan Smith",
  "email": "jordan.smith@university.edu",
  "phone": "+1 (555) 234-5678",
  "college": "California Institute of Technology",
  "degree": "B.S. Computer Science",
  "graduation_year": 2027,
  "skills": ["JavaScript", "Node.js", "SQL", "Git"],
  "cover_letter": "I have completed distributed systems projects and look forward to contributing."
}
```

- **Success Response (HTTP 201 Created):**
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "applicationId": 15,
    "internshipId": 1,
    "internshipTitle": "Full-Stack Software Engineer Intern",
    "status": "submitted",
    "createdAt": "2026-10-14T09:20:00.000Z"
  }
}
```

- **Client Error Responses:**
  - `HTTP 400 Bad Request`: Validation failure (missing required field, invalid email/phone, out-of-range year, unexpected properties).
  - `HTTP 404 Not Found`: Target `internship_id` does not exist in the database.
  - `HTTP 409 Conflict`: Duplicate application — student has already applied for this role with the provided email.
  - `HTTP 413 Payload Too Large`: Request body exceeds 100KB limit.
  - `HTTP 429 Too Many Requests`: Submission rate limit exceeded (5 requests per 15 minutes).
  - `HTTP 500 Internal Server Error`: Generic safe error message with no stack trace leakage.

---

## 8. Validation Rules

Both client and server enforce identical boundaries:

| Field | Required | Constraints |
|---|:---:|---|
| `full_name` | Yes | 2 to 100 characters, trimmed |
| `email` | Yes | Valid RFC email structure, maximum 120 characters, normalized to lowercase |
| `phone` | Yes | 10 to 20 characters, numeric with optional `+`, `-`, spaces |
| `college` | Yes | 2 to 150 characters |
| `degree` | Yes | 2 to 100 characters |
| `graduation_year` | Yes | Integer year between `currentYear - 5` and `currentYear + 8` |
| `skills` | Yes | Between 1 and 20 skills, max 50 characters per skill |
| `cover_letter` | No | Maximum 2000 characters |
| `internship_id` | Yes | Positive integer referencing existing internship |

---

## 9. Security Protections & Features

1. **SQL Injection Defense:** All SQL operations utilize parameterized queries (`?` placeholders). No user inputs are interpolated or concatenated.
2. **Rate Limiting:** Protects backend against denial of service and automated application flooding (5 requests / 15 min per IP for submissions; 150 requests / 15 min for reads).
3. **HTTP Security Headers:** Helmet enforces strict Content Security Policy (CSP), prevents MIME sniffing, clickjacking (`X-Frame-Options`), and information disclosure (`X-Powered-By` stripped).
4. **Applicant Privacy:** Applicant personal information is never exposed publicly. The `POST /api/applications` response only returns non-sensitive reference identifiers.
5. **No Local Storage:** Applicant credentials are never cached in browser `localStorage`.
6. **Payload Guard:** Request bodies strictly constrained to 100KB to prevent memory exhaustion attacks.
7. **Safe DOM Rendering:** Avoids `innerHTML` for API data, preventing DOM-based cross-site scripting (XSS).

---

## 10. Automated Testing

Run the full automated test suite (backend API tests + frontend validation tests):
```bash
npm test
```

### Test Scope
- **Backend API Tests (`backend/tests/api.test.js`):** 15 comprehensive tests covering listing, search, filtering, valid submission, missing fields, invalid email, invalid phone, negative ID, unknown role, duplicate application, SQL injection resilience, oversized payloads, rate limiting, persistence verification, and consistent 404s.
- **Frontend Validation Tests (`frontend/tests/validation.test.js`):** 7 unit tests verifying applicant constraint rules and boundaries.

Refer to [TEST_REPORT.md](./TEST_REPORT.md) for full test metrics and [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md) for the verified security audit checklist.

---

## 11. Deployment Guide

### Deployment Options
1. **Google Cloud Run / Node.js Containers:**
   - Package with Node.js 22 runtime.
   - Set environment variables (`PORT=3000`, `NODE_ENV=production`).
   - Mount persistent volume storage or Cloud SQL if scaling beyond a single replica.
2. **VPS (Debian/Ubuntu) with systemd & Nginx:**
   - Run `npm start` managed by `pm2` or `systemd`.
   - Configure Nginx reverse proxy passing `X-Forwarded-For` and `X-Forwarded-Proto`.

---

## 12. Known Limitations & Future Work

- **In-Memory Rate Limiting:** When scaling horizontally across multiple container instances, plug Redis into `express-rate-limit` using `rate-limit-redis`.
- **File Uploads:** Resume file attachments (PDF/DOCX) can be added in subsequent phases with ClamAV virus scanning and encrypted object storage buckets.
