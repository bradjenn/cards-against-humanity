export function GameHeader({
  title,
  playerCount,
}: {
  title: string;
  playerCount: number;
}) {
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // TODO: optional toast
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-4xl font-black uppercase">{title}</h1>
        <p className="text-sm opacity-70">
          Share this link with your friends so they can join.
        </p>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="badge badge-lg">{playerCount} players</div>

        <button className="btn btn-outline btn-sm" onClick={handleCopyLink}>
          Copy Invite Link
        </button>
      </div>
    </header>
  );
}
