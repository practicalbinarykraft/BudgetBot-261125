# 💳 Billing System - Local Testing Guide

## 🎯 What Was Built

A complete credit-based billing system that allows you to resell AI API access using your corporate keys while giving users a freemium experience.

### Core Features:
- ✅ **BYOK Priority**: Users can still use their own API keys (unlimited)
- ✅ **System Keys with Credits**: Users without keys use your corporate keys and pay with credits
- ✅ **Free Tier**: 25 credits auto-granted to new users
- ✅ **Smart Routing**: DeepSeek for simple tasks (12x cheaper), Claude/GPT for complex ones
- ✅ **Usage Tracking**: All API calls logged to `ai_usage_log` table
- ✅ **Graceful Degradation**: Clear error messages when credits run out

### Economics:
- **Active user cost**: $0.55/month (with DeepSeek optimization)
- **1 credit** ≈ $0.01 actual cost (2x margin built in)
- **Break-even**: 31 paying users at $5/month for 1000 free users
- **Free tier**: 25 credits = ~50-100 AI operations

---

## 🔧 Setup for Local Testing

### Step 1: Add System API Keys to `.env`

Add these lines to your `/Users/aleksandrmishin/Downloads/BudgetBot-Improved/.env` file:

```bash
# ===== Billing System (NEW) =====
BILLING_ENABLED=true
FREE_TIER_CREDITS=25

# ===== System API Keys (NEW) =====
# These are YOUR corporate keys that users will consume from
SYSTEM_ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
SYSTEM_OPENAI_API_KEY=sk-proj-your-key-here
SYSTEM_DEEPSEEK_API_KEY=your-key-here

# Note: OPENROUTER_API_KEY already exists in .env
# Rename it to SYSTEM_OPENROUTER_API_KEY:
SYSTEM_OPENROUTER_API_KEY=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
```

**Required Keys:**
1. **Anthropic** (for OCR, AI chat): https://console.anthropic.com/
2. **OpenAI** (for Whisper): https://platform.openai.com/api-keys
3. **DeepSeek** (for voice normalization): https://platform.deepseek.com/
4. **OpenRouter** (fallback): Already have it ✅

---

### Step 2: Initialize Credits for Existing Users

Run the migration to give existing users their free credits:

```bash
cd /Users/aleksandrmishin/Downloads/BudgetBot-Improved
npx tsx server/migrations/init-user-credits.ts
```

Expected output:
```
🚀 Starting user credits initialization...
📊 Free tier credits: 25
👥 Found X total users
💳 Y users already have credits
🆕 Z users need credits initialization
✅ User 1: Granted 25 credits
✅ User 2: Granted 25 credits
...
✅ Migration completed!
```

---

### Step 3: Start Local Server

```bash
cd /Users/aleksandrmishin/Downloads/BudgetBot-Improved
npm run dev
```

Expected output:
```
Server running on port 3000
Database connected
Telegram bot started (polling mode)
```

---

## ✅ Testing Checklist

### Test 1: Voice Message with Billing ✅

**Test Case**: Send a voice message via Telegram bot

**What to test**:
1. Open Telegram and find your bot
2. Send a voice message: *"Купил кофе за триста рублей"*
3. Check bot response

**Expected behavior**:
```
🎤 Transcribing...
[Message deleted]

Transcribed:
"Купил кофе за триста рублей"

💡 AI processed: 300 RUB кофе

✅ Transaction saved!
Amount: 300 RUB
Category: Food & Drinks
```

**Verify**:
- ✅ Whisper transcription works (uses OpenAI system key)
- ✅ DeepSeek normalization works (uses DeepSeek system key)
- ✅ Credits deducted (check database)

**Database check**:
```sql
-- Check credits were deducted
SELECT * FROM user_credits WHERE user_id = YOUR_USER_ID;
-- Should show: messages_remaining = 23 (25 - 2 for transcription and normalization)

-- Check usage log
SELECT * FROM ai_usage_log WHERE user_id = YOUR_USER_ID ORDER BY created_at DESC LIMIT 5;
-- Should show 2 entries: "openai:voice_transcription" and "deepseek:voice_normalization"
```

---

### Test 2: Receipt OCR with Billing ✅

**Test Case**: Send a receipt photo via Telegram bot

**What to test**:
1. Take a photo of a receipt (or use a sample)
2. Send it to the Telegram bot
3. Check bot response

**Expected behavior**:
```
📸 Processing receipt...

✅ Receipt extracted!
Amount: 295,008 IDR
Description: PEPITO MARKET
Category: Food & Drinks

Confirm? [Yes] [Cancel]
```

**Verify**:
- ✅ Claude Vision OCR works (uses Anthropic system key)
- ✅ Credits deducted (check database)

**Database check**:
```sql
SELECT * FROM user_credits WHERE user_id = YOUR_USER_ID;
-- Should show: messages_remaining decreased by ~2-3 credits

SELECT * FROM ai_usage_log WHERE user_id = YOUR_USER_ID AND model LIKE 'anthropic:ocr%';
-- Should show OCR entry with input_tokens ~1500, output_tokens ~200
```

---

### Test 3: AI Chat with Billing ✅

**Test Case**: Use AI financial advisor via Telegram bot

**What to test**:
1. Send command: `/ai` or tap "💬 AI Chat" button
2. Ask a question: *"Can I afford a $500 laptop?"*
3. Check bot response

**Expected behavior**:
```
👋 Hi! I'm your AI financial advisor.

💡 What I can do:
• Analyze your expenses and find savings
• Answer "Can I afford X?"
...

Just ask a question!
```

Then after your question:
```
Based on your current balance of $2,450 and average monthly expenses of $1,200,
you can afford a $500 laptop. However, I recommend waiting until...
[detailed financial advice]
```

**Verify**:
- ✅ Claude chat works (uses Anthropic system key)
- ✅ Credits deducted based on response length
- ✅ Chat history persists (cross-platform: web + Telegram)

**Database check**:
```sql
SELECT * FROM user_credits WHERE user_id = YOUR_USER_ID;
-- Should show: messages_remaining decreased by ~3-5 credits per message

SELECT * FROM ai_usage_log WHERE user_id = YOUR_USER_ID AND model LIKE 'anthropic:financial_advisor%';
-- Should show chat entry with token counts
```

---

### Test 4: BYOK Still Works (Backward Compatibility) ✅

**Test Case**: User with their own API key should NOT be charged

**Setup**:
1. Go to web app: http://localhost:3000/app/settings
2. Add your own Anthropic API key in "General Settings"
3. Save

**What to test**:
Send `/ai` command and ask a question

**Expected behavior**:
- ✅ AI chat works normally
- ✅ **Credits NOT deducted** (check database)
- ✅ Usage log shows `was_free = true`

**Database check**:
```sql
SELECT * FROM user_credits WHERE user_id = YOUR_USER_ID;
-- messages_remaining should NOT decrease

SELECT * FROM ai_usage_log WHERE user_id = YOUR_USER_ID ORDER BY created_at DESC LIMIT 1;
-- should show: was_free = true
```

---

### Test 5: Insufficient Credits Error ✅

**Test Case**: What happens when credits run out?

**Setup**:
```sql
-- Manually set credits to 0
UPDATE user_credits SET messages_remaining = 0 WHERE user_id = YOUR_USER_ID;
```

**What to test**:
Send a voice message or `/ai` command

**Expected behavior**:
```
❌ No credits remaining. Purchase more at /app/settings/billing
or add your own Anthropic API key.
```

**Verify**:
- ✅ Clear error message
- ✅ Link to billing page
- ✅ Suggestion to use BYOK
- ✅ App doesn't crash

---

## 📊 Database Schema Check

Verify tables exist:

```sql
-- Check user_credits table
SELECT * FROM user_credits LIMIT 5;

-- Check ai_usage_log table
SELECT * FROM ai_usage_log ORDER BY created_at DESC LIMIT 10;
```

Expected `user_credits` columns:
- `id` (serial)
- `user_id` (integer, unique)
- `messages_remaining` (integer)
- `total_granted` (integer)
- `total_used` (integer)
- `created_at`, `updated_at`

Expected `ai_usage_log` columns:
- `id` (serial)
- `user_id` (integer)
- `model` (varchar - format: "provider:operation")
- `input_tokens` (integer)
- `output_tokens` (integer)
- `message_count` (integer - credits charged)
- `was_free` (boolean)
- `created_at`

---

## 🔍 Smart Routing Verification

Check which provider is used for each operation:

| Operation | Expected Provider | Why |
|-----------|------------------|-----|
| OCR | Anthropic Claude | Best quality for vision |
| Voice transcription | OpenAI Whisper | Specialized model |
| Voice normalization | DeepSeek | 12x cheaper, simple task |
| AI chat | Anthropic Claude | Complex reasoning |
| Categorization | DeepSeek | Pattern matching, cheap |
| Text parsing | DeepSeek | Structured extraction, cheap |

**Verify in logs**:
```sql
SELECT model, COUNT(*) as usage_count, SUM(message_count) as total_credits
FROM ai_usage_log
GROUP BY model
ORDER BY usage_count DESC;
```

---

## 💰 Cost Tracking

Monitor actual costs vs credits charged:

```sql
-- Total credits charged to users
SELECT
  SUM(message_count) as total_credits_charged,
  SUM(message_count) * 0.01 as revenue_usd
FROM ai_usage_log
WHERE was_free = false;

-- Breakdown by operation
SELECT
  SPLIT_PART(model, ':', 2) as operation,
  SPLIT_PART(model, ':', 1) as provider,
  COUNT(*) as calls,
  SUM(message_count) as credits,
  SUM(input_tokens) as input_tokens,
  SUM(output_tokens) as output_tokens
FROM ai_usage_log
GROUP BY operation, provider
ORDER BY credits DESC;
```

---

## 🐛 Troubleshooting

### Issue: "No API key found"
**Cause**: System API keys not in `.env`
**Solution**: Add `SYSTEM_ANTHROPIC_API_KEY`, `SYSTEM_OPENAI_API_KEY`, etc.

### Issue: "Insufficient credits" but user just registered
**Cause**: Migration not run
**Solution**: Run `npx tsx server/migrations/init-user-credits.ts`

### Issue: BYOK users being charged
**Cause**: Bug in `api-key-manager.ts`
**Solution**: Check `getApiKey()` function - should check BYOK first

### Issue: DeepSeek not being used
**Cause**: `SYSTEM_DEEPSEEK_API_KEY` missing
**Solution**: Add key to `.env`, restart server

### Issue: Credits not deducting
**Cause**: `BILLING_ENABLED=false` or not set
**Solution**: Set `BILLING_ENABLED=true` in `.env`

---

## 📈 Next Steps (After Testing)

Once local testing is complete:

1. **Deploy to Production**:
   ```bash
   # User will give command: "давай заливай"
   git add .
   git commit -m "feat: credit-based billing system with smart AI routing"
   rsync -av --exclude='node_modules' ...
   ```

2. **Add System Keys to Production `.env`**:
   ```bash
   ssh root@5.129.230.171
   nano /root/BudgetBot-Improved/.env
   # Add SYSTEM_* keys
   pm2 restart budgetbot
   ```

3. **Run Migration on Production**:
   ```bash
   ssh root@5.129.230.171
   cd /root/BudgetBot-Improved
   npx tsx server/migrations/init-user-credits.ts
   ```

4. **Build Billing UI** (Future):
   - Credits widget in header
   - `/app/settings/billing` page
   - Stripe payment integration
   - Purchase history

5. **Analytics Dashboard** (Future):
   - Cost monitoring
   - Usage by operation
   - Revenue tracking
   - Popular features

---

## ✅ Testing Complete Checklist

Mark each test as you complete it:

- [ ] Voice message works with billing
- [ ] Receipt OCR works with billing
- [ ] AI chat works with billing
- [ ] BYOK users not charged
- [ ] Insufficient credits error shows correctly
- [ ] Migration ran successfully
- [ ] Credits auto-created for new users
- [ ] Usage logged to `ai_usage_log`
- [ ] Smart routing uses correct providers
- [ ] Cost tracking works

**When all checked**, ready for production deployment! 🚀
