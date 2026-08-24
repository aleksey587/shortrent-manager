-- Migration 007: Create user_automation_rules table for persistent rule storage
-- Run this in Supabase SQL Editor: Dashboard > SQL Editor > New query

CREATE TABLE IF NOT EXISTS user_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  rules JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Disable RLS — this table is accessed via server-side API only, using email as identifier
ALTER TABLE user_automation_rules ENABLE ROW LEVEL SECURITY;

-- Allow ALL operations — server API handles auth
CREATE POLICY "Allow all via server API" ON user_automation_rules
  FOR ALL USING (true) WITH CHECK (true);

-- Index for fast email lookup
CREATE INDEX IF NOT EXISTS idx_user_automation_rules_email ON user_automation_rules(email);
