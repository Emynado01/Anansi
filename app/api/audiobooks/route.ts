import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { isAbsoluteUrl, normalizeStorageKey, resolveMediaUrl } from "@/lib/media";

const chapterSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  audioKey: z.string().optional(),
  audioUrl: z
    .string()
    .optional()
    .refine((v) => !v || isAbsoluteUrl(v) || v.startsWith("/"), { message: "URL audio invalide" }),
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

const createAudiobookSchema = z.object({
  slug: z.string().optional(),
  title: z.string().min(2),
  subtitle: z.string().optional(),
  author: z.string().min(2),
  narrator: z.string().optional(),
  storageFolder: z.string().optional(),
  durationSec: z.number().int().min(30).optional(),
  tag: z.string().min(1),
  language: z.string().optional(),
  mood: z.string().optional(),
  priceCents: z.number().int().nonnegative().optional(),
  audioKey: z.string().optional(),
  audioUrl: z
    .string()
    .optional()
    .refine((v) => !v || isAbsoluteUrl(v) || v.startsWith("/"), { message: "URL audio invalide" }),
  coverKey: z.string().optional(),
  coverUrl: z
    .string()
    .optional()
    .refine((v) => !v || isAbsoluteUrl(v) || v.startsWith("/"), { message: "URL couverture invalide" }),
  summary: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  releasedAt: z.string().datetime().optional(),
  categories: z.array(z.string()).optional(),
  chapters: z.array(chapterSchema).min(1, "Ajoutez au moins un chapitre audio").optional(),
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

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const duration = searchParams.get("duration");
    const language = searchParams.get("language");
    const mood = searchParams.get("mood");
    const categorySlug = searchParams.get("category");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "12", 10) || 12, 50);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10) || 0;

    const where: Prisma.AudiobookWhereInput = { isPublished: true };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { author: { contains: q, mode: "insensitive" } },
      ];
    }

    if (language) {
      where.language = { equals: language, mode: "insensitive" };
    }

    if (mood) {
      where.mood = { equals: mood, mode: "insensitive" };
    }

    if (duration === "short") {
      where.durationSec = { lt: 1800 };
    } else if (duration === "medium") {
      where.durationSec = { gte: 1800, lt: 3600 };
    } else if (duration === "long") {
      where.durationSec = { gte: 3600 };
    }

    if (categorySlug) {
      where.categories = { some: { slug: categorySlug } };
    }

    const [items, total] = await Promise.all([
      prisma.audiobook.findMany({
        where,
        include: { categories: true, chapters: { orderBy: { order: "asc" } } },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      }),
      prisma.audiobook.count({ where }),
    ]);

    return NextResponse.json({
      data: items.map((book) => serializeAudiobook(book)),
      meta: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur lors de la récupération des livres." }, { status: 500 });
  }
};

export const POST = async (request: Request) => {
  try {
    const session = await getServerAuthSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = createAudiobookSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Données invalides";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { categories: categoryIds = [], chapters = [], releasedAt, ...rest } = parsed.data;

    const hasChapters = chapters.length > 0;
    if (!hasChapters && !rest.audioUrl && !rest.audioKey) {
      return NextResponse.json({ error: "Ajoutez au moins un chapitre audio." }, { status: 400 });
    }

    const inferredDuration = rest.durationSec ?? (hasChapters ? chapters.reduce((sum, c) => sum + c.durationSec, 0) : undefined);
    if (!inferredDuration || inferredDuration < 1) {
      return NextResponse.json({ error: "Durée totale du livre manquante." }, { status: 400 });
    }

    const normalizedAudioKey = normalizeStorageKey(rest.audioKey);
    const normalizedCoverKey = normalizeStorageKey(rest.coverKey);
    const fallbackAudioUrl = resolveMediaUrl(normalizedAudioKey, rest.audioUrl);

    const audiobook = await prisma.audiobook.create({
      data: {
        ...rest,
        priceCents: rest.priceCents ?? 0,
        audioKey: normalizedAudioKey,
        audioUrl: fallbackAudioUrl || chapters[0]?.audioUrl || null,
        coverKey: normalizedCoverKey,
        coverUrl: resolveMediaUrl(normalizedCoverKey, rest.coverUrl) || null,
        durationSec: inferredDuration,
        releasedAt: releasedAt ? new Date(releasedAt) : undefined,
        createdById: session.user.id,
        categories: {
          connect: categoryIds.map((id) => ({ id })),
        },
        chapters: hasChapters
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
          : undefined,
      },
      include: { categories: true, chapters: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ audiobook: serializeAudiobook(audiobook) }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur lors de la création du livre." }, { status: 500 });
  }
};
