import { getDb } from '../db/database.js';

/**
 * Controller: Get paginated and filtered list of internships
 */
export async function getAllInternships(req, res, next) {
  try {
    const db = await getDb();

    const {
      search = '',
      domain = '',
      page = 1,
      limit = 6
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 6));
    const offset = (pageNum - 1) * limitNum;

    const whereClauses = [];
    const params = [];

    // Filter by domain
    if (domain && typeof domain === 'string' && domain.trim() !== '' && domain !== 'All') {
      whereClauses.push('domain = ?');
      params.push(domain.trim());
    }

    // Search keyword across title, company, description, or skills
    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      whereClauses.push('(title LIKE ? OR company LIKE ? OR description LIKE ? OR skills_required LIKE ?)');
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total count query
    const countQuery = `SELECT COUNT(*) as total FROM internships ${whereSql}`;
    const countRow = await db.get(countQuery, params);
    const total = countRow ? countRow.total : 0;

    // Data query with parameterized LIMIT and OFFSET
    const dataQuery = `
      SELECT id, title, company, domain, location, type, duration, stipend,
             skills_required, description, posted_date, deadline, created_at
      FROM internships
      ${whereSql}
      ORDER BY id ASC
      LIMIT ? OFFSET ?
    `;

    const rows = await db.all(dataQuery, [...params, limitNum, offset]);

    // Parse JSON skills_required safely
    const data = rows.map(item => {
      let parsedSkills = [];
      try {
        parsedSkills = JSON.parse(item.skills_required);
      } catch {
        parsedSkills = [item.skills_required];
      }
      return {
        ...item,
        skills_required: parsedSkills
      };
    });

    res.status(200).json({
      success: true,
      count: data.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Controller: Get single internship details by ID
 */
export async function getInternshipById(req, res, next) {
  try {
    const rawId = req.params.id;
    const internshipId = parseInt(rawId, 10);

    if (isNaN(internshipId) || internshipId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid internship ID. Must be a positive integer.'
      });
    }

    const db = await getDb();
    const row = await db.get('SELECT * FROM internships WHERE id = ?', [internshipId]);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: `Internship with ID ${internshipId} was not found.`
      });
    }

    let parsedSkills = [];
    try {
      parsedSkills = JSON.parse(row.skills_required);
    } catch {
      parsedSkills = [row.skills_required];
    }

    res.status(200).json({
      success: true,
      data: {
        ...row,
        skills_required: parsedSkills
      }
    });
  } catch (err) {
    next(err);
  }
}
