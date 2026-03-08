SELECT "accountNumber", "accountName" FROM chart_of_accounts WHERE "accountType"::text = 'EXPENSE' ORDER BY "accountNumber";
