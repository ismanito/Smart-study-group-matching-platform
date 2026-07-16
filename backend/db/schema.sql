-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT users_role_check CHECK (role IN ('student', 'admin'))
);

CREATE INDEX idx_users_email ON users (email);

-- Course units table
CREATE TABLE course_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    department TEXT NOT NULL
);

CREATE INDEX idx_course_units_code ON course_units (code);

-- User-course junction table
CREATE TABLE user_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES course_units (id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT user_units_unique_user_unit UNIQUE (user_id, unit_id)
);

CREATE INDEX idx_user_units_user_id ON user_units (user_id);
CREATE INDEX idx_user_units_unit_id ON user_units (unit_id);

-- Study groups table
CREATE TABLE study_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    unit_id UUID NOT NULL REFERENCES course_units (id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    max_members INTEGER NOT NULL DEFAULT 8,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT study_groups_max_members_check CHECK (max_members >= 1)
);

CREATE INDEX idx_study_groups_unit_id ON study_groups (unit_id);
CREATE INDEX idx_study_groups_created_by ON study_groups (created_by);

-- Group membership table
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES study_groups (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT group_members_role_check CHECK (role IN ('member', 'leader')),
    CONSTRAINT group_members_unique_member UNIQUE (group_id, user_id)
);

CREATE INDEX idx_group_members_group_id ON group_members (group_id);
CREATE INDEX idx_group_members_user_id ON group_members (user_id);

-- Notes table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES study_groups (id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    filename TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notes_group_id ON notes (group_id);
CREATE INDEX idx_notes_uploaded_by ON notes (uploaded_by);

-- Schedules table
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CONSTRAINT schedules_time_check CHECK (end_time > start_time)
);

CREATE INDEX idx_schedules_user_id ON schedules (user_id);
CREATE INDEX idx_schedules_day_of_week ON schedules (day_of_week);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES study_groups (id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    content TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_group_id ON messages (group_id);
CREATE INDEX idx_messages_sender_id ON messages (sender_id);
