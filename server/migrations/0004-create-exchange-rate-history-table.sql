-- Migration: Create exchange_rate_history table for tracking currency rates over time
-- Stores historical exchange rates for analytics and trends

-- Create exchange_rate_history table
CREATE TABLE IF NOT EXISTS "exchange_rate_history" (
  "id" SERIAL PRIMARY KEY,
  "currency_code" VARCHAR(3) NOT NULL,
  "rate" DECIMAL(18, 6) NOT NULL,
  "source" VARCHAR(50) NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "IDX_exchange_rate_history_currency"
  ON "exchange_rate_history" ("currency_code");

CREATE INDEX IF NOT EXISTS "IDX_exchange_rate_history_created_at"
  ON "exchange_rate_history" ("created_at" DESC);

CREATE INDEX IF NOT EXISTS "IDX_exchange_rate_history_currency_created"
  ON "exchange_rate_history" ("currency_code", "created_at" DESC);

-- Add comments for documentation
COMMENT ON TABLE "exchange_rate_history" IS 'Historical exchange rates for tracking currency trends';
COMMENT ON COLUMN "exchange_rate_history"."id" IS 'Primary key';
COMMENT ON COLUMN "exchange_rate_history"."currency_code" IS 'Currency code (e.g., USD, EUR, RUB)';
COMMENT ON COLUMN "exchange_rate_history"."rate" IS 'Exchange rate relative to USD (1 USD = X currency)';
COMMENT ON COLUMN "exchange_rate_history"."source" IS 'Source of the rate (api, manual, fallback)';
COMMENT ON COLUMN "exchange_rate_history"."created_at" IS 'Timestamp when the rate was recorded';
