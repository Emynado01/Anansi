const publicBaseUrl =
  process.env.R2_PUBLIC_BASE_URL ??
  process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL ??
  "";

export const normalizeStorageKey = (key?: string | null) => {
  if (!key) return null;
  return key.trim().replace(/^\/+/, "") || null;
};

export const isAbsoluteUrl = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export const publicUrlForKey = (key?: string | null) => {
  const normalizedKey = normalizeStorageKey(key);
  if (!normalizedKey || !publicBaseUrl) return null;

  const encodedKey = normalizedKey
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${publicBaseUrl.replace(/\/+$/, "")}/${encodedKey}`;
};

export const appMediaUrlForKey = (key?: string | null) => {
  const normalizedKey = normalizeStorageKey(key);
  if (!normalizedKey) return null;

  const encodedKey = normalizedKey
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `/api/media/${encodedKey}`;
};

export const resolveMediaUrl = (key?: string | null, url?: string | null) => {
  const appUrl = appMediaUrlForKey(key);
  if (appUrl) return appUrl;
  if (url && (isAbsoluteUrl(url) || url.startsWith("/"))) return url;
  return publicUrlForKey(key) ?? url ?? "";
};
