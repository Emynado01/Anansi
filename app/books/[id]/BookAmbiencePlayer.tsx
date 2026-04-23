"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface BookAmbiencePlayerProps {
  src: string;
  title: string;
}

const BookAmbiencePlayer = ({ src, title }: BookAmbiencePlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const playAmbience = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.22;
    audio.loop = true;

    try {
      await audio.play();
      setIsPlaying(true);
      setIsBlocked(false);
    } catch {
      setIsPlaying(false);
      setIsBlocked(true);
    }
  }, []);

  const pauseAmbience = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
  };

  useEffect(() => {
    const audio = audioRef.current;
    void playAmbience();

    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, [playAmbience]);

  return (
    <div className="rounded-[8px] border border-brand-300/30 bg-black/40 p-3 text-sm text-zinc-300">
      <audio ref={audioRef} src={src} preload="metadata" loop />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-100">Ambiance sonore</p>
          <p className="mt-1 text-xs text-zinc-400">
            {isBlocked
              ? "Lecture automatique bloquée par le navigateur."
              : isPlaying
                ? `Musique de ${title} en cours.`
                : `Musique de ${title} prête.`}
          </p>
        </div>
        <button
          type="button"
          onClick={isPlaying ? pauseAmbience : playAmbience}
          className="inline-flex justify-center rounded-[8px] border border-brand-300/50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-brand-100 transition hover:bg-brand-300 hover:text-black"
        >
          {isPlaying ? "Couper" : "Activer"}
        </button>
      </div>
    </div>
  );
};

export default BookAmbiencePlayer;
