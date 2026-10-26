import { useEffect } from 'react';
// Pulls in the arena header styling (body.qr-immersive) shared with Quiz Rush.
import '../quiz-rush/arena.css';

// Puts a game in the same dark "arena" look Quiz Rush has, regardless of the
// app theme: switches Tailwind's `dark:` variants on (so every game screen
// renders its existing dark styles) and restyles the shared GameArenaShell
// header. Both are undone on unmount so the rest of the app keeps its theme.
export default function useArenaDark() {
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    const hadImmersive = document.body.classList.contains('qr-immersive');

    root.classList.add('dark');
    document.body.classList.add('qr-immersive');

    return () => {
      if (!hadDark) root.classList.remove('dark');
      if (!hadImmersive) document.body.classList.remove('qr-immersive');
    };
  }, []);
}
