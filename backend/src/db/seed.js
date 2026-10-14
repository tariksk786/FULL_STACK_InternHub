import { getDb } from './database.js';

export const initialInternships = [
  {
    title: 'Full-Stack Software Engineer Intern',
    company: 'Apex Cloud Systems',
    domain: 'Web Development',
    location: 'Remote (US/Global)',
    type: 'Full-time',
    duration: '3 Months',
    stipend: '$2,500 / month',
    skills_required: JSON.stringify(['JavaScript', 'Node.js', 'Express', 'SQLite', 'REST APIs']),
    description: 'Build modern customer-facing web services, develop secure RESTful microservices, write integration tests, and collaborate with experienced staff engineers.',
    posted_date: '2026-10-01',
    deadline: '2026-11-15'
  },
  {
    title: 'Frontend UI/UX Developer Intern',
    company: 'PixelCraft Studio',
    domain: 'Web Development',
    location: 'San Francisco, CA (Hybrid)',
    type: 'Full-time',
    duration: '6 Months',
    stipend: '$3,000 / month',
    skills_required: JSON.stringify(['HTML5', 'CSS3', 'JavaScript', 'Accessibility', 'Responsive Design']),
    description: 'Design and implement accessible, responsive interfaces using modern CSS, semantic HTML5, and vanilla JavaScript for high-traffic student platforms.',
    posted_date: '2026-10-04',
    deadline: '2026-11-20'
  },
  {
    title: 'Machine Learning Research Intern',
    company: 'Quantum Logic Labs',
    domain: 'Data Science & AI',
    location: 'Boston, MA (Hybrid)',
    type: 'Full-time',
    duration: '4 Months',
    stipend: '$3,200 / month',
    skills_required: JSON.stringify(['Python', 'PyTorch', 'Data Analysis', 'Scikit-Learn', 'NumPy']),
    description: 'Assist in training exploratory generative models, clean and curate multimodal evaluation datasets, and benchmark model inference latency.',
    posted_date: '2026-10-05',
    deadline: '2026-11-30'
  },
  {
    title: 'Data Analyst & Insights Intern',
    company: 'OmniMetrics Corp',
    domain: 'Data Science & AI',
    location: 'Remote',
    type: 'Part-time',
    duration: '3 Months',
    stipend: '$1,800 / month',
    skills_required: JSON.stringify(['SQL', 'Python', 'Tableau', 'Statistics', 'Data Visualization']),
    description: 'Extract business trends from high-volume transaction databases, build automated executive dashboards, and present findings to leadership.',
    posted_date: '2026-10-06',
    deadline: '2026-11-10'
  },
  {
    title: 'Cloud Infrastructure & DevOps Intern',
    company: 'SkyScale Networks',
    domain: 'Cloud & DevOps',
    location: 'Seattle, WA (On-site)',
    type: 'Full-time',
    duration: '6 Months',
    stipend: '$3,500 / month',
    skills_required: JSON.stringify(['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'Bash Scripting']),
    description: 'Help automate continuous integration pipelines, monitor distributed container clusters with Prometheus, and implement security hardening policies.',
    posted_date: '2026-10-08',
    deadline: '2026-12-01'
  },
  {
    title: 'Cybersecurity Analyst Intern',
    company: 'Aegis Defense Tech',
    domain: 'Cybersecurity',
    location: 'Washington, DC (Hybrid)',
    type: 'Full-time',
    duration: '3 Months',
    stipend: '$2,800 / month',
    skills_required: JSON.stringify(['Network Security', 'OWASP Top 10', 'Penetration Testing', 'SIEM', 'Cryptography']),
    description: 'Conduct static code analysis, audit web application vulnerabilities against OWASP Top 10 guidelines, and assist with incident response rehearsals.',
    posted_date: '2026-10-09',
    deadline: '2026-11-25'
  },
  {
    title: 'Product Design & Design Systems Intern',
    company: 'Nexus Creative Lab',
    domain: 'UI/UX Design',
    location: 'New York, NY (Hybrid)',
    type: 'Full-time',
    duration: '4 Months',
    stipend: '$2,600 / month',
    skills_required: JSON.stringify(['Figma', 'User Research', 'Wireframing', 'Prototyping', 'WCAG Guidelines']),
    description: 'Create interactive prototypes, conduct moderated user interviews with students, and contribute modular components to our cross-platform design system.',
    posted_date: '2026-10-10',
    deadline: '2026-11-28'
  },
  {
    title: 'Mobile Application Developer Intern',
    company: 'SwiftMotion Technologies',
    domain: 'Mobile Development',
    location: 'Austin, TX (Remote)',
    type: 'Part-time',
    duration: '3 Months',
    stipend: '$2,200 / month',
    skills_required: JSON.stringify(['Kotlin', 'Swift', 'REST APIs', 'Offline Storage', 'Git']),
    description: 'Collaborate with mobile engineers to build engaging native and cross-platform experiences, optimize battery performance, and publish app updates.',
    posted_date: '2026-10-11',
    deadline: '2026-12-05'
  },
  {
    title: 'Backend API & Database Engineer Intern',
    company: 'HyperData Infrastructure',
    domain: 'Web Development',
    location: 'Remote',
    type: 'Full-time',
    duration: '6 Months',
    stipend: '$3,100 / month',
    skills_required: JSON.stringify(['Node.js', 'Express', 'SQL', 'Database Indexing', 'API Security']),
    description: 'Architect low-latency REST endpoints, write SQL query optimizations, configure connection pools, and enforce strict input sanitation.',
    posted_date: '2026-10-12',
    deadline: '2026-12-10'
  },
  {
    title: 'Security Operations & Compliance Intern',
    company: 'Fortress Global',
    domain: 'Cybersecurity',
    location: 'Chicago, IL (Hybrid)',
    type: 'Full-time',
    duration: '3 Months',
    stipend: '$2,700 / month',
    skills_required: JSON.stringify(['SOC 2', 'Access Control', 'Python', 'Log Analysis', 'Vulnerability Assessment']),
    description: 'Monitor threat detection logs, review role-based access control policies, automate security telemetry, and prepare compliance audit reports.',
    posted_date: '2026-10-13',
    deadline: '2026-12-15'
  }
];

export async function seedDatabase(customDb) {
  const db = customDb || await getDb();
  
  const existingCountRow = await db.get('SELECT COUNT(*) as count FROM internships');
  if (existingCountRow && existingCountRow.count > 0) {
    return { count: existingCountRow.count, message: 'Database already seeded' };
  }

  const insertStmt = await db.prepare(`
    INSERT INTO internships (
      title, company, domain, location, type, duration, stipend,
      skills_required, description, posted_date, deadline
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    for (const item of initialInternships) {
      await insertStmt.run(
        item.title,
        item.company,
        item.domain,
        item.location,
        item.type,
        item.duration,
        item.stipend,
        item.skills_required,
        item.description,
        item.posted_date,
        item.deadline
      );
    }
  } finally {
    await insertStmt.finalize();
  }

  return { count: initialInternships.length, message: 'Seeded successfully' };
}

// Direct execution support
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(res => {
      console.log(`[Seed] ${res.message}: ${res.count} internships available.`);
      process.exit(0);
    })
    .catch(err => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}
