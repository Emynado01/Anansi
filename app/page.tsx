import Image from "next/image";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

import { resolveMediaUrl } from "@/lib/media";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HomePage = async () => {
  noStore();
  const books = await prisma.audiobook.findMany({
    take: 16,
    where: { isPublished: true },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-10 pb-12">
      <section className="neo-panel scanline relative min-h-[68vh] overflow-hidden rounded-[8px] sm:min-h-[620px]">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(103,232,249,0.18),transparent_32%),linear-gradient(245deg,rgba(212,255,45,0.12),transparent_38%)]" />
        <div className="absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-300/20 opacity-80 motion-grid" />
        <div className="absolute right-[-8rem] top-[-8rem] h-80 w-80 rounded-full border border-lime-200/30" />
        <div className="absolute bottom-[-10rem] left-[-6rem] h-96 w-96 rounded-full border border-brand-300/25" />

        <div className="relative z-10 flex min-h-[68vh] flex-col justify-center px-5 py-16 sm:min-h-[620px] sm:px-10 lg:px-14">
          <div className="max-w-4xl space-y-7">
            <div className="inline-flex items-center gap-3 rounded-[8px] border border-brand-300/50 bg-black px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-brand-100 shadow-glow">
              <span className="h-2 w-2 animate-pulse rounded-[8px] bg-lime-300" />
              Anansi audio stream
            </div>

            <div className="space-y-5">
              <h1 className="glitch-title text-4xl font-black leading-[0.95] tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl dark:text-white">
                Des livres audio à écouter librement, chapitre après chapitre.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg sm:leading-8 dark:text-zinc-300">
                Anansi rassemble les récits audio que je mets à disposition. Ouvrez un titre, choisissez une piste et lancez le streaming sans compte client, sans panier, sans paiement.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/catalog"
                className="inline-flex justify-center rounded-[8px] bg-brand-300 px-5 py-3 text-sm font-black text-black shadow-glow transition hover:bg-lime-200"
              >
                Explorer le catalogue
              </Link>
              {books[0] && (
                <Link
                  href={`/books/${books[0].id}`}
                  className="inline-flex justify-center rounded-[8px] border border-brand-300/50 bg-black px-5 py-3 text-sm font-bold text-brand-100 transition hover:border-lime-200 hover:text-white"
                >
                  Voir le dernier ajout
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-700 dark:text-brand-200">Bibliothèque</p>
            <h2 className="text-3xl font-black text-zinc-950 sm:text-4xl dark:text-white">Livres audio disponibles</h2>
          </div>
          <Link
            href="/catalog"
            className="hidden rounded-[8px] border border-brand-300/50 px-4 py-2 text-sm font-bold text-brand-700 transition hover:bg-brand-50 sm:inline-flex dark:text-brand-100 dark:hover:bg-brand-300/10"
          >
            Tout voir
          </Link>
        </div>

        {books.length > 0 ? (
          <div className="-mx-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
            <div className="flex snap-x snap-mandatory gap-4 sm:gap-5">
              {books.map((book) => {
                const coverUrl = resolveMediaUrl(book.coverKey, book.coverUrl);
                return (
                  <Link
                    key={book.id}
                    href={`/books/${book.id}`}
                    className="neo-panel group relative flex min-w-[74vw] snap-start flex-col overflow-hidden rounded-[8px] transition hover:-translate-y-1 sm:min-w-[260px] lg:min-w-[300px]"
                  >
                    <div className="relative aspect-[3/4] bg-black">
                      {coverUrl ? (
                        <Image
                          src={coverUrl}
                          alt={`Couverture ${book.title}`}
                          fill
                          sizes="(max-width: 640px) 74vw, 300px"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-7xl font-black text-brand-200">
                          {book.title.charAt(0)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                    </div>
                    <div className="space-y-2 p-4">
                      <p className="line-clamp-2 text-xl font-black text-zinc-950 dark:text-white">{book.title}</p>
                      <p className="truncate text-sm font-semibold text-zinc-500 dark:text-zinc-400">{book.author}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="neo-panel rounded-[8px] p-6 text-sm text-zinc-500 dark:text-zinc-400">
            Aucun livre publié pour le moment.
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
