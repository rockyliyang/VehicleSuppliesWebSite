-- Add code column to logistics_companies table
ALTER TABLE logistics_companies ADD COLUMN code VARCHAR(32);

-- Update existing rows with a default value if necessary
-- For example, generate a random string or use the name as a base
UPDATE logistics_companies SET code = 'CODE-' || id WHERE code IS NULL;

-- Add not null constraint
ALTER TABLE logistics_companies ALTER COLUMN code SET NOT NULL;

-- Add a unique index for the code column
CREATE UNIQUE INDEX unique_active_logistics_companies_code ON logistics_companies (code) WHERE deleted = FALSE;

-- Add comment for the new column
COMMENT ON COLUMN logistics_companies.code IS '物流公司代码';