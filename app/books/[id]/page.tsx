import Image from "next/image";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";

import PublicFallbackNotice from "@/components/PublicFallbackNotice";
import { resolveMediaUrl } from "@/lib/media";
import prisma from "@/lib/prisma";
import { safePublicQuery } from "@/lib/public-data";
import { formatDuration } from "@/lib/utils";
import BookAmbiencePlayer from "./BookAmbiencePlayer";

interface BookDetailsPageProps {
  params: { id: string };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BookDetailsPage = async ({ params }: BookDetailsPageProps) => {
  noStore();
  const { data: audiobook, failed } = await safePublicQuery(
    `book_${params.id}`,
    null,
    () =>
      prisma.audiobook.findFirst({
        where: { id: params.id, isPublished: true },
        include: {
          categories: true,
          chapters: { orderBy: { order: "asc" } },
        },
      }),
  );

  if (failed) {
    return (
      <PublicFallbackNotice
        title="Livre momentanément indisponible"
        description="Cette page revient dès que la bibliothèque audio est reconnectée."
        href="/catalog"
        actionLabel="Retour au catalogue"
      />
    );
  }

  if (!audiobook) {
    notFound();
  }

  const bookCoverUrl = resolveMediaUrl(audiobook.coverKey, audiobook.coverUrl);
  const themeAudioUrl = resolveMediaUrl(audiobook.themeAudioKey, audiobook.themeAudioUrl);
  const chapters =
    audiobook.chapters.length > 0
      ? audiobook.chapters.map((chapter, index) => ({
          id: chapter.id,
          title: chapter.title,
          description: chapter.description,
          durationSec: chapter.durationSec,
          coverUrl: resolveMediaUrl(chapter.coverKey, chapter.coverUrl) || bookCoverUrl,
          audioUrl: resolveMediaUrl(chapter.audioKey, chapter.audioUrl),
          href: `/player/${audiobook.id}?chapter=${chapter.id}`,
          order: chapter.order ?? index,
        }))
      : resolveMediaUrl(audiobook.audioKey, audiobook.audioUrl)
        ? [
            {
              id: `${audiobook.id}-main-track`,
              title: audiobook.title,
              description: audiobook.summary,
              durationSec: audiobook.durationSec,
              coverUrl: bookCoverUrl,
              audioUrl: resolveMediaUrl(audiobook.audioKey, audiobook.audioUrl),
              href: `/player/${audiobook.id}`,
              order: 0,
            },
          ]
        : [];

  const playableChapters = chapters.filter((chapter) => chapter.audioUrl);
  const firstChapter = playableChapters[0];

  return (
    <div className="space-y-8 pb-12">
      <section className="neo-panel scanline overflow-hidden rounded-[8px]">
        <div className="relative grid gap-8 p-4 sm:p-6 lg:grid-cols-[minmax(260px,360px),1fr] lg:p-8">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[8px] border border-brand-300/30 bg-black shadow-glow">
            {bookCoverUrl ? (
              <Image
                src={bookCoverUrl}
                alt={`Couverture ${audiobook.title}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 360px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-black text-8xl font-black text-brand-200">
                {audiobook.title.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-between gap-8">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.18em] text-brand-700 dark:text-brand-100">
                <span className="rounded-[8px] border border-brand-300/50 bg-brand-300/10 px-3 py-1">{audiobook.tag}</span>
                {audiobook.language && <span className="rounded-[8px] border border-white/10 px-3 py-1">{audiobook.language}</span>}
                {audiobook.mood && <span className="rounded-[8px] border border-white/10 px-3 py-1">{audiobook.mood}</span>}
              </div>

              <div className="space-y-3">
                <h1 className="glitch-title text-4xl font-black leading-tight text-zinc-950 sm:text-5xl dark:text-white">
                  {audiobook.title}
                </h1>
                {audiobook.subtitle && (
                  <p className="max-w-2xl text-lg font-semibold text-zinc-600 dark:text-zinc-300">{audiobook.subtitle}</p>
                )}
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                  {audiobook.author}
                  {audiobook.narrator ? ` · narration ${audiobook.narrator}` : ""}
                </p>
              </div>

              <p className="max-w-3xl text-base leading-8 text-zinc-600 dark:text-zinc-300">
                {audiobook.summary ??
                  "Le résumé de ce livre audio n'est pas encore disponible. Il pourra être ajouté depuis l'espace administrateur."}
              </p>
            </div>

            {themeAudioUrl && <BookAmbiencePlayer src={themeAudioUrl} title={audiobook.title} />}

            <div className="grid gap-4 sm:grid-cols-[1fr,auto] sm:items-end">
              <dl className="grid gap-3 text-sm text-zinc-600 sm:grid-cols-3 dark:text-zinc-300">
                <div className="rounded-[8px] border border-brand-300/30 bg-white/50 p-3 dark:bg-black/30">
                  <dt className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Durée</dt>
                  <dd className="mt-1 font-black text-zinc-950 dark:text-white">{formatDuration(audiobook.durationSec)}</dd>
                </div>
                <div className="rounded-[8px] border border-brand-300/30 bg-white/50 p-3 dark:bg-black/30">
                  <dt className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Chapitres</dt>
                  <dd className="mt-1 font-black text-zinc-950 dark:text-white">{chapters.length}</dd>
                </div>
                <div className="rounded-[8px] border border-brand-300/30 bg-white/50 p-3 dark:bg-black/30">
                  <dt className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Ajout</dt>
                  <dd className="mt-1 font-black text-zinc-950 dark:text-white">{audiobook.createdAt.toLocaleDateString("fr-FR")}</dd>
                </div>
              </dl>

              {firstChapter ? (
                <Link
                  href={firstChapter.href}
                  className="inline-flex items-center justify-center rounded-[8px] bg-brand-300 px-5 py-3 text-sm font-black text-black shadow-glow transition hover:bg-lime-200"
                >
                  Commencer
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center rounded-[8px] border border-white/10 px-5 py-3 text-sm font-black text-zinc-500">
                  Aucun audio
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {audiobook.categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {audiobook.categories.map((category) => (
            <span key={category.id} className="rounded-[8px] border border-brand-300/30 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-brand-700 dark:text-brand-100">
              {category.name}
            </span>
          ))}
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-700 dark:text-brand-200">Sélection</p>
            <h2 className="text-3xl font-black text-zinc-950 dark:text-white">Choisir un chapitre</h2>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Le lecteur s&apos;ouvre seulement après le choix d&apos;une piste.
          </p>
        </div>

        {chapters.length > 0 ? (
          <div className="grid gap-3">
            {chapters.map((chapter, index) => {
              const isPlayable = Boolean(chapter.audioUrl);
              const content = (
                <>
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[8px] bg-black sm:h-24 sm:w-24">
                    {chapter.coverUrl ? (
                      <Image src={chapter.coverUrl} alt={`Couverture ${chapter.title}`} fill sizes="96px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-black text-brand-200">
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-700 dark:text-brand-100">
                      Chapitre {index + 1}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-lg font-black text-zinc-950 dark:text-white">{chapter.title}</h3>
                    {chapter.description && (
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{chapter.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">{formatDuration(chapter.durationSec)}</span>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-brand-300/50 text-lg font-black text-brand-700 transition group-hover:bg-brand-300 group-hover:text-black dark:text-brand-100">
                      →
                    </span>
                  </div>
                </>
              );

              return isPlayable ? (
                <Link
                  key={chapter.id}
                  href={chapter.href}
                  className="neo-panel group flex items-center gap-4 overflow-hidden rounded-[8px] p-3 transition hover:-translate-y-0.5"
                >
                  {content}
                </Link>
              ) : (
                <div key={chapter.id} className="neo-panel flex items-center gap-4 overflow-hidden rounded-[8px] p-3 opacity-60">
                  {content}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="neo-panel rounded-[8px] p-6 text-sm text-zinc-500 dark:text-zinc-400">
            Aucun chapitre n&apos;est disponible pour ce livre.
          </div>
        )}
      </section>
    </div>
  );
};

export default BookDetailsPage;
