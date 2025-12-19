-- Function to increment card statistics
-- This function is called when a winner is picked to track card performance
CREATE OR REPLACE FUNCTION increment_card_stats(
  card_id_param UUID,
  won BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert or update card stats
  INSERT INTO card_stats (card_id, times_played, times_won)
  VALUES (
    card_id_param,
    1,
    CASE WHEN won THEN 1 ELSE 0 END
  )
  ON CONFLICT (card_id)
  DO UPDATE SET
    times_played = card_stats.times_played + 1,
    times_won = card_stats.times_won + CASE WHEN won THEN 1 ELSE 0 END;
END;
$$;
