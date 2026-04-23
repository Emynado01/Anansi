import { PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3";
import { readFileSync, existsSync } from "node:fs";

const loadDotEnv = () => {
  if (!existsSync(".env")) return;

  const content = readFileSync(".env", "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const [name, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[name]) {
      process.env[name] = value;
    }
  }
};

const getEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${name}`);
  }
  return value;
};

loadDotEnv();

const bucket = getEnv("S3_BUCKET");
const endpoint = getEnv("S3_ENDPOINT");
const appOrigin = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://anansi-beta.vercel.app";

const allowedOrigins = Array.from(new Set([
  appOrigin.replace(/\/+$/, ""),
  "https://anansi-beta.vercel.app",
  "https://*.vercel.app",
  "http://localhost:3000",
]));

const client = new S3Client({
  region: process.env.S3_REGION ?? "auto",
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: getEnv("S3_ACCESS_KEY_ID"),
    secretAccessKey: getEnv("S3_SECRET_ACCESS_KEY"),
  },
});

await client.send(
  new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET", "HEAD", "PUT"],
          AllowedOrigins: allowedOrigins,
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  }),
);

console.log(`CORS configuré pour ${bucket}:`);
for (const origin of allowedOrigins) {
  console.log(`- ${origin}`);
}
