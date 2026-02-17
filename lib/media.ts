const BUCKET = "vocab";

export function resolveVocabMediaUrl(pathOrUrl: string | null | undefined) {
  if (!pathOrUrl) return null;

  const trimmed = pathOrUrl.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return trimmed;

  const normalizedPath = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  return `${baseUrl}/storage/v1/object/public/${BUCKET}/${normalizedPath}`;
}
