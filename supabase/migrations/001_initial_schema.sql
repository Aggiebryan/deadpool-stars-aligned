
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    total_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Celebrity picks table
CREATE TABLE IF NOT EXISTS celebrity_picks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    celebrity_name VARCHAR(255) NOT NULL,
    game_year INTEGER NOT NULL DEFAULT 2025,
    is_hit BOOLEAN DEFAULT FALSE,
    points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, celebrity_name, game_year)
);

-- Deceased celebrities table
CREATE TABLE IF NOT EXISTS deceased_celebrities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canonical_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    date_of_death DATE NOT NULL,
    age_at_death INTEGER NOT NULL,
    cause_of_death_category VARCHAR(50) CHECK (cause_of_death_category IN ('Natural', 'Accidental', 'Violent', 'Suicide', 'RareOrUnusual', 'PandemicOrOutbreak', 'Unknown')),
    cause_of_death_details TEXT,
    died_during_public_event BOOLEAN DEFAULT FALSE,
    died_in_extreme_sport BOOLEAN DEFAULT FALSE,
    died_on_birthday BOOLEAN DEFAULT FALSE,
    died_on_major_holiday BOOLEAN DEFAULT FALSE,
    is_first_death_of_year BOOLEAN DEFAULT FALSE,
    is_last_death_of_year BOOLEAN DEFAULT FALSE,
    game_year INTEGER NOT NULL DEFAULT 2025,
    entered_by_admin_id UUID REFERENCES users(id),
    source_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Holidays table
CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    game_year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert major holidays for 2025
INSERT INTO holidays (name, date, game_year) VALUES
('New Year''s Day', '2025-01-01', 2025),
('Martin Luther King Jr. Day', '2025-01-20', 2025),
('Presidents'' Day', '2025-02-17', 2025),
('Valentine''s Day', '2025-02-14', 2025),
('Easter', '2025-04-20', 2025),
('Mother''s Day', '2025-05-11', 2025),
('Memorial Day', '2025-05-26', 2025),
('Father''s Day', '2025-06-15', 2025),
('Independence Day', '2025-07-04', 2025),
('Labor Day', '2025-09-01', 2025),
('Columbus Day', '2025-10-13', 2025),
('Halloween', '2025-10-31', 2025),
('Veterans Day', '2025-11-11', 2025),
('Thanksgiving', '2025-11-27', 2025),
('Christmas Day', '2025-12-25', 2025);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE celebrity_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deceased_celebrities ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own data, admins can read all
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text OR is_admin = true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Admins can manage all users" ON users FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_admin = true));

-- Celebrity picks policies
CREATE POLICY "Users can view own picks" ON celebrity_picks FOR SELECT USING (auth.uid()::text = user_id::text OR EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_admin = true));
CREATE POLICY "Users can manage own picks" ON celebrity_picks FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Admins can view all picks" ON celebrity_picks FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_admin = true));

-- Deceased celebrities policies (public read, admin write)
CREATE POLICY "Anyone can view deceased celebrities" ON deceased_celebrities FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage deceased celebrities" ON deceased_celebrities FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_admin = true));

-- Holidays policies (public read)
CREATE POLICY "Anyone can view holidays" ON holidays FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage holidays" ON holidays FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND is_admin = true));

-- Create indexes for better performance
CREATE INDEX idx_celebrity_picks_user_id ON celebrity_picks(user_id);
CREATE INDEX idx_celebrity_picks_game_year ON celebrity_picks(game_year);
CREATE INDEX idx_deceased_celebrities_game_year ON deceased_celebrities(game_year);
CREATE INDEX idx_deceased_celebrities_date_of_death ON deceased_celebrities(date_of_death);
CREATE INDEX idx_holidays_game_year ON holidays(game_year);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_celebrity_picks_updated_at BEFORE UPDATE ON celebrity_picks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deceased_celebrities_updated_at BEFORE UPDATE ON deceased_celebrities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
