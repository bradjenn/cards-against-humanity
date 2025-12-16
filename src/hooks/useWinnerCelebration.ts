import confetti from "canvas-confetti";
import { useEffect, useRef, useState } from "react";

export function useWinnerCelebration({ isWinner }: { isWinner: boolean }) {
  const hasCelebratedRef = useRef(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isWinner) {
      hasCelebratedRef.current = false;
      setShowBanner(false);
      return;
    }

    if (hasCelebratedRef.current) return;

    hasCelebratedRef.current = true;

    confetti({
      particleCount: 1500,
      spread: 70,
      origin: { y: 0.6 },
    });

    setShowBanner(true);

    const timeout = setTimeout(() => {
      setShowBanner(false);
    }, 4000);

    return () => clearTimeout(timeout);
  }, [isWinner]);

  return { showWinnerBanner: showBanner };
}
