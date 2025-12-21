import { X } from "lucide-react";
import { useWinnerCelebration } from "@/hooks/useWinnerCelebration";

export function WinnerBanner({ isWinner }: { isWinner: boolean }) {
  const { showWinnerBanner, celebrationGif, gifLoaded, dismissBanner } =
    useWinnerCelebration({
      isWinner,
    });

  if (!isWinner || !showWinnerBanner) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-white border-4 border-black rounded-lg p-8 max-w-md mx-4 text-center space-y-4">
        <button
          type="button"
          onClick={dismissBanner}
          className="absolute top-2 right-2 btn btn-ghost btn-sm btn-circle"
          aria-label="Dismiss winner announcement"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-4xl font-bold">🏆 You Won This Round! 🏆</h2>
        {celebrationGif && (
          <div className="w-full h-48 bg-gray-100 rounded-lg border-2 border-black overflow-hidden">
            {gifLoaded ? (
              <img
                src={celebrationGif}
                alt="Celebration"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="loading loading-spinner loading-lg" />
              </div>
            )}
          </div>
        )}
        <p className="text-lg font-semibold">Your answer was the funniest!</p>
      </div>
    </div>
  );
}
