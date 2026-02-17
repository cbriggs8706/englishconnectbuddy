export const PUBLIC_SITE_ORIGIN = "https://englishconnectbuddy.com";

export function absoluteUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${PUBLIC_SITE_ORIGIN}${normalized}`;
}
