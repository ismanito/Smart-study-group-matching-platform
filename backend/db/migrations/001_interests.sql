-- StudyMatch interests feature
-- Compatible with this project's users.id (UUID).
-- Interests use SERIAL as specified; user_id stays UUID to match schema.sql.

CREATE TABLE IF NOT EXISTS interests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_interests (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest_id INTEGER NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, interest_id)
);

CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests (user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_interest_id ON user_interests (interest_id);

INSERT INTO interests (name, icon) VALUES
  ('Mathematics', '📐'),
  ('Physics', '⚛️'),
  ('Chemistry', '🧪'),
  ('Biology', '🧬'),
  ('Computer Science', '💻'),
  ('Literature', '📚'),
  ('History', '🏛️'),
  ('Economics', '📊'),
  ('Psychology', '🧠'),
  ('Engineering', '🔧'),
  ('Art', '🎨'),
  ('Music', '🎵')
ON CONFLICT (name) DO NOTHING;
