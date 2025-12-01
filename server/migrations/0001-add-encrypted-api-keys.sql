-- Migration: Add encrypted API key fields
-- This migration adds new encrypted fields while keeping legacy fields for backward compatibility

-- Add new encrypted columns
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS anthropic_api_key_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS openai_api_key_encrypted TEXT;

-- Add comments for documentation
COMMENT ON COLUMN settings.anthropic_api_key IS 'DEPRECATED: Legacy unencrypted field. Use anthropic_api_key_encrypted instead';
COMMENT ON COLUMN settings.openai_api_key IS 'DEPRECATED: Legacy unencrypted field. Use openai_api_key_encrypted instead';
COMMENT ON COLUMN settings.anthropic_api_key_encrypted IS 'Encrypted Anthropic API key (AES-256-GCM, format: iv:authTag:encrypted)';
COMMENT ON COLUMN settings.openai_api_key_encrypted IS 'Encrypted OpenAI API key (AES-256-GCM, format: iv:authTag:encrypted)';

-- Note: Data migration will be handled by the application code
-- After migration is complete and verified, run:
-- ALTER TABLE settings DROP COLUMN anthropic_api_key;
-- ALTER TABLE settings DROP COLUMN openai_api_key;
