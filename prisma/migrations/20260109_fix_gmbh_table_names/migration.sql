-- Rename tables to snake_case to match @@map directives

ALTER TABLE "BalanceSheet" RENAME TO "balance_sheets";
ALTER TABLE "IncomeStatement" RENAME TO "income_statements";
ALTER TABLE "Depreciation" RENAME TO "depreciations";
ALTER TABLE "Provision" RENAME TO "provisions";
ALTER TABLE "CapitalAccount" RENAME TO "capital_accounts";
ALTER TABLE "YearEndClosing" RENAME TO "year_end_closings";

-- Rename sequences
ALTER SEQUENCE IF EXISTS "BalanceSheet_id_seq" RENAME TO "balance_sheets_id_seq";
ALTER SEQUENCE IF EXISTS "IncomeStatement_id_seq" RENAME TO "income_statements_id_seq";
ALTER SEQUENCE IF EXISTS "Depreciation_id_seq" RENAME TO "depreciations_id_seq";
ALTER SEQUENCE IF EXISTS "Provision_id_seq" RENAME TO "provisions_id_seq";
ALTER SEQUENCE IF EXISTS "CapitalAccount_id_seq" RENAME TO "capital_accounts_id_seq";
ALTER SEQUENCE IF EXISTS "YearEndClosing_id_seq" RENAME TO "year_end_closings_id_seq";
