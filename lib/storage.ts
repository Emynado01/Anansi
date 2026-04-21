import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { normalizeStorageKey, publicUrlForKey } from "./media";

const getEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${name}`);
  }
  return value;
};

let client: S3Client | null = null;

export const getS3Client = () => {
  if (client) return client;

  const endpoint = process.env.S3_ENDPOINT;
  client = new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint,
    forcePathStyle: Boolean(endpoint),
    credentials: {
      accessKeyId: getEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: getEnv("S3_SECRET_ACCESS_KEY"),
    },
  });

  return client;
};

interface UploadObjectInput {
  key: string;
  body: Buffer;
  contentType?: string;
}

export const uploadObject = async ({ key, body, contentType }: UploadObjectInput) => {
  const normalizedKey = normalizeStorageKey(key);
  if (!normalizedKey) {
    throw new Error("Clé S3 invalide");
  }

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getEnv("S3_BUCKET"),
      Key: normalizedKey,
      Body: body,
      ContentType: contentType,
    }),
  );

  return {
    key: normalizedKey,
    url: publicUrlForKey(normalizedKey),
  };
};
