#!/bin/bash
PGPASSWORD=***REMOVED*** psql -h localhost -U bereifung24user -d bereifung24 -t -c "SELECT key || ' = ' || COALESCE(value,'NULL') FROM admin_api_settings WHERE key LIKE 'EMAIL%';"
