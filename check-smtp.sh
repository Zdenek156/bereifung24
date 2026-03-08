#!/bin/bash
PGPASSWORD=Bereif24Secure2025 psql -h localhost -U bereifung24user -d bereifung24 -t -c "SELECT key || ' = ' || value FROM \"ApiSetting\" WHERE key LIKE 'EMAIL%';"
