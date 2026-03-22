#!/bin/bash
cd /var/www/bereifung24
export $(grep DATABASE_URL .env | head -1)
psql "$DATABASE_URL" -f /tmp/assign-push-app.sql
