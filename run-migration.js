const fs = require('fs')
const { execSync } = require('child_process')
const env = fs.readFileSync('/var/www/bereifung24/.env', 'utf8')
const match = env.match(/DATABASE_URL="?([^"\n]+)/)
if (!match) { console.error('No DATABASE_URL found'); process.exit(1) }
const url = match[1].replace(/"/g, '')
console.log('Running migration with URL:', url.replace(/:[^@]+@/, ':***@'))
execSync(`psql "${url}" -f /tmp/add-storage-location.sql`, { stdio: 'inherit' })
console.log('Done!')
