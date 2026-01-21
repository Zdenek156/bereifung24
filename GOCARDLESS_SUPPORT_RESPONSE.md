# GoCardless Support Response - January 2026

## Original Issue
We thought SEPA mandates were not becoming "active" and there was a problem with the integration.

## GoCardless Support Response (12. Jan 2026)

**From:** Wasiq (GoCardless Support)

**Key Information:**
> "SEPA mandates only become active once the first payment is successfully processed under the mandate."

**Current Status:**
- Mandate Status: `pending_submission`
- **This is NORMAL and EXPECTED** ✅
- The mandate is **ready for payments**
- It will automatically change to `active` after the **first successful payment**

## What This Means

### ❌ OLD Understanding (WRONG)
- Mandate must be `active` before we can create payments
- `pending_submission` means there's a problem
- We need to wait or contact support

### ✅ NEW Understanding (CORRECT)
- Mandate with `pending_submission` is **ready for payments**
- First payment will automatically activate the mandate
- No waiting period needed
- No support intervention required

## Valid Mandate Statuses for Payment Creation

According to GoCardless:
- ✅ `pending_submission` - **CAN create payments** (becomes active after first payment)
- ✅ `submitted` - **CAN create payments**
- ✅ `active` - **CAN create payments**
- ❌ `cancelled` - **CANNOT create payments**
- ❌ `failed` - **CANNOT create payments**
- ❌ `expired` - **CANNOT create payments**

## Code Changes Required

### 1. Billing Cron (`lib/billing-cron.ts`)
**OLD:**
```typescript
gocardlessMandateStatus: 'active'
```

**NEW:**
```typescript
gocardlessMandateStatus: {
  in: ['pending_submission', 'submitted', 'active']
}
```

### 2. Workshop Settings Display
Update UI to show `pending_submission` as valid/ready state, not as error.

### 3. Admin Dashboard
Show `pending_submission` mandates as "Ready for Billing" not "Pending Activation".

## Testing

1. ✅ Mandate can be created successfully
2. ✅ Status `pending_submission` is received from GoCardless
3. ⏳ Create first payment (will activate mandate)
4. ⏳ Verify mandate changes to `active` after payment
5. ⏳ Verify subsequent payments work

## Resources

- GoCardless Mandate Statuses: https://developer.gocardless.com/api-reference/#core-endpoints-mandates
- Status Page: https://www.gocardless-status.com
- Support Ticket: Customer record vs Mandate record status clarification

## Action Items

- [x] Document GoCardless response
- [ ] Update billing cron to accept `pending_submission` status
- [ ] Update workshop UI to show correct status messages
- [ ] Create first test payment to activate mandate
- [ ] Update admin dashboard to reflect correct status logic
- [ ] Remove debug endpoints that force "active" status
