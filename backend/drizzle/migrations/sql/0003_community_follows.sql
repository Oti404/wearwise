-- Migration: Community Follows Feature
-- Run this SQL in your Supabase SQL editor to add the follows table and update users

-- 1. Add followers/following count columns to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- 2. Create the follows table
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_follow UNIQUE (follower_id, followed_id)
);

-- 3. Index for fast lookup of followers and following
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed ON follows(followed_id);

-- 4. Verify
SELECT 'Migration 0003_community_follows applied successfully' AS status;
