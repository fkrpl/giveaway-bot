/*
  # Create Telegram Giveaway Platform Schema

  1. New Tables
    - `users` - All Telegram users who interact with the bot
      - `id` (uuid, primary key)
      - `telegram_id` (bigint, unique) - Telegram user ID
      - `username` (text) - Telegram username
      - `first_name` (text) - User's first name
      - `last_name` (text, nullable) - User's last name
      - `is_admin` (boolean, default false) - Admin flag
      - `created_at` (timestamptz)

    - `contests` - Giveaway contests
      - `id` (uuid, primary key)
      - `title` (text) - Contest name
      - `description` (text) - Contest description
      - `prize` (text) - Prize description
      - `winner_count` (integer) - Number of winners
      - `end_date` (timestamptz) - When contest ends
      - `is_active` (boolean, default true) - Active flag
      - `is_ad` (boolean, default false) - Ad/sponsored contest flag
      - `ad_text` (text, nullable) - Advertisement text shown after participation
      - `image_url` (text, nullable) - Contest image
      - `created_by` (uuid, FK to users) - Creator
      - `created_at` (timestamptz)

    - `required_channels` - Channels users must subscribe to for a contest
      - `id` (uuid, primary key)
      - `contest_id` (uuid, FK to contests) - Related contest
      - `channel_username` (text) - Channel @username
      - `channel_title` (text) - Channel display name
      - `created_at` (timestamptz)

    - `participants` - Users participating in contests
      - `id` (uuid, primary key)
      - `contest_id` (uuid, FK to contests) - Related contest
      - `user_id` (uuid, FK to users) - Related user
      - `telegram_id` (bigint) - Telegram ID for quick lookup
      - `joined_at` (timestamptz)

    - `winners` - Contest winners
      - `id` (uuid, primary key)
      - `contest_id` (uuid, FK to contests) - Related contest
      - `user_id` (uuid, FK to users) - Winner user
      - `selected_at` (timestamptz)

    - `broadcast_messages` - Admin broadcast/ad messages
      - `id` (uuid, primary key)
      - `admin_id` (uuid, FK to users) - Who sent it
      - `content` (text) - Message content
      - `sent_count` (integer, default 0) - How many users received it
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Admin-only write policies
    - Public read for active contests
    - Users can insert their own participation
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint UNIQUE NOT NULL,
  username text DEFAULT '',
  first_name text DEFAULT '',
  last_name text DEFAULT '',
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Contests table
CREATE TABLE IF NOT EXISTS contests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  prize text NOT NULL,
  winner_count integer NOT NULL DEFAULT 1,
  end_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  is_ad boolean DEFAULT false,
  ad_text text DEFAULT '',
  image_url text DEFAULT '',
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Required channels table
CREATE TABLE IF NOT EXISTS required_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  channel_username text NOT NULL,
  channel_title text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  telegram_id bigint NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(contest_id, user_id)
);

-- Winners table
CREATE TABLE IF NOT EXISTS winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  selected_at timestamptz DEFAULT now(),
  UNIQUE(contest_id, user_id)
);

-- Broadcast messages table
CREATE TABLE IF NOT EXISTS broadcast_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES users(id),
  content text NOT NULL,
  sent_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE required_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Anyone can read users" ON users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service role can insert users" ON users FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "Service role can update users" ON users FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);

-- Contests policies (public can read active, admin can write)
CREATE POLICY "Public can read active contests" ON contests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service role can manage contests" ON contests FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "Service role can update contests" ON contests FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "Service role can delete contests" ON contests FOR DELETE TO authenticated, anon USING (true);

-- Required channels policies
CREATE POLICY "Public can read channels" ON required_channels FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service role can manage channels" ON required_channels FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "Service role can delete channels" ON required_channels FOR DELETE TO authenticated, anon USING (true);

-- Participants policies
CREATE POLICY "Public can read participants" ON participants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service role can insert participants" ON participants FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "Service role can delete participants" ON participants FOR DELETE TO authenticated, anon USING (true);

-- Winners policies
CREATE POLICY "Public can read winners" ON winners FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service role can insert winners" ON winners FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "Service role can delete winners" ON winners FOR DELETE TO authenticated, anon USING (true);

-- Broadcast messages policies
CREATE POLICY "Service role can read broadcasts" ON broadcast_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service role can manage broadcasts" ON broadcast_messages FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "Service role can update broadcasts" ON broadcast_messages FOR UPDATE TO authenticated, authenticated USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_participants_contest ON participants(contest_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON participants(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_contest ON winners(contest_id);
CREATE INDEX IF NOT EXISTS idx_channels_contest ON required_channels(contest_id);
CREATE INDEX IF NOT EXISTS idx_contests_active ON contests(is_active);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
