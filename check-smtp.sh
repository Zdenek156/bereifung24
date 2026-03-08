#!/bin/bash
PGPASSWORD=***REMOVED*** psql -h localhost -U bereifung24user -d bereifung24 -t -c "SELECT key || ' = ' || value FROM \"ApiSetting\" WHERE key LIKE 'EMAIL%';"
