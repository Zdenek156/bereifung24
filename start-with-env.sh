#!/bin/bash
# Load .env file
set -a
source .env
set +a

# Start Next.js
npm start
