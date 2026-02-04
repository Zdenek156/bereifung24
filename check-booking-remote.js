const { exec } = require('child_process')

const command = `ssh -i C:\\Users\\zdene\\.ssh\\bereifung24_hetzner root@167.235.24.110 "cd /var/www/bereifung24 && npx prisma db execute --stdin" <<EOF
SELECT 
  db.id,
  db."booking_number",
  db."service_type",
  db.date,
  db.time,
  db.status,
  db."payment_status",
  db."total_price",
  c.name as customer_name,
  w.name as workshop_name,
  v.brand as vehicle_brand,
  v.model as vehicle_model,
  db."created_at"
FROM "DirectBooking" db
LEFT JOIN "Customer" c ON db."customer_id" = c.id
LEFT JOIN "Workshop" w ON db."workshop_id" = w.id
LEFT JOIN "Vehicle" v ON db."vehicle_id" = v.id
ORDER BY db."created_at" DESC
LIMIT 5;
EOF`

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error)
    return
  }
  console.log(stdout)
  if (stderr) console.error(stderr)
})
