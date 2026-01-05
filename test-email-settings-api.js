// Test-Script um die Email Settings API zu testen
// Dieses Script simuliert, was passiert wenn Settings gespeichert und abgerufen werden

console.log('\n=== EMAIL SETTINGS API TEST ===\n')
console.log('Dieses Script sollte auf dem Server ausgeführt werden, wo die DB läuft.\n')
console.log('SSH auf den Server und dann:')
console.log('  cd /var/www/bereifung24')
console.log('  node test-email-settings-api.js')
console.log('\n')
console.log('Oder alternativ können Sie folgende Befehle im SSH ausführen:\n')

console.log('1. Prüfe EmailSettings für User zdenek.kyzlink@bereifung24.de:')
console.log(`
psql -U postgres -d bereifung24 -c "
SELECT 
  es.id,
  es.\\"userId\\",
  es.\\"b24EmployeeId\\",
  es.\\"imapUser\\",
  es.\\"imapHost\\",
  es.\\"imapPort\\",
  es.\\"syncEnabled\\",
  CASE WHEN es.\\"imapPassword\\" IS NOT NULL THEN 'SET' ELSE 'NOT SET' END as password_status
FROM \\"EmailSettings\\" es
LEFT JOIN \\"User\\" u ON u.id = es.\\"userId\\" OR u.id IN (
  SELECT \\"userId\\" FROM \\"B24Employee\\" WHERE id = es.\\"b24EmployeeId\\"
)
WHERE u.email = 'zdenek.kyzlink@bereifung24.de';
"
`)

console.log('\n2. Finde die User ID und B24Employee ID:')
console.log(`
psql -U postgres -d bereifung24 -c "
SELECT 
  u.id as user_id,
  u.email,
  u.role,
  e.id as employee_id,
  e.\\"firstName\\",
  e.\\"lastName\\"
FROM \\"User\\" u
LEFT JOIN \\"B24Employee\\" e ON e.\\"userId\\" = u.id
WHERE u.email = 'zdenek.kyzlink@bereifung24.de';
"
`)

console.log('\n3. Zähle alle EmailSettings:')
console.log(`
psql -U postgres -d bereifung24 -c "
SELECT COUNT(*) as total FROM \\"EmailSettings\\";
"
`)

console.log('\n4. Zeige alle EmailSettings mit User Info:')
console.log(`
psql -U postgres -d bereifung24 -c "
SELECT 
  es.id,
  es.\\"userId\\",
  es.\\"b24EmployeeId\\",
  es.\\"imapUser\\",
  u.email as user_email,
  u2.email as employee_user_email
FROM \\"EmailSettings\\" es
LEFT JOIN \\"User\\" u ON u.id = es.\\"userId\\"
LEFT JOIN \\"B24Employee\\" e ON e.id = es.\\"b24EmployeeId\\"
LEFT JOIN \\"User\\" u2 ON u2.id = e.\\"userId\\"
ORDER BY es.id DESC
LIMIT 10;
"
`)
