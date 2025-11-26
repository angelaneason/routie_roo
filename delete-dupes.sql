-- Keep the first occurrence of each option, delete the rest
-- Assuming IDs: Needs Follow-up (1,2,3), Special Instructions (4,5), VIP Client (6,7,8)
-- We'll keep the lowest ID for each

-- First, let's see what we have
SELECT id, `option` FROM comment_options ORDER BY `option`, id;
