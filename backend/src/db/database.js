import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';

let dbInstance = null;

/**
 * High-level wrapper matching standard SQLite async/await interface
 */
export class DatabaseWrapper {
  constructor(client) {
    this.client = client;
  }

  /**
   * Fetch a single row using parameterized query
   * @param {string} sql
   * @param {Array} [params]
   * @returns {Promise<Object|null>}
   */
  async get(sql, params = []) {
    const args = Array.isArray(params) ? params : [params];
    const res = await this.client.execute({ sql, args });
    if (res.rows && res.rows.length > 0) {
      return { ...res.rows[0] };
    }
    return null;
  }

  /**
   * Fetch all rows using parameterized query
   * @param {string} sql
   * @param {Array} [params]
   * @returns {Promise<Array<Object>>}
   */
  async all(sql, params = []) {
    const args = Array.isArray(params) ? params : [params];
    const res = await this.client.execute({ sql, args });
    return res.rows.map(r => ({ ...r }));
  }

  /**
   * Execute an INSERT, UPDATE, or DELETE with parameterized values
   * @param {string} sql
   * @param {Array} [params]
   * @returns {Promise<{ lastID: number, changes: number }>}
   */
  async run(sql, params = []) {
    const args = Array.isArray(params) ? params : [params];
    const res = await this.client.execute({ sql, args });
    return {
      lastID: res.lastInsertRowid !== undefined && res.lastInsertRowid !== null
        ? Number(res.lastInsertRowid)
        : undefined,
      changes: res.rowsAffected
    };
  }

  /**
   * Execute multiple raw DDL / SQL statements
   * @param {string} sql
   */
  async exec(sql) {
    if (typeof this.client.executeMultiple === 'function') {
      await this.client.executeMultiple(sql);
    } else {
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      for (const statement of statements) {
        await this.client.execute(statement);
      }
    }
  }

  /**
   * Prepare a statement for batch execution
   * @param {string} sql
   */
  async prepare(sql) {
    const client = this.client;
    return {
      async run(...args) {
        return client.execute({ sql, args });
      },
      async finalize() {
        // no-op
      }
    };
  }

  /**
   * Close database connection
   */
  async close() {
    this.client.close();
  }
}

/**
 * Initializes and returns the SQLite database connection.
 * @param {string} [customPath] - Optional custom path for test/in-memory database.
 * @returns {Promise<DatabaseWrapper>}
 */
export async function getDb(customPath) {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  const rawPath = customPath || process.env.DB_PATH || 'internhub.sqlite';
  let url = '';

  if (rawPath === ':memory:' || rawPath === 'file::memory:') {
    url = 'file::memory:';
  } else {
    const fullPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    url = `file:${fullPath}`;
  }

  const client = createClient({ url });
  const db = new DatabaseWrapper(client);

  // Enable foreign key constraints
  try {
    await db.client.execute('PRAGMA foreign_keys = ON;');
  } catch {
    // SQLite pragma fallback
  }

  // Initialize schema if not present
  await db.exec(`
    CREATE TABLE IF NOT EXISTS internships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      domain TEXT NOT NULL,
      location TEXT NOT NULL,
      type TEXT NOT NULL,
      duration TEXT NOT NULL,
      stipend TEXT NOT NULL,
      skills_required TEXT NOT NULL,
      description TEXT NOT NULL,
      posted_date TEXT NOT NULL,
      deadline TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_internships_domain ON internships(domain);
    CREATE INDEX IF NOT EXISTS idx_internships_created_at ON internships(created_at);

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      internship_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      college TEXT NOT NULL,
      degree TEXT NOT NULL,
      graduation_year INTEGER NOT NULL,
      skills TEXT NOT NULL,
      cover_letter TEXT,
      status TEXT DEFAULT 'submitted',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE RESTRICT,
      UNIQUE(internship_id, email)
    );

    CREATE INDEX IF NOT EXISTS idx_applications_internship_id ON applications(internship_id);
    CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);
    CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);
  `);

  if (!customPath) {
    dbInstance = db;
  }

  return db;
}

/**
 * Override the database instance for test isolation
 */
export function setDbInstance(db) {
  dbInstance = db;
}

/**
 * Closes the current database connection
 */
export async function closeDb() {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}
