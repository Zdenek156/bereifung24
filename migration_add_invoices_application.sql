-- Add Invoices Application to Admin Dashboard
-- This creates the tile/card for the invoice system in the admin interface

INSERT INTO applications (
  id,
  key,
  name,
  description,
  icon,
  "adminRoute",
  color,
  "sortOrder",
  category,
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  'invoices-app',
  'invoices',
  'Rechnungen',
  'Provisionsrechnungen für Werkstätten verwalten',
  'FileText',
  '/admin/invoices',
  'purple',
  70,
  'Finanzen',
  true,
  NOW(),
  NOW()
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  "adminRoute" = EXCLUDED."adminRoute",
  color = EXCLUDED.color,
  "updatedAt" = NOW();

-- Grant access to all admins
-- Note: Individual permissions can be managed via HR -> Anwendungsverwaltung
