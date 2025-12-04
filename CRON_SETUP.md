# Google Calendar Token Auto-Refresh

## Problem
Google Calendar Access Tokens expire after 1 hour. Refresh tokens must be used to get new access tokens before they expire.

## Solution
A cron job endpoint `/api/cron/refresh-tokens` that:
- Checks all workshops and employees with connected Google Calendars
- Refreshes tokens that will expire within 24 hours
- Updates the database with new tokens and expiry dates

## Setup

### Option 1: cron-job.org (Recommended)
1. Go to https://cron-job.org
2. Create a free account
3. Add a new cron job:
   - URL: `https://bereifung24.de/api/cron/refresh-tokens`
   - Schedule: Every 6 hours (e.g., `0 */6 * * *`)
   - Timeout: 60 seconds

### Option 2: Server Cron (Linux)
Add to your crontab:
```bash
# Refresh Google Calendar tokens every 6 hours
0 */6 * * * curl -s https://bereifung24.de/api/cron/refresh-tokens > /dev/null 2>&1
```

### Option 3: PM2 Cron (Node.js)
```bash
pm2 install pm2-auto-pull
pm2 set pm2-auto-pull:interval 21600000  # 6 hours in milliseconds
```

## Manual Test
```bash
curl https://bereifung24.de/api/cron/refresh-tokens
```

## Expected Response
```json
{
  "success": true,
  "message": "Token refresh completed",
  "summary": {
    "timestamp": "2025-12-04T...",
    "workshops": {
      "total": 2,
      "successful": 2,
      "failed": 0
    },
    "employees": {
      "total": 1,
      "successful": 1,
      "failed": 0
    }
  }
}
```

## Security Note
This endpoint is public but read-only. Consider adding authentication if needed:
- Add API key check in request headers
- Or use Vercel Cron with cron secret
- Or restrict by IP address

## Monitoring
Check PM2 logs to see refresh activity:
```bash
pm2 logs bereifung24 | grep "Token refresh"
```
