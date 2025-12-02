#!/bin/bash
# Load environment files
set -a
[ -f .env ] && source .env
[ -f .env.production ] && source .env.production
set +a

# Start Next.js
npm start
