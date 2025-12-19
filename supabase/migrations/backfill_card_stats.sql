-- Backfill card stats from existing game data
-- Run this AFTER creating the increment_card_stats function

-- First, clear any existing card stats to start fresh
TRUNCATE TABLE card_stats;

-- Backfill card statistics from all completed rounds
DO $$
DECLARE
  round_record RECORD;
  submission_record RECORD;
BEGIN
  -- Loop through all rounds that have a winner
  FOR round_record IN
    SELECT id, winning_player_id
    FROM rounds
    WHERE winning_player_id IS NOT NULL
  LOOP
    -- Loop through all submissions for this round
    FOR submission_record IN
      SELECT card_id, player_id
      FROM submissions
      WHERE round_id = round_record.id
    LOOP
      -- Check if this card was part of the winning submission
      IF submission_record.player_id = round_record.winning_player_id THEN
        -- Winning card: increment both times_won and times_played
        PERFORM increment_card_stats(submission_record.card_id, true);
      ELSE
        -- Non-winning card: increment only times_played
        PERFORM increment_card_stats(submission_record.card_id, false);
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Card stats backfill completed successfully';
END $$;

-- Show summary of backfilled data
SELECT
  COUNT(*) as total_cards_with_stats,
  SUM(times_played) as total_plays,
  SUM(times_won) as total_wins
FROM card_stats;

-- Show top 10 winning cards
SELECT
  c.text,
  cs.times_won,
  cs.times_played,
  ROUND((cs.times_won::numeric / cs.times_played::numeric) * 100, 1) as win_rate_percent
FROM card_stats cs
JOIN cards c ON c.id = cs.card_id
WHERE cs.times_won > 0
ORDER BY cs.times_won DESC, cs.times_played DESC
LIMIT 10;
