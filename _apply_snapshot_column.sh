#!/bin/bash
cd /var/www/bereifung24
DB=$(grep -E '^DATABASE_URL' .env | cut -d= -f2- | tr -d '"')
echo 'ALTER TABLE "direct_bookings" ADD COLUMN IF NOT EXISTS vehicle_snapshot JSONB;' | psql "$DB"
