export function JoinForm({
  joinName,
  setJoinName,
  joinError,
  onJoin,
  isEditingName = true,
  onEditName,
}: {
  joinName: string;
  setJoinName: (v: string) => void;
  joinError: string | null;
  onJoin: () => void;
  isEditingName?: boolean;
  onEditName?: () => void;
}) {
  return (
    <div className="card bg-base-100 border p-6 space-y-4">
      <h2 className="text-xl font-bold">Join this game</h2>

      {isEditingName ? (
        <div className="space-y-2">
          <input
            className="input input-bordered w-full"
            placeholder="Your name"
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-base-200 rounded">
          <span className="font-medium">{joinName}</span>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onEditName}
          >
            Change
          </button>
        </div>
      )}

      {joinError && <div className="alert alert-error">{joinError}</div>}

      <button className="btn btn-primary w-full" onClick={onJoin}>
        Join Game
      </button>
    </div>
  );
}
