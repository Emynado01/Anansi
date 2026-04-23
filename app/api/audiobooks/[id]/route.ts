import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { isAbsoluteUrl, normalizeStorageKey, resolveMediaUrl } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const chapterSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  audioKey: z.string().optional(),
  audioUrl: z
    .string()
    .optional()
    .refine((v) => !v || isAbsoluteUrl(v) || v.startsWith("/"), { message: "URL audio invalide" }),
  themeAudioKey: z.string().optional(),
  themeAudioUrl: z
    .string()
    .optional()
    .refine((v) => !v || isAbsoluteUrl(v) || v.startsWith("/"), { message: "URL musique d'ambiance invalide" }),
  coverKey: z.string().optional(),
  coverUrl: z
    .string()
    .optional()
    .refine((v) => !v || isAbsoluteUrl(v) || v.startsWith("/"), { message: "URL couverture de chapitre invalide" }),
  durationSec: z.number().int().min(1),
  isPreview: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
}).superRefine((chapter, ctx) => {
  if (!chapter.audioKey && !chapter.audioUrl) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ajoutez une clé S3 ou une URL audio." });
  }
});

const updateSchema = z.object({
  slug: z.string().optional(),
  title: z.string().min(2).optional(),
  subtitle: z.string().optional(),
  author: z.string().min(2).optional(),
  narrator: z.string().optional(),
  storageFolder: z.string().optional(),
  durationSec: z.number().int().min(30).optional(),
  tag: z.string().min(1).optional(),
  language: z.string().optional(),
  mood: z.string().optional(),
  priceCents: z.number().int().nonnegative().optional(),
  audioKey: z.string().optional(),
  audioUrl: z
    .string()
    .optional()
    .refine((v) => !v || isAbsoluteUrl(v) || v.startsWith("/"), { message: "URL audio invalide" }),
  themeAudioKey: z.string().optional(),
  themeAudioUrl: z
    .string()
    .optional()
    .refine((v) => !v || isAbsoluteUrl(v) || v.startsWith("/"), { message: "URL musique d'ambiance invalide" }),
  coverKey: z.string().optional(),
  coverUrl: z
    .string()
    .optional()
    .refine((v) => !v || isAbsoluteUrl(v) || v.startsWith("/"), { message: "URL couverture invalide" })
    .or(z.literal("").optional()),
  summary: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  releasedAt: z.string().datetime().optional(),
  categories: z.array(z.string()).optional(),
  chapters: z.array(chapterSchema).optional(),
});

const serializeAudiobook = (book: Prisma.AudiobookGetPayload<{ include: { categories: true; chapters: true } }>) => ({
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
  themeAudioKey: book.themeAudioKey,
  themeAudioUrl: resolveMediaUrl(book.themeAudioKey, book.themeAudioUrl),
  coverKey: book.coverKey,
  coverUrl: resolveMediaUrl(book.coverKey, book.coverUrl),
  summary: book.summary,
  isFeatured: book.isFeatured,
  isPublished: book.isPublished,
  releasedAt: book.releasedAt,
  createdAt: book.createdAt,
  updatedAt: book.updatedAt,
  categories: book.categories.map((category) => ({ id: category.id, name: category.name })),
  chapters: book.chapters
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((chapter) => ({
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
    })),
});

export const GET = async (_request: Request, context: { params: { id: string } }) => {
  try {
    const audiobook = await prisma.audiobook.findUnique({
      where: { id: context.params.id },
      include: { categories: true, chapters: { orderBy: { order: "asc" } } },
    });

    if (!audiobook) {
      return NextResponse.json({ error: "Livre introuvable" }, { status: 404 });
    }

    return NextResponse.json({ audiobook: serializeAudiobook(audiobook) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur lors de la récupération du livre." }, { status: 500 });
  }
};

export const PATCH = async (request: Request, context: { params: { id: string } }) => {
  try {
    const session = await getServerAuthSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = updateSchema.safeParse(json);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Données invalides";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { categories, coverUrl, coverKey, summary, language, mood, chapters, durationSec, audioUrl, audioKey, themeAudioUrl, themeAudioKey, releasedAt, ...rest } = parsed.data;

    const data: Prisma.AudiobookUpdateInput = { ...rest };

    if (durationSec !== undefined) {
      data.durationSec = durationSec;
    }
    if (audioKey !== undefined) {
      data.audioKey = normalizeStorageKey(audioKey);
    }
    if (audioUrl !== undefined || audioKey !== undefined) {
      data.audioUrl = resolveMediaUrl(audioKey, audioUrl) || null;
    }
    if (themeAudioKey !== undefined) {
      data.themeAudioKey = normalizeStorageKey(themeAudioKey);
    }
    if (themeAudioUrl !== undefined || themeAudioKey !== undefined) {
      data.themeAudioUrl = resolveMediaUrl(themeAudioKey, themeAudioUrl) || null;
    }

    if (coverKey !== undefined) {
      data.coverKey = normalizeStorageKey(coverKey);
    }
    if (coverUrl !== undefined) {
      data.coverUrl = resolveMediaUrl(coverKey, coverUrl) || null;
    } else if (coverKey !== undefined) {
      data.coverUrl = resolveMediaUrl(coverKey, null) || null;
    }
    if (summary !== undefined) {
      data.summary = summary || null;
    }
    if (language !== undefined) {
      data.language = language || null;
    }
    if (mood !== undefined) {
      data.mood = mood || null;
    }
    if (releasedAt !== undefined) {
      data.releasedAt = releasedAt ? new Date(releasedAt) : null;
    }
    if (categories) {
      data.categories = {
        set: categories.map((id) => ({ id })),
      };
    }
    if (chapters !== undefined) {
      const hasChapters = chapters.length > 0;
      const computedDuration = durationSec ?? (hasChapters ? chapters.reduce((sum, chapter) => sum + chapter.durationSec, 0) : undefined);
      if (computedDuration !== undefined) {
        data.durationSec = computedDuration;
      }
      if (data.audioUrl === undefined && hasChapters) {
        data.audioKey = normalizeStorageKey(chapters[0]?.audioKey);
        data.audioUrl = resolveMediaUrl(chapters[0]?.audioKey, chapters[0]?.audioUrl) || null;
      }
      data.chapters = {
        deleteMany: {},
        ...(hasChapters
          ? {
              create: chapters.map((chapter, index) => ({
                title: chapter.title,
                description: chapter.description || null,
                audioKey: normalizeStorageKey(chapter.audioKey),
                audioUrl: resolveMediaUrl(chapter.audioKey, chapter.audioUrl),
                coverKey: normalizeStorageKey(chapter.coverKey),
                coverUrl: resolveMediaUrl(chapter.coverKey, chapter.coverUrl) || null,
                durationSec: chapter.durationSec,
                isPreview: chapter.isPreview ?? index === 0,
                order: chapter.order ?? index,
              })),
            }
          : {}),
      };
    }

    const audiobook = await prisma.audiobook.update({
      where: { id: context.params.id },
      data,
      include: { categories: true, chapters: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ audiobook: serializeAudiobook(audiobook) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour du livre." }, { status: 500 });
  }
};

export const DELETE = async (_request: Request, context: { params: { id: string } }) => {
  try {
    const session = await getServerAuthSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await prisma.audiobook.delete({ where: { id: context.params.id } });

    return NextResponse.json({ status: "deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur lors de la suppression du livre." }, { status: 500 });
  }
};
