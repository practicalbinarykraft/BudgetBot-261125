#!/bin/bash

# Import CSV data to database
# Usage: ./scripts/import-csv-data.sh

set -e

# Use DATABASE_URL from environment or fallback to localhost
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/budget_bot}"
CSV_DIR="$HOME/Downloads/BD budget bot"

if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set, using default localhost connection"
fi

echo "🚀 Starting CSV import to database..."

# Order matters - tables with foreign keys must be imported after their dependencies
TABLES=(
  "users"
  "settings"
  "categories"
  "wallets"
  "transactions"
  "budgets"
  "recurring"
  "planned_transactions"
  "planned_income"
  "assets"
  "asset_valuations"
  "calibrations"
  "personal_tags"
  "merchant_categories"
  "product_catalog"
  "product_price_history"
  "price_search_reports"
  "receipt_items"
  "wishlist"
  "telegram_verification_codes"
  "ai_chat_messages"
  "ai_tool_executions"
  "ai_training_examples"
  "sorting_sessions"
  "sorting_progress"
)

for table in "${TABLES[@]}"; do
  csv_file="$CSV_DIR/${table}.csv"

  if [ ! -f "$csv_file" ]; then
    echo "⚠️  Skipping $table (file not found)"
    continue
  fi

  # Check if file is empty (only header or completely empty)
  line_count=$(wc -l < "$csv_file")
  if [ "$line_count" -le 1 ]; then
    echo "⏭️  Skipping $table (empty file)"
    continue
  fi

  echo "📥 Importing $table..."

  # Use \COPY command which works from client side
  psql "$DB_URL" -c "\COPY $table FROM '$csv_file' WITH (FORMAT CSV, HEADER true, DELIMITER ',', QUOTE '\"', ESCAPE '\"', NULL '')"

  echo "✅ Imported $table"
done

echo ""
echo "🎉 CSV import completed!"
echo ""
echo "📊 Checking row counts..."

for table in "${TABLES[@]}"; do
  csv_file="$CSV_DIR/${table}.csv"
  if [ -f "$csv_file" ]; then
    line_count=$(($(wc -l < "$csv_file") - 1))  # Subtract header
    if [ "$line_count" -gt 0 ]; then
      db_count=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM $table;" | tr -d ' ')
      echo "  $table: $db_count rows"
    fi
  fi
done

echo ""
echo "✅ Import verification complete!"
