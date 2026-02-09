# Reservation System - Quick Reference

## 🎯 What Problem Does This Solve?

**Before:** Two customers could book the same appointment time during concurrent checkout sessions, causing double-bookings.

**After:** First customer to click "Pay" locks the slot for 10 minutes. Second customer gets immediate error.

---

## 🔄 How It Works

```
┌─────────────┐
│ User clicks │
│   "Pay"     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│ Create RESERVED DirectBooking│ ← Locks slot for 10 min
│ Returns reservationId        │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Stripe/PayPal checkout      │
│ URL includes reservationId  │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Success page verifies:      │
│ - Reservation exists?       │
│ - Status = RESERVED?        │
│ - Not expired (<10 min)?    │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Create confirmed Booking    │
│ Send emails + calendar      │
│ Delete reservation          │
└─────────────────────────────┘
```

---

## 📋 Key Components

### 1. Payment Page
**File:** `app/home/workshop/[id]/payment/page.tsx`

**What it does:**
- Creates 10-minute reservation before payment
- Shows error if slot already reserved
- Passes reservationId to Stripe/PayPal

**Console logs to look for:**
```
[PAYMENT] Reservation created: xyz123
[PAYMENT] Creating Stripe session with reservation ID
```

---

### 2. Reservation API
**File:** `app/api/customer/direct-booking/reservation/[id]/route.ts`

**Endpoints:**
- `GET /api/customer/direct-booking/reservation/[id]` - Verify reservation
- `DELETE /api/customer/direct-booking/reservation/[id]` - Cleanup

**Status Codes:**
- `200` - Reservation valid ✅
- `404` - Not found ❌
- `410` - Expired and deleted ⏰

**Console logs:**
```
[RESERVATION API] Reservation verified: {...}
[RESERVATION API] Reservation expired, deleting: xyz123
[RESERVATION API] Reservation deleted: xyz123
```

---

### 3. Success Page
**File:** `app/home/workshop/[id]/payment/success/page.tsx`

**What it does:**
- Extracts reservationId from URL
- Verifies reservation before booking
- Handles expired reservations
- Cleans up after booking

**Console logs:**
```
[SUCCESS] Verifying reservation: xyz123
[SUCCESS] Reservation verified: {...}
[SUCCESS] Booking created with calendar event and emails sent
[SUCCESS] Cleaning up reservation: xyz123
```

---

## 🧪 Testing Scenarios

### Test 1: Happy Path ✅
```bash
1. Select service and time
2. Click "Pay with Stripe"
3. Check console: "[PAYMENT] Reservation created"
4. Complete payment
5. Check console: "[SUCCESS] Booking created"
6. Verify email received
7. Check Google Calendar for event
```

### Test 2: Concurrent Booking ✅
```bash
1. Open two browsers (User A and User B)
2. Both select same workshop and time slot
3. User A clicks "Pay" at 10:00:00
4. User B clicks "Pay" at 10:00:05
5. Expected: User A succeeds, User B sees error
6. Verify: Only one booking in database
```

### Test 3: Expired Reservation ⏰
```bash
1. Start payment process
2. Wait 12 minutes before completing
3. Complete payment
4. Expected: Error "Reservierung ist abgelaufen"
5. Verify: No booking created, slot available
```

---

## 🔍 Debugging

### Check Reservation in Database
```sql
-- View active reservations
SELECT * FROM DirectBooking 
WHERE status = 'RESERVED' 
AND reservedUntil > NOW();

-- View expired reservations
SELECT * FROM DirectBooking 
WHERE status = 'RESERVED' 
AND reservedUntil < NOW();

-- Check specific reservation
SELECT * FROM DirectBooking WHERE id = 'xyz123';
```

### Check for Booking Conflicts
```sql
-- Find bookings at specific time
SELECT * FROM Booking 
WHERE workshopId = 'abc' 
AND appointmentDate = '2026-02-15' 
AND appointmentTime = '10:00';
```

### View PM2 Logs
```bash
# Live logs
pm2 logs bereifung24

# Last 50 lines
pm2 logs bereifung24 --lines 50 --nostream

# Search for reservation-related logs
pm2 logs bereifung24 --lines 100 --nostream | grep -i reservation
```

---

## ⚠️ Common Issues

### Issue: "Reservation not found" error
**Cause:** Reservation expired or already used
**Solution:** User should book again

### Issue: User charged but no booking
**Cause:** Reservation expired between payment and confirmation
**Solution:** Manual refund needed (TODO: Automatic refunds)

### Issue: Slot shows available but reservation fails
**Cause:** Another user reserved it milliseconds earlier
**Solution:** Expected behavior, show error to user

---

## 📊 Monitoring

### Metrics to Track
```javascript
// Reservation success rate
const successRate = bookingsCreated / reservationsCreated

// Average time to payment
const avgTime = (paymentCompleted - reservationCreated) / 60000 // minutes

// Abandoned reservations
const abandonedRate = expiredReservations / totalReservations
```

### Alerts to Set Up
- [ ] Alert if `abandonedRate > 30%` (checkout issues)
- [ ] Alert if `avgTime > 8 minutes` (users taking too long)
- [ ] Alert if `successRate < 70%` (system issues)

---

## 🚀 Deployment Steps

```bash
# 1. SSH to server
ssh root@167.235.24.110

# 2. Navigate to project
cd /var/www/bereifung24

# 3. Pull latest changes (if using git)
git pull origin main

# 4. Clean build cache
rm -rf .next

# 5. Build
npm run build

# 6. Restart
pm2 restart bereifung24

# 7. Check logs
pm2 logs bereifung24 --lines 20
```

---

## 📞 Support

### If Reservation System Not Working:

1. **Check reservation was created:**
   ```sql
   SELECT * FROM DirectBooking ORDER BY createdAt DESC LIMIT 10;
   ```

2. **Check reservation passed to payment:**
   - Look for console log: `[PAYMENT] Reservation created: xyz123`
   - Check Stripe/PayPal success URL contains `reservationId=xyz123`

3. **Check reservation verified on success page:**
   - Look for console log: `[SUCCESS] Verifying reservation: xyz123`
   - If error, check `reservedUntil` timestamp

4. **Check booking was created:**
   ```sql
   SELECT * FROM Booking ORDER BY createdAt DESC LIMIT 10;
   ```

5. **Check reservation was deleted:**
   ```sql
   SELECT * FROM DirectBooking WHERE id = 'xyz123';
   -- Should return empty (deleted after booking)
   ```

### If User Reports Double-Booking:

1. **Check both bookings in database:**
   ```sql
   SELECT * FROM Booking 
   WHERE workshopId = 'abc' 
   AND appointmentDate = '2026-02-15' 
   AND appointmentTime = '10:00';
   ```

2. **Check if reservations were created:**
   ```sql
   SELECT * FROM DirectBooking 
   WHERE workshopId = 'abc' 
   AND date = '2026-02-15' 
   AND time = '10:00';
   ```

3. **Review server logs for race condition:**
   ```bash
   pm2 logs bereifung24 | grep -i "2026-02-15.*10:00"
   ```

4. **If double-booking occurred:**
   - Check if reservation system was bypassed
   - Check API logs for timing of both bookings
   - Cancel one booking and refund customer

---

## 🔧 Configuration

### Reservation Expiry Time
**Current:** 10 minutes
**Location:** `app/api/customer/direct-booking/reserve/route.ts`

```typescript
reservedUntil: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
```

**To change:**
```typescript
// 5 minutes
reservedUntil: new Date(Date.now() + 5 * 60 * 1000)

// 15 minutes
reservedUntil: new Date(Date.now() + 15 * 60 * 1000)
```

---

## 📚 Related Documentation

- Full implementation guide: `RACE_CONDITION_PREVENTION.md`
- Test scenarios: `scripts/test-reservation-flow.js`
- API documentation: Check individual route files
- Database schema: `prisma/schema.prisma` (DirectBooking model)

---

*Last Updated: 2026-01-29*
