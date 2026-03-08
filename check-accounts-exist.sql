-- Check if account 1200 exists; if not, create it (Bank account)
INSERT INTO chart_of_accounts ("id", "accountNumber", "accountName", "accountType", "description", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, '1200', 'Bank (Hauptkonto)', 'ASSET', 'Bankguthaben Hauptgeschäftskonto', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE "accountNumber" = '1200');

-- Check if account 4650 exists  
SELECT "accountNumber", "accountName" FROM chart_of_accounts WHERE "accountNumber" IN ('1200', '4650');
