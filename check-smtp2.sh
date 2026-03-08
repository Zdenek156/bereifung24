#!/bin/bash
PGPASSWORD=Bereif24Secure2025 psql -h localhost -U bereifung24user -d bereifung24 -t -c "SELECT key || ' = ' || COALESCE(value,'NULL') FROM admin_api_settings WHERE key LIKE 'EMAIL%';"
