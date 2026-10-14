-- InternHub Database Schema
-- SQLite 3 with Foreign Key Enforcement

PRAGMA foreign_keys = ON;

-- Internships Table
CREATE TABLE IF NOT EXISTS internships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  domain TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL,
  duration TEXT NOT NULL,
  stipend TEXT NOT NULL,
  skills_required TEXT NOT NULL, -- JSON array string
  description TEXT NOT NULL,
  posted_date TEXT NOT NULL,
  deadline TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_internships_domain ON internships(domain);
CREATE INDEX IF NOT EXISTS idx_internships_created_at ON internships(created_at);

-- Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  internship_id INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  college TEXT NOT NULL,
  degree TEXT NOT NULL,
  graduation_year INTEGER NOT NULL,
  skills TEXT NOT NULL, -- JSON array string
  cover_letter TEXT,
  status TEXT DEFAULT 'submitted',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE RESTRICT,
  UNIQUE(internship_id, email)
);

CREATE INDEX IF NOT EXISTS idx_applications_internship_id ON applications(internship_id);
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);
