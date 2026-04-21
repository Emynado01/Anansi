import Image from "next/image";
import Link from "next/link";

import { cn, formatDuration } from "@/lib/utils";

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  durationSec: number;
  tag: string;
  language?: string | null;
  mood?: string | null;
  coverUrl?: string | null;
  className?: string;
}

const BookCard = ({
  id,
  title,
  author,
  durationSec,
  tag,
  language,
  mood,
  coverUrl,
  className,
}: BookCardProps) => {
  return (
    <article
      className={cn(
        "neo-panel group flex flex-col overflow-hidden rounded-[8px] transition hover:-translate-y-1 hover:shadow-xl",
        className,
      )}
    >
      <Link href={`/books/${id}`} className="relative block aspect-[4/3] overflow-hidden">
        <div className="absolute inset-0 bg-griot-pattern opacity-40" aria-hidden />
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`Couverture du livre ${title}`}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-black text-brand-200">
            <span className="text-5xl font-bold">{title.charAt(0)}</span>
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <Link href={`/books/${id}`} className="text-lg font-black text-zinc-950 transition hover:text-brand-700 dark:text-white dark:hover:text-brand-200">
            {title}
          </Link>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{author}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          <span className="rounded-[8px] bg-brand-100 px-3 py-1 text-brand-800 dark:bg-brand-300/15 dark:text-brand-100">{tag}</span>
          <span className="rounded-[8px] bg-zinc-100 px-3 py-1 dark:bg-white/10">{formatDuration(durationSec)}</span>
          {language && <span className="rounded-[8px] bg-zinc-100 px-3 py-1 dark:bg-white/10">{language}</span>}
          {mood && <span className="rounded-[8px] bg-zinc-100 px-3 py-1 dark:bg-white/10">{mood}</span>}
        </div>
        <Link
          href={`/books/${id}`}
          className="mt-auto inline-flex items-center justify-center rounded-[8px] border border-brand-300/60 px-4 py-2 text-sm font-black text-brand-800 transition hover:border-brand-400 hover:bg-brand-50 dark:text-brand-100 dark:hover:bg-brand-300/10"
        >
          Voir le livre
        </Link>
      </div>
    </article>
  );
};

export default BookCard;
