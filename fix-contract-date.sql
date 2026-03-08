ALTER TABLE freelancers ALTER COLUMN "contractStartDate" SET DEFAULT NOW();
ALTER TABLE freelancers ALTER COLUMN "contractStartDate" DROP NOT NULL;
