-- Add SKR04 account for payment provider fees (Stripe)
INSERT INTO "ChartOfAccounts" (
  id,
  "accountNumber",
  "accountName",
  "accountType",
  "skrType",
  description,
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  '6827',
  'Zahlungsverkehrsgebühren',
  'EXPENSE',
  'SKR04',
  'Payment-Provider-Gebühren (Stripe, PayPal etc.)',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP)
ON CONFLICT ("accountNumber") DO NOTHING;
