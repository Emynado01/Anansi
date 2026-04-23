import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const [books, published, chapters, categories] = await Promise.all([
      prisma.audiobook.count(),
      prisma.audiobook.count({ where: { isPublished: true } }),
      prisma.chapter.count(),
      prisma.category.count(),
    ]);

    return NextResponse.json({
      ok: true,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
      counts: {
        books,
        published,
        chapters,
        categories,
      },
    });
  } catch (error) {
    const details = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
        }
      : {
          name: "UnknownError",
          message: "Erreur inconnue",
        };

    return NextResponse.json(
      {
        ok: false,
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
        databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
        error: details,
      },
      { status: 500 },
    );
  }
};
