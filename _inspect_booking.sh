#!/bin/bash
cd /var/www/bereifung24
DB=$(grep -E '^DATABASE_URL' .env | cut -d= -f2- | tr -d '"')
psql "$DB" -c "SELECT id, vehicle_id, vehicle_snapshot, service_type FROM direct_bookings WHERE id LIKE 'cmmcubg1k%' OR id LIKE '%mcubg1k0%' LIMIT 5;"
echo "---last 5 motorcycle---"
psql "$DB" -c "SELECT id, vehicle_id, vehicle_snapshot IS NOT NULL as has_snap, service_type, date FROM direct_bookings WHERE service_type = 'MOTORCYCLE_TIRE' ORDER BY date DESC LIMIT 5;"
