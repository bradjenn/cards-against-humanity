-- Merge duplicate players by migrating all references to the keeper
-- This keeps the player with the highest score and migrates all data

-- Step 1: View duplicates before merging (SAFE - READ ONLY)
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

-- Step 2: Merge duplicates (CAREFUL - this modifies data!)
-- For each duplicate set, this will:
-- 1. Keep the player with highest score
-- 2. Migrate all references from duplicates to the keeper
-- 3. Delete the duplicates
-- UNCOMMENT BELOW TO RUN

/*
DO $$
DECLARE
  dup_record RECORD;
  keeper_id UUID;
  duplicate_id UUID;
BEGIN
  -- Loop through all duplicate sets
  FOR dup_record IN
    SELECT
      game_id,
      name,
      ARRAY_AGG(id ORDER BY score DESC) as player_ids
    FROM game_players
    GROUP BY game_id, name
    HAVING COUNT(*) > 1
  LOOP
    -- First ID in array is the keeper (highest score)
    keeper_id := dup_record.player_ids[1];

    RAISE NOTICE 'Processing duplicates for player "%" in game %', dup_record.name, dup_record.game_id;
    RAISE NOTICE 'Keeping player ID: %', keeper_id;

    -- Loop through duplicate IDs (skip first one - that's the keeper)
    FOR i IN 2..ARRAY_LENGTH(dup_record.player_ids, 1)
    LOOP
      duplicate_id := dup_record.player_ids[i];
      RAISE NOTICE 'Migrating data from duplicate ID: %', duplicate_id;

      -- Migrate rounds where duplicate was judge
      UPDATE rounds
      SET judge_id = keeper_id
      WHERE judge_id = duplicate_id;

      -- Migrate rounds where duplicate was winner
      UPDATE rounds
      SET winning_player_id = keeper_id
      WHERE winning_player_id = duplicate_id;

      -- Migrate submissions
      UPDATE submissions
      SET player_id = keeper_id
      WHERE player_id = duplicate_id;

      -- Migrate player hands
      UPDATE player_hands
      SET player_id = keeper_id
      WHERE player_id = duplicate_id;

      -- Add duplicate's score to keeper (in case they both played)
      UPDATE game_players
      SET score = score + (SELECT score FROM game_players WHERE id = duplicate_id)
      WHERE id = keeper_id;

      -- Now safe to delete the duplicate
      DELETE FROM game_players WHERE id = duplicate_id;

      RAISE NOTICE 'Deleted duplicate ID: %', duplicate_id;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Merge completed successfully!';
END $$;
*/

-- Step 3: Verify no duplicates remain
/*
SELECT
  game_id,
  name,
  COUNT(*) as count
FROM game_players
GROUP BY game_id, name
HAVING COUNT(*) > 1;
*/

-- Step 4: Add unique constraint to prevent future duplicates
/*
ALTER TABLE game_players
ADD CONSTRAINT unique_player_per_game
UNIQUE (game_id, name);
*/
