-- Remove duplicate players by merging all their data into the highest-scoring version
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  dup_record RECORD;
  keeper_id UUID;
  duplicate_id UUID;
BEGIN
  -- Loop through all duplicate sets (same name + same game)
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

      -- Migrate submissions (avoid duplicates with ON CONFLICT)
      INSERT INTO submissions (round_id, player_id, card_id)
      SELECT round_id, keeper_id, card_id
      FROM submissions
      WHERE player_id = duplicate_id
      ON CONFLICT (round_id, player_id, card_id) DO NOTHING;

      -- Delete original submissions from duplicate
      DELETE FROM submissions WHERE player_id = duplicate_id;

      -- Migrate player hands (avoid duplicates with ON CONFLICT)
      INSERT INTO player_hands (game_id, player_id, card_id)
      SELECT game_id, keeper_id, card_id
      FROM player_hands
      WHERE player_id = duplicate_id
      ON CONFLICT (game_id, player_id, card_id) DO NOTHING;

      -- Delete original hands from duplicate
      DELETE FROM player_hands WHERE player_id = duplicate_id;

      -- Add duplicate's score to keeper
      UPDATE game_players
      SET score = score + (SELECT score FROM game_players WHERE id = duplicate_id)
      WHERE id = keeper_id;

      -- Now safe to delete the duplicate
      DELETE FROM game_players WHERE id = duplicate_id;

      RAISE NOTICE 'Deleted duplicate ID: %', duplicate_id;
    END LOOP;
  END LOOP;

  RAISE NOTICE '✅ Merge completed successfully!';
END $$;

-- Verify no duplicates remain
SELECT
  game_id,
  name,
  COUNT(*) as count
FROM game_players
GROUP BY game_id, name
HAVING COUNT(*) > 1;

-- Add unique constraint to prevent future duplicates
ALTER TABLE game_players
ADD CONSTRAINT unique_player_per_game
UNIQUE (game_id, name);
