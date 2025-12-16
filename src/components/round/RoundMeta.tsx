import type { GamePlayer } from "@/types/db";

export function RoundMeta({
  judge,
  submissions,
  totalPlayers,
  roundNumber,
}: {
  judge: GamePlayer | null;
  submissions: number;
  totalPlayers: number;
  roundNumber: number;
}) {
  const nonJudgeCount = Math.max(totalPlayers - 1, 0);

  return (
    <div className="flex justify-between items-center py-2 gap-1 text-sm">
      <h2 className="text-xl font-bold">Round {roundNumber}</h2>

      <div className="flex gap-2 items-center">
        <span>Judge: {judge?.name ?? "Unknown"}</span>
        <span>
          Submissions: {submissions} / {nonJudgeCount}
        </span>
      </div>
    </div>
  );
}
