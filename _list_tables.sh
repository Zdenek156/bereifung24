#!/bin/bash
cd /var/www/bereifung24
DB=$(grep -E '^DATABASE_URL' .env | cut -d= -f2- | tr -d '"')
echo "Listing tables containing 'booking':"
echo "\dt" | psql "$DB" | grep -i booking
