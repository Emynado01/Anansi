import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { resolveMediaUrl } from "@/lib/media";

import AdminAudiobookTable from "./AdminAudiobookTable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AdminPage = async () => {
  noStore();
  const session = await getServerAuthSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin");
  }

  const [audiobooks, categories] = await Promise.all([
    prisma.audiobook.findMany({
      include: { categories: true, chapters: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const audiobooksPayload = audiobooks.map((book) => {
    const chapters = (book.chapters?.length
      ? book.chapters
      : [
          {
            id: `${book.id}-chapitre-1`,
            title: book.title,
            description: null,
            audioKey: book.audioKey,
            audioUrl: resolveMediaUrl(book.audioKey, book.audioUrl),
            coverKey: book.coverKey,
            coverUrl: resolveMediaUrl(book.coverKey, book.coverUrl),
            durationSec: book.durationSec,
            isPreview: true,
            order: 0,
          },
        ]).map((chapter) => ({
          id: chapter.id,
          title: chapter.title,
          description: chapter.description,
          audioKey: chapter.audioKey,
          audioUrl: resolveMediaUrl(chapter.audioKey, chapter.audioUrl),
          coverKey: chapter.coverKey,
          coverUrl: resolveMediaUrl(chapter.coverKey, chapter.coverUrl),
          durationSec: chapter.durationSec,
          isPreview: chapter.isPreview,
          order: chapter.order,
        }));

    return {
      id: book.id,
      slug: book.slug,
      title: book.title,
      subtitle: book.subtitle,
      author: book.author,
      narrator: book.narrator,
      storageFolder: book.storageFolder,
      durationSec: book.durationSec,
      tag: book.tag,
      language: book.language,
      mood: book.mood,
      audioKey: book.audioKey,
      audioUrl: resolveMediaUrl(book.audioKey, book.audioUrl),
      coverKey: book.coverKey,
      coverUrl: resolveMediaUrl(book.coverKey, book.coverUrl),
      summary: book.summary,
      isFeatured: book.isFeatured,
      isPublished: book.isPublished,
      categories: book.categories.map((category) => ({ id: category.id, name: category.name })),
      chapters,
    };
  });

  const categoriesPayload = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-200">Console privée</p>
        <h1 className="glitch-title text-4xl font-black text-zinc-950 dark:text-white">Administration Anansi</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Publiez les livres, leurs couvertures et leurs chapitres dans le dossier S3 Anansi.
        </p>
      </div>
      <AdminAudiobookTable audiobooks={audiobooksPayload} categories={categoriesPayload} />
    </div>
  );
};

export default AdminPage;
