#!/bin/bash
set -a
source /var/www/bereifung24/.env
set +a

psql "postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}" -f /var/www/bereifung24/add_workshop_to_conversions.sql
