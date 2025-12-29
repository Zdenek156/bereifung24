# CO2 Calculation System - Deployment Guide

## Implementation Summary (29.12.2025)

### New Logic
- **Fall 1 (Expired Request):** Customer would have visited 3 nearest workshops
  - kmSaved = (distance1 + distance2 + distance3) × 2
- **Fall 2 (Offer Accepted):** 2 nearest + chosen workshop
  - kmSaved = (sum of all 3 distances - chosen distance) × 2

### Changes Made
1. **Database Schema:**
   - Added `distance_km` DOUBLE PRECISION to `offers` table
   - Migration file: `prisma/migrations/20251229_add_distance_to_offers/migration.sql`

2. **New Files:**
   - `lib/distanceCalculator.ts` - Haversine formula for distance calculation
   - Exports: `calculateDistance()`, `findNearestWorkshops()`

3. **Updated Files:**
   - `app/api/workshop/tire-requests/[id]/offers/route.ts` - Calculate distance when creating offers
   - `app/api/workshop/create-manual-appointment/route.ts` - Calculate distance for manual appointments
   - `lib/co2Calculator.ts` - New function `calculateCO2ForRequest(tireRequestId)`
   - `app/dashboard/customer/components/CO2SavingsWidget.tsx` - Updated info text

### Deployment Steps

1. **Pull latest code:**
   ```bash
   cd /var/www/bereifung24
   git pull
   ```

2. **Run database migration:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Regenerate Prisma Client (CRITICAL!):**
   ```bash
   npx prisma generate
   ```

4. **Build application:**
   ```bash
   npm run build
   ```

5. **Restart PM2:**
   ```bash
   pm2 restart bereifung24
   ```

### Testing Checklist
- [ ] Create new offer - check if distance is calculated and saved
- [ ] View customer CO2 stats - check breakdown shows correct distances
- [ ] Check expired requests show correct calculation
- [ ] Check accepted offers show correct calculation (2 nearest + chosen)
- [ ] Verify fuel-specific CO2 factors are used correctly

### Rollback Plan
If issues occur:
```bash
# Revert to previous commit
git reset --hard 5f0976b
npm run build
pm2 restart bereifung24

# Remove column (optional)
# ALTER TABLE offers DROP COLUMN IF EXISTS distance_km;
```

### Notes
- Old function `calculateCO2Savings()` is deprecated - marked as DEPRECATED
- New main function: `calculateCO2ForRequest(tireRequestId)`
- Admin setting "Anzahl Werkstätten zum Vergleich" (default: 3) is used
- Distance calculation requires latitude/longitude for both customer and workshop
