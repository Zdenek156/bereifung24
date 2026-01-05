#!/bin/bash
# Dieses Script auf dem Server ausführen um die DB zu prüfen

echo "=== User Info ==="
psql -U postgres -d bereifung24 -c "
SELECT 
  u.id as user_id,
  u.email,
  u.role,
  e.id as employee_id
FROM \"User\" u
LEFT JOIN \"B24Employee\" e ON e.\"userId\" = u.id
WHERE u.id = 'cmjgk4ks20003en55lulwhfr6';
"

echo ""
echo "=== Email Settings für User ==="
psql -U postgres -d bereifung24 -c "
SELECT * FROM \"EmailSettings\"
WHERE \"userId\" = 'cmjgk4ks20003en55lulwhfr6';
"

echo ""
echo "=== Email Settings für B24Employee (wenn vorhanden) ==="
psql -U postgres -d bereifung24 -c "
SELECT 
  es.*
FROM \"EmailSettings\" es
INNER JOIN \"B24Employee\" e ON e.id = es.\"b24EmployeeId\"
WHERE e.\"userId\" = 'cmjgk4ks20003en55lulwhfr6';
"

echo ""
echo "=== ALLE Email Settings ==="
psql -U postgres -d bereifung24 -c "
SELECT 
  id,
  \"userId\",
  \"b24EmployeeId\",
  \"imapUser\",
  \"imapHost\"
FROM \"EmailSettings\"
ORDER BY id DESC
LIMIT 5;
"
