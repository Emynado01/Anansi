import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { z } from "zod";

import { getServerAuthSession } from "@/lib/auth";
import { publicUrlForKey } from "@/lib/media";
import { getS3Client } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIBRARY_PREFIX = (process.env.S3_LIBRARY_PREFIX ?? "Anansi").replace(/^\/+|\/+$/g, "");

const safePathSegment = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const presignSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().optional(),
  type: z.enum(["image", "audio"]),
  bookFolder: z.string().optional(),
});

const getEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${name}`);
  }
  return value;
};

export const POST = async (request: Request) => {
  try {
    const session = await getServerAuthSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = presignSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const { fileName, contentType, type, bookFolder } = parsed.data;
    const ext = path.extname(fileName) || (type === "image" ? ".png" : ".mp3");
    const safeExt = ext.toLowerCase().slice(0, 8);
    const id = randomUUID();
    const mediaFolder = type === "image" ? "images" : "audio";
    const originalName = safePathSegment(path.basename(fileName, ext)) || id;
    const folder = safePathSegment(bookFolder ?? "nouveau-livre") || "nouveau-livre";
    const key = `${LIBRARY_PREFIX}/${folder}/${mediaFolder}/${originalName}-${id}${safeExt}`;

    const command = new PutObjectCommand({
      Bucket: getEnv("S3_BUCKET"),
      Key: key,
      ContentType: contentType || undefined,
    });

    const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 60 * 15 });

    return NextResponse.json({
      key,
      url: publicUrlForKey(key),
      uploadUrl,
      headers: contentType ? { "Content-Type": contentType } : {},
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur lors de la préparation de l'upload" }, { status: 500 });
  }
};
