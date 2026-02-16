-- Tutorial Steps table: tracks completed tutorial actions per user (gamified onboarding)
CREATE TABLE IF NOT EXISTS tutorial_steps (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  credits_awarded INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, step_id)
);

CREATE INDEX IF NOT EXISTS idx_tutorial_steps_user ON tutorial_steps(user_id);
