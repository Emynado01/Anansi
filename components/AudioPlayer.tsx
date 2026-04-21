"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { cn, formatDuration } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  title: string;
  author: string;
  album?: string;
  artworkUrl?: string | null;
  durationSec?: number;
  className?: string;
  startSec?: number;
  previousTrackHref?: string | null;
  nextTrackHref?: string | null;
  onTimeUpdate?: (current: number, duration: number) => void;
  onEnded?: () => void;
}

const AudioPlayer = ({
  src,
  title,
  author,
  album,
  artworkUrl,
  durationSec,
  className,
  startSec = 0,
  previousTrackHref,
  nextTrackHref,
  onTimeUpdate,
  onEnded,
}: AudioPlayerProps) => {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(durationSec ?? 0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const updateMediaPosition = useCallback((currentTime?: number, audioDuration?: number) => {
    if (!("mediaSession" in navigator) || !navigator.mediaSession.setPositionState) return;

    const safeDuration = audioDuration ?? durationSec ?? 0;
    if (!Number.isFinite(safeDuration) || safeDuration <= 0) return;

    try {
      navigator.mediaSession.setPositionState({
        duration: safeDuration,
        playbackRate,
        position: Math.max(0, Math.min(currentTime ?? 0, safeDuration)),
      });
    } catch {
      // Some mobile browsers expose Media Session partially.
    }
  }, [durationSec, playbackRate]);

  const playAudio = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      await audio.play();
      setIsPlaying(true);
      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "playing";
      }
    } catch {
      setIsPlaying(false);
      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "paused";
      }
    }
  }, []);

  const pauseAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setIsPlaying(false);
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "paused";
    }
  }, []);

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextTime = Math.max(0, Math.min((audio.duration || duration || 0), audio.currentTime + seconds));
    audio.currentTime = nextTime;
    setProgress(nextTime);
    updateMediaPosition(nextTime, audio.duration || duration || durationSec || 0);
  }, [duration, durationSec, updateMediaPosition]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: author,
      album,
      artwork: artworkUrl
        ? [
            { src: artworkUrl, sizes: "96x96" },
            { src: artworkUrl, sizes: "256x256" },
            { src: artworkUrl, sizes: "512x512" },
          ]
        : [],
    });

    const setActionHandler = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null,
    ) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Unsupported actions are ignored by Safari and some Android browsers.
      }
    };

    setActionHandler("play", () => {
      void playAudio();
    });
    setActionHandler("pause", pauseAudio);
    setActionHandler("seekbackward", (details) => skip(-(details.seekOffset ?? 15)));
    setActionHandler("seekforward", (details) => skip(details.seekOffset ?? 30));
    setActionHandler("seekto", (details) => {
      const audio = audioRef.current;
      if (!audio || typeof details.seekTime !== "number") return;
      audio.currentTime = Math.max(0, Math.min(details.seekTime, audio.duration || duration || durationSec || 0));
      setProgress(audio.currentTime);
      updateMediaPosition(audio.currentTime, audio.duration || duration || durationSec || 0);
    });
    setActionHandler("previoustrack", previousTrackHref ? () => router.push(previousTrackHref) : null);
    setActionHandler("nexttrack", nextTrackHref ? () => router.push(nextTrackHref) : null);

    return () => {
      setActionHandler("play", null);
      setActionHandler("pause", null);
      setActionHandler("seekbackward", null);
      setActionHandler("seekforward", null);
      setActionHandler("seekto", null);
      setActionHandler("previoustrack", null);
      setActionHandler("nexttrack", null);
      navigator.mediaSession.playbackState = "none";
    };
  }, [
    album,
    artworkUrl,
    author,
    duration,
    durationSec,
    nextTrackHref,
    pauseAudio,
    playAudio,
    playbackRate,
    previousTrackHref,
    router,
    skip,
    title,
    updateMediaPosition,
  ]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || durationSec || 0);
      audio.playbackRate = playbackRate;
      updateMediaPosition(audio.currentTime, audio.duration || durationSec || 0);
      if (startSec && Number.isFinite(startSec)) {
        try {
          audio.currentTime = Math.max(0, Math.min(startSec, audio.duration || startSec));
          setProgress(audio.currentTime);
          updateMediaPosition(audio.currentTime, audio.duration || durationSec || 0);
        } catch {
          // ignore
        }
      }
    };

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
      updateMediaPosition(audio.currentTime, audio.duration || durationSec || 0);
      if (onTimeUpdate) onTimeUpdate(audio.currentTime, audio.duration || durationSec || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "paused";
      }
      if (onEnded) onEnded();
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [durationSec, playbackRate, startSec, onEnded, onTimeUpdate, updateMediaPosition]);

  const togglePlayback = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      void playAudio();
    }
  };

  const handleScrub = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const { value } = event.target;
    const time = parseFloat(value);
    audio.currentTime = time;
    setProgress(time);
    updateMediaPosition(time, audio.duration || duration || durationSec || 0);
  };

  const changeSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
      updateMediaPosition(audioRef.current.currentTime, audioRef.current.duration || duration || durationSec || 0);
    }
  };

  const elapsed = progress;
  const remaining = Math.max((duration || 0) - progress, 0);

  return (
    <div
      className={cn(
        "w-full rounded-[8px] border border-slate-200 bg-white/90 p-4 shadow-lg shadow-brand-200/40 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80",
        className,
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{author}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Reculer de 15 secondes"
              onClick={() => skip(-15)}
              className="h-10 rounded-[8px] border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300"
            >
              -15s
            </button>
            <button
              type="button"
              aria-label={isPlaying ? "Mettre en pause la lecture" : "Lancer la lecture"}
              onClick={togglePlayback}
              className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-brand-500 text-white shadow-glow transition hover:bg-brand-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              {isPlaying ? (
                <span className="sr-only">Pause</span>
              ) : (
                <span className="sr-only">Lecture</span>
              )}
              <svg
                aria-hidden
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                {isPlaying ? (
                  <path d="M8 5h3v14H8zm5 0h3v14h-3z" />
                ) : (
                  <path d="M8 5.14v13.72L18 12 8 5.14z" />
                )}
              </svg>
            </button>
            <button
              type="button"
              aria-label="Avancer de 30 secondes"
              onClick={() => skip(30)}
              className="h-10 rounded-[8px] border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300"
            >
              +30s
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <input
            type="range"
            min={0}
            max={duration}
            step={0.5}
            value={progress}
            onChange={handleScrub}
            aria-label="Position de lecture"
            className="range range-brand h-2 w-full cursor-pointer appearance-none rounded-[8px] bg-slate-200 dark:bg-slate-700"
          />
          <div className="flex justify-between text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <span aria-live="polite">{formatDuration(elapsed)}</span>
            <button type="button" onClick={changeSpeed} className="rounded-[8px] border border-slate-200 px-2 py-1 text-slate-600 transition hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300">
              {playbackRate}x
            </button>
            <span aria-live="polite">- {formatDuration(remaining)}</span>
          </div>
        </div>
      </div>
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
};

export default AudioPlayer;
