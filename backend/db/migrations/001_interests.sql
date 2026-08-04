-- Migration: interests + user_interests
-- Run against your PostgreSQL database after schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES interests (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_interests_unique_pair UNIQUE (user_id, interest_id)
);

CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests (user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_interest_id ON user_interests (interest_id);

-- 12 default interests with emoji icons
INSERT INTO interests (name, icon) VALUES
  ('Math', '📐'),
  ('Physics', '⚛️'),
  ('Chemistry', '🧪'),
  ('Biology', '🧬'),
  ('Computer Science', '💻'),
  ('Literature', '📚'),
  ('History', '🏛️'),
  ('Economics', '📊'),
  ('Psychology', '🧠'),
  ('Engineering', '⚙️'),
  ('Art', '🎨'),
  ('Music', '🎵')
ON CONFLICT (name) DO NOTHING;
