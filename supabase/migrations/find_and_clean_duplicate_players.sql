-- Find and clean duplicate players in the same game
-- Run this in your Supabase SQL Editor

-- Step 1: Find all duplicate players (same name + same game)
SELECT
  game_id,
  name,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY score DESC) as player_ids_by_score,
  ARRAY_AGG(score ORDER BY score DESC) as scores
FROM game_players
GROUP BY game_id, name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: View detailed information about duplicates
SELECT
  gp.game_id,
  g.slug as game_slug,
  gp.name,
  gp.id,
  gp.score,
  gp.is_connected
FROM game_players gp
JOIN games g ON g.id = gp.game_id
WHERE (gp.game_id, gp.name) IN (
  SELECT game_id, name
  FROM game_players
  GROUP BY game_id, name
  HAVING COUNT(*) > 1
)
ORDER BY gp.game_id, gp.name, gp.score DESC;

-- Step 3: Clean up duplicates (CAREFUL - this deletes data!)
-- This keeps the player with the HIGHEST SCORE and deletes the rest
-- UNCOMMENT THE LINES BELOW ONLY AFTER REVIEWING THE DUPLICATES ABOVE

/*
WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY game_id, name
      ORDER BY score DESC, id ASC
    ) as row_num
  FROM game_players
)
DELETE FROM game_players
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
)
RETURNING *;
*/

-- Step 4: After cleanup, verify no duplicates remain
-- Run this to confirm the cleanup worked
/*
SELECT
  game_id,
  name,
  COUNT(*) as count
FROM game_players
GROUP BY game_id, name
HAVING COUNT(*) > 1;
*/

-- Step 5: Add a unique constraint to prevent future duplicates (OPTIONAL)
-- This ensures a player name can only exist once per game
-- UNCOMMENT to add the constraint
/*
ALTER TABLE game_players
ADD CONSTRAINT unique_player_per_game
UNIQUE (game_id, name);
*/
