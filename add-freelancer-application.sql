-- Add Freelancer Management application to Application table (PostgreSQL)
INSERT INTO applications (id, key, name, description, icon, "adminRoute", color, "sortOrder", "isActive", category, "createdAt", "updatedAt")
VALUES (
  'clfreelancer' || substr(md5(random()::text), 1, 12),
  'freelancers',
  'Freelancer-Verwaltung',
  'Vertriebspartner verwalten, Provisionen und Auszahlungen',
  'Users',
  '/admin/freelancers',
  'cyan',
  35,
  true,
  'Vertrieb',
  NOW(),
  NOW()
)
ON CONFLICT (key) DO NOTHING;
