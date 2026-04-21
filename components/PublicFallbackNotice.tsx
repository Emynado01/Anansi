import Link from "next/link";

interface PublicFallbackNoticeProps {
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
}

const PublicFallbackNotice = ({
  title,
  description,
  href = "/",
  actionLabel = "Revenir à l'accueil",
}: PublicFallbackNoticeProps) => {
  return (
    <div className="mx-auto max-w-2xl py-12">
      <div className="neo-panel rounded-[8px] p-8 text-center">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-700 dark:text-brand-200">
          Anansi
        </p>
        <h1 className="mt-3 text-3xl font-black text-zinc-950 dark:text-white">{title}</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-500 dark:text-zinc-400">{description}</p>
        <Link
          href={href}
          className="mt-6 inline-flex rounded-[8px] bg-brand-300 px-5 py-3 text-sm font-black text-black shadow-glow transition hover:bg-lime-200"
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  );
};

export default PublicFallbackNotice;
