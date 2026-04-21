import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { getServerAuthSession } from "@/lib/auth";
import { uploadObject } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_MB = 250;
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

export const POST = async (request: Request) => {
  try {
    const session = await getServerAuthSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("type") ?? ""); // "image" | "audio"
    const bookFolder = safePathSegment(String(form.get("bookFolder") ?? "nouveau-livre"));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    if (kind !== "image" && kind !== "audio") {
      return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const sizeMB = buffer.length / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      return NextResponse.json({ error: "Fichier trop volumineux" }, { status: 413 });
    }

    const ext = path.extname(file.name) || (kind === "image" ? ".png" : ".mp3");
    const safeExt = ext.toLowerCase().slice(0, 8);
    const id = randomUUID();
    const mediaFolder = kind === "image" ? "images" : "audio";
    const originalName = safePathSegment(path.basename(file.name, ext)) || id;
    const key = `${LIBRARY_PREFIX}/${bookFolder || "nouveau-livre"}/${mediaFolder}/${originalName}-${id}${safeExt}`;
    const result = await uploadObject({
      key,
      body: buffer,
      contentType: file.type || undefined,
    });

    return NextResponse.json({ key: result.key, url: result.url }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
};
