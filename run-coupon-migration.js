// Run coupon system migration
require('dotenv').config()
const { execSync } = require('child_process')
const fs = require('fs')

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

const sql = fs.readFileSync('./add-coupon-system.sql', 'utf8')
try {
  const result = execSync(`psql "${dbUrl}" -f add-coupon-system.sql`, { encoding: 'utf8' })
  console.log(result)
  console.log('Migration completed successfully!')
} catch (err) {
  console.error('Migration failed:', err.message)
  if (err.stdout) console.log(err.stdout)
  if (err.stderr) console.error(err.stderr)
  process.exit(1)
}
