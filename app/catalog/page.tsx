import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";

import BookCard from "@/components/BookCard";
import CatalogFilters from "./CatalogFilters";
import prisma from "@/lib/prisma";
import { resolveMediaUrl } from "@/lib/media";

interface CatalogPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CatalogPage = async ({ searchParams }: CatalogPageProps) => {
  noStore();
  const q = typeof searchParams.q === "string" ? searchParams.q : null;
  const duration = typeof searchParams.duration === "string" ? searchParams.duration : null;
  const language = typeof searchParams.language === "string" ? searchParams.language : null;
  const mood = typeof searchParams.mood === "string" ? searchParams.mood : null;
  const categorySlug = typeof searchParams.category === "string" ? searchParams.category : null;
  const limit = 12;
  const offset = typeof searchParams.offset === "string" ? parseInt(searchParams.offset, 10) || 0 : 0;

  const where: Prisma.AudiobookWhereInput = { isPublished: true };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { author: { contains: q, mode: "insensitive" } },
    ];
  }
  if (language) where.language = { equals: language, mode: "insensitive" };
  if (mood) where.mood = { equals: mood, mode: "insensitive" };
  if (duration === "short") where.durationSec = { lt: 1800 };
  if (duration === "medium") where.durationSec = { gte: 1800, lt: 3600 };
  if (duration === "long") where.durationSec = { gte: 3600 };
  if (categorySlug) where.categories = { some: { slug: categorySlug } };

  const [data, total, languageFacets, moodFacets] = await Promise.all([
    prisma.audiobook.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    }),
    prisma.audiobook.count({ where }),
    prisma.audiobook.findMany({
      where: { language: { not: null }, isPublished: true },
      distinct: ["language"],
      select: { language: true },
    }),
    prisma.audiobook.findMany({
      where: { mood: { not: null }, isPublished: true },
      distinct: ["mood"],
      select: { mood: true },
    }),
  ]);

  const languages = languageFacets
    .map((item) => item.language)
    .filter((value): value is string => Boolean(value));
  const moods = moodFacets
    .map((item) => item.mood)
    .filter((value): value is string => Boolean(value));

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-200">Catalogue public</p>
        <h1 className="glitch-title text-4xl font-black tracking-tight text-zinc-950 dark:text-white">Flux audio Anansi</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Recherchez par titre, durée, langue ou ambiance.
        </p>
      </div>
      <CatalogFilters languages={languages} moods={moods} />
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
          <span>{total} résultats</span>
          {searchParams.q && typeof searchParams.q === "string" && (
            <Link href="/catalog" className="font-semibold text-brand-600 hover:text-brand-500">
              Réinitialiser
            </Link>
          )}
        </div>
        {data.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((book) => (
              <BookCard
                key={book.id}
                id={book.id}
                title={book.title}
                author={book.author}
                durationSec={book.durationSec}
                tag={book.tag}
                coverUrl={resolveMediaUrl(book.coverKey, book.coverUrl)}
                language={book.language}
                mood={book.mood}
              />
            ))}
          </div>
        ) : (
          <div className="neo-panel rounded-[8px] p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Aucun livre ne correspond à votre recherche pour le moment.
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogPage;
