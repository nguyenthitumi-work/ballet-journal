-- Run this in Supabase SQL Editor to check if parent is linked

-- 1. Check all users
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- 2. Check all families
SELECT * FROM family;

-- 3. Check all family members (replace with your actual user IDs)
SELECT
  fm.family_id,
  fm.user_id,
  fm.role,
  u.email,
  f.name as family_name
FROM family_member fm
JOIN auth.users u ON u.id = fm.user_id
JOIN family f ON f.id = fm.family_id
ORDER BY fm.joined_at DESC;

-- 4. Check pending invites
SELECT * FROM invite WHERE accepted_at IS NOT NULL ORDER BY accepted_at DESC LIMIT 5;
