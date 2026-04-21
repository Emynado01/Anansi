import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import AudioPlayer from "@/components/AudioPlayer";
import { resolveMediaUrl } from "@/lib/media";
import prisma from "@/lib/prisma";
import { formatDuration } from "@/lib/utils";

interface PlayerPageProps {
  params: { id: string };
  searchParams?: { chapter?: string };
}

const PlayerPage = async ({ params, searchParams }: PlayerPageProps) => {
  const audiobook = await prisma.audiobook.findFirst({
    where: { id: params.id, isPublished: true },
    include: {
      chapters: { orderBy: { order: "asc" } },
    },
  });

  if (!audiobook) {
    notFound();
  }

  const bookCoverUrl = resolveMediaUrl(audiobook.coverKey, audiobook.coverUrl);
  const bookAudioUrl = resolveMediaUrl(audiobook.audioKey, audiobook.audioUrl);
  const chapterTracks = audiobook.chapters
    .map((chapter, index) => ({
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      audioUrl: resolveMediaUrl(chapter.audioKey, chapter.audioUrl),
      coverUrl: resolveMediaUrl(chapter.coverKey, chapter.coverUrl) || bookCoverUrl,
      durationSec: chapter.durationSec,
      order: chapter.order ?? index,
      href: `/player/${audiobook.id}?chapter=${chapter.id}`,
    }))
    .filter((chapter) => chapter.audioUrl);

  const tracks =
    chapterTracks.length > 0
      ? chapterTracks
      : bookAudioUrl
        ? [
            {
              id: `${audiobook.id}-main-track`,
              title: audiobook.title,
              description: audiobook.summary,
              audioUrl: bookAudioUrl,
              coverUrl: bookCoverUrl,
              durationSec: audiobook.durationSec,
              order: 0,
              href: `/player/${audiobook.id}`,
            },
          ]
        : [];

  const requestedChapter = searchParams?.chapter;
  const requestedIndex = requestedChapter
    ? tracks.findIndex((track) => track.id === requestedChapter || String(track.order) === requestedChapter)
    : 0;
  const currentIndex = requestedIndex >= 0 ? requestedIndex : -1;
  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : null;

  if (requestedChapter && !currentTrack) {
    notFound();
  }

  const previousTrack = currentIndex > 0 ? tracks[currentIndex - 1] : null;
  const nextTrack = currentIndex >= 0 && currentIndex < tracks.length - 1 ? tracks[currentIndex + 1] : null;

  if (!currentTrack) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <div className="neo-panel rounded-[8px] p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-700 dark:text-brand-200">Lecteur</p>
          <h1 className="mt-3 text-3xl font-black text-zinc-950 dark:text-white">Aucune piste disponible</h1>
          <p className="mt-4 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Ce livre n&apos;a pas encore de chapitre audio lisible.
          </p>
          <Link
            href={`/books/${audiobook.id}`}
            className="mt-6 inline-flex rounded-[8px] bg-brand-300 px-5 py-3 text-sm font-black text-black shadow-glow transition hover:bg-lime-200"
          >
            Revenir au livre
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl pb-12">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link
          href={`/books/${audiobook.id}`}
          className="inline-flex rounded-[8px] border border-brand-300/50 px-4 py-2 text-sm font-black text-brand-700 transition hover:bg-brand-50 dark:text-brand-100 dark:hover:bg-brand-300/10"
        >
          Revenir au livre
        </Link>
        <span className="rounded-[8px] border border-brand-300/30 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          Chapitre {currentIndex + 1} / {tracks.length}
        </span>
      </div>

      <section className="neo-panel scanline overflow-hidden rounded-[8px]">
        <div className="relative grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(260px,420px),1fr] lg:p-8">
          <div className="relative aspect-square overflow-hidden rounded-[8px] border border-brand-300/30 bg-black shadow-glow lg:aspect-[3/4]">
            {currentTrack.coverUrl ? (
              <Image
                src={currentTrack.coverUrl}
                alt={`Couverture ${currentTrack.title}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 420px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-8xl font-black text-brand-200">
                {currentTrack.title.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-center gap-6">
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-700 dark:text-brand-200">
                {audiobook.title}
              </p>
              <h1 className="glitch-title text-3xl font-black leading-tight text-zinc-950 sm:text-5xl dark:text-white">
                {currentTrack.title}
              </h1>
              {currentTrack.description && (
                <p className="max-w-2xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">{currentTrack.description}</p>
              )}
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                {formatDuration(currentTrack.durationSec)}
              </p>
            </div>

            <AudioPlayer
              src={currentTrack.audioUrl}
              title={currentTrack.title}
              author={audiobook.author}
              album={audiobook.title}
              artworkUrl={currentTrack.coverUrl}
              durationSec={currentTrack.durationSec}
              previousTrackHref={previousTrack?.href}
              nextTrackHref={nextTrack?.href}
              className="border-brand-300/30 bg-white/80 shadow-glow dark:bg-black/50"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              {previousTrack ? (
                <Link
                  href={previousTrack.href}
                  className="inline-flex items-center justify-center rounded-[8px] border border-brand-300/50 px-4 py-3 text-sm font-black text-brand-700 transition hover:bg-brand-300 hover:text-black dark:text-brand-100"
                >
                  Chapitre précédent
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center rounded-[8px] border border-white/10 px-4 py-3 text-sm font-black text-zinc-400">
                  Chapitre précédent
                </span>
              )}

              {nextTrack ? (
                <Link
                  href={nextTrack.href}
                  className="inline-flex items-center justify-center rounded-[8px] bg-brand-300 px-4 py-3 text-sm font-black text-black shadow-glow transition hover:bg-lime-200"
                >
                  Chapitre suivant
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center rounded-[8px] border border-white/10 px-4 py-3 text-sm font-black text-zinc-400">
                  Chapitre suivant
                </span>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PlayerPage;
