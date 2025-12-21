import confetti from "canvas-confetti";
import { useEffect, useRef, useState } from "react";

// Curated list of celebration GIFs
const CELEBRATION_GIFS = [
  "https://media.giphy.com/media/g9582DNuQppxC/giphy.gif", // Chappelle celebration
  "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif", // Party celebration
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif", // Office celebration
  "https://media.giphy.com/media/kyLYXonQYYfwYDIeZl/giphy.gif", // Finger guns celebration
  "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif", // Leslie Knope celebration
  "https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif", // The Office yes
  "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif", // Steve Carell yes
  "https://media.giphy.com/media/Is1O1TWV0LEJi/giphy.gif", // Napoleon Dynamite yes
  "https://media.giphy.com/media/3oz8xAFtqoOUUrsh7W/giphy.gif", // Minion celebration
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif", // Michael Scott celebration
];

function getRandomGif(): string {
  return CELEBRATION_GIFS[Math.floor(Math.random() * CELEBRATION_GIFS.length)];
}

export function useWinnerCelebration({ isWinner }: { isWinner: boolean }) {
  const hasCelebratedRef = useRef(false);
  const [showBanner, setShowBanner] = useState(false);
  const [celebrationGif, setCelebrationGif] = useState<string>("");
  const [gifLoaded, setGifLoaded] = useState(false);

  useEffect(() => {
    if (!isWinner) {
      hasCelebratedRef.current = false;
      setShowBanner(false);
      setGifLoaded(false);
      return;
    }

    if (hasCelebratedRef.current) return;

    hasCelebratedRef.current = true;

    // Pick a random celebration GIF and preload it
    const gifUrl = getRandomGif();
    setCelebrationGif(gifUrl);

    // Preload the GIF before showing the banner
    const img = new Image();
    img.onload = () => {
      setGifLoaded(true);
      setShowBanner(true);

      confetti({
        particleCount: 1500,
        spread: 70,
        origin: { y: 0.6 },
      });
    };
    img.src = gifUrl;

    const timeout = setTimeout(() => {
      setShowBanner(false);
      setGifLoaded(false);
    }, 4000);

    return () => clearTimeout(timeout);
  }, [isWinner]);

  return { showWinnerBanner: showBanner, celebrationGif, gifLoaded };
}
