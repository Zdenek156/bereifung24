#!/bin/bash

echo "Creating PostgreSQL database and user..."

sudo -u postgres psql << EOF
CREATE DATABASE bereifung24;
CREATE USER bereifung24user WITH PASSWORD 'Bereif24Secure2025';
GRANT ALL PRIVILEGES ON DATABASE bereifung24 TO bereifung24user;
ALTER DATABASE bereifung24 OWNER TO bereifung24user;
\c bereifung24
GRANT ALL ON SCHEMA public TO bereifung24user;
\l
EOF

echo "Database setup complete!"
