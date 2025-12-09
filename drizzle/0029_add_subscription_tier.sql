-- Add subscription tier field to users table
ALTER TABLE users ADD COLUMN subscriptionTier VARCHAR(20) DEFAULT 'free' AFTER role;
