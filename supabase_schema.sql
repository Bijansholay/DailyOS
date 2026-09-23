-- DailyOS Supabase PostgreSQL Database Schema Setup

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  timezone TEXT DEFAULT 'UTC',
  otp_code TEXT,
  otp_expires_at TIMESTAMPTZ,
  otp_attempts INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default system user initialization
INSERT INTO users (id, email, timezone)
VALUES ('00000000-0000-0000-0000-000000000001', 'user@dailyos.local', 'UTC')
ON CONFLICT (id) DO NOTHING;

-- 2. TASKS TABLE
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'personal',
  estimated_minutes INT DEFAULT 30,
  actual_minutes INT,
  scheduled_for DATE,
  scheduled_time TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 3. EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT,
  category TEXT DEFAULT 'general',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DAILY LOGS TABLE
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  tasks_completed INT DEFAULT 0,
  tasks_skipped INT DEFAULT 0,
  tasks_late INT DEFAULT 0,
  mood_note TEXT,
  ai_summary JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, log_date)
);

-- 5. PATTERNS TABLE
CREATE TABLE IF NOT EXISTS patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  most_productive_hours JSONB,
  worst_category TEXT,
  avg_completion_ratio NUMERIC DEFAULT 1.0,
  skip_streak_flags JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. GOALS TABLE
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  period_type TEXT NOT NULL, -- 'daily' | 'weekly' | 'monthly'
  period_key TEXT NOT NULL,  -- 'YYYY-MM-DD' | 'YYYY-Wxx' | 'YYYY-MM'
  target_value INT DEFAULT 1,
  current_value INT DEFAULT 0,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'pending', -- 'pending' | 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for performance & query optimization
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_events_user_date ON events(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_patterns_user_date ON patterns(user_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user_period ON goals(user_id, period_type, period_key);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for API integration (Idempotent)
DROP POLICY IF EXISTS "Allow all access to users" ON users;
CREATE POLICY "Allow all access to users" ON users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to tasks" ON tasks;
CREATE POLICY "Allow all access to tasks" ON tasks FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to events" ON events;
CREATE POLICY "Allow all access to events" ON events FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to daily_logs" ON daily_logs;
CREATE POLICY "Allow all access to daily_logs" ON daily_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to patterns" ON patterns;
CREATE POLICY "Allow all access to patterns" ON patterns FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to goals" ON goals;
CREATE POLICY "Allow all access to goals" ON goals FOR ALL USING (true);
