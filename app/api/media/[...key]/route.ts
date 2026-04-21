import { GetObjectCommand, type GetObjectCommandOutput } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import { NextRequest } from "next/server";

import { normalizeStorageKey } from "@/lib/media";
import { getS3Client } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bucket = process.env.S3_BUCKET;

const toWebStream = (body: unknown) => {
  if (!body) return null;
  if (typeof body === "object" && body !== null && "transformToWebStream" in body && typeof body.transformToWebStream === "function") {
    return body.transformToWebStream();
  }
  if (body instanceof Readable) {
    return Readable.toWeb(body);
  }
  return null;
};

const parseRangeHeader = (rangeHeader: string | null) => {
  if (!rangeHeader) return null;
  const normalized = rangeHeader.trim();
  return normalized.toLowerCase().startsWith("bytes=") ? normalized : null;
};

const buildHeaders = (response: GetObjectCommandOutput) => {
  const headers = new Headers();

  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", response.CacheControl ?? "public, max-age=86400");

  if (response.ContentType) {
    headers.set("Content-Type", response.ContentType);
  }
  if (response.ContentLength !== undefined) {
    headers.set("Content-Length", String(response.ContentLength));
  }
  if (response.ContentRange) {
    headers.set("Content-Range", response.ContentRange);
  }
  if (response.ETag) {
    headers.set("ETag", response.ETag);
  }
  if (response.LastModified) {
    headers.set("Last-Modified", response.LastModified.toUTCString());
  }

  return headers;
};

export const GET = async (_request: NextRequest, context: { params: { key: string[] } }) => {
  if (!bucket) {
    return new Response("Bucket non configuré", { status: 500 });
  }

  const key = normalizeStorageKey(context.params.key.join("/"));
  if (!key) {
    return new Response("Clé invalide", { status: 400 });
  }

  const range = parseRangeHeader(_request.headers.get("range"));

  try {
    const response = await getS3Client().send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        Range: range ?? undefined,
      }),
    );

    const stream = toWebStream(response.Body);
    if (!stream) {
      return new Response("Flux média indisponible", { status: 500 });
    }

    const headers = buildHeaders(response);
    const status = range && response.ContentRange ? 206 : 200;

    return new Response(stream, { status, headers });
  } catch (error) {
    console.error("Media proxy error", error);
    return new Response("Média introuvable", { status: 404 });
  }
};

export const HEAD = async (request: NextRequest, context: { params: { key: string[] } }) => {
  const response = await GET(request, context);
  return new Response(null, { status: response.status, headers: response.headers });
};
