export function JoinForm({
  joinName,
  setJoinName,
  joinError,
  onJoin,
}: {
  joinName: string;
  setJoinName: (v: string) => void;
  joinError: string | null;
  onJoin: () => void;
}) {
  return (
    <div className="card bg-base-100 border p-6 space-y-4">
      <h2 className="text-xl font-bold">Join this game</h2>

      <input
        className="input input-bordered"
        placeholder="Your name"
        value={joinName}
        onChange={(e) => setJoinName(e.target.value)}
      />

      {joinError && <div className="alert alert-error">{joinError}</div>}

      <button className="btn btn-primary w-full" onClick={onJoin}>
        Join Game
      </button>
    </div>
  );
}
