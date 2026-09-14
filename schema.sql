-- DailyOS Supabase / PostgreSQL Schema Definition

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'personal', -- school, work, personal, health, etc.
    estimated_minutes INT NOT NULL DEFAULT 30,
    actual_minutes INT, -- filled on task completion
    scheduled_for DATE, -- nullable for backlog tasks
    scheduled_time TIME, -- optional specific time slot e.g. 14:30
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'skipped', 'late')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME,
    category TEXT DEFAULT 'general',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Daily Logs table
CREATE TABLE IF NOT EXISTS daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    tasks_completed INT DEFAULT 0,
    tasks_skipped INT DEFAULT 0,
    tasks_late INT DEFAULT 0,
    mood_note TEXT,
    ai_summary TEXT, -- Stores JSON string: { schedule: [...], insight: "..." }
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, log_date)
);

-- Patterns table (recomputed periodically)
CREATE TABLE IF NOT EXISTS patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    computed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    most_productive_hours JSONB, -- e.g. {"start": "09:00", "end": "12:00", "hourly_distribution": {...}}
    worst_category TEXT, -- category with highest skip rate
    avg_completion_ratio FLOAT, -- actual_minutes / estimated_minutes average
    skip_streak_flags JSONB, -- tasks/categories skipped 3+ days running
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for optimal querying
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_events_user_date ON events(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_patterns_user_computed ON patterns(user_id, computed_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow users to read/modify only their own rows)
CREATE POLICY "Users can manage their own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage their own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own events" ON events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own daily logs" ON daily_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own patterns" ON patterns FOR ALL USING (auth.uid() = user_id);
