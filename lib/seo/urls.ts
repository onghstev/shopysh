/** Canonical URL utilities for Shopysh SEO module. */

export const BASE_URL = (process.env.NEXTAUTH_URL || 'https://www.shopysh.com').replace(/\/$/, '');

/** Make any path into an absolute URL. Passes through if already absolute. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Convert any string into a URL-safe slug. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

// ── Canonical URL builders ──────────────────────────────────────────────────

export const marketplaceUrl = () => BASE_URL;
export const storeUrl     = (subdomain: string) => `${BASE_URL}/store/${subdomain}`;
export const productUrl   = (subdomain: string, productId: string) =>
  `${BASE_URL}/store/${subdomain}/products/${productId}`;
export const categoryUrl  = (subdomain: string, categoryId: string) =>
  `${BASE_URL}/store/${subdomain}?category=${categoryId}`;
export const merchantFeedUrl  = (subdomain: string) => `${BASE_URL}/feeds/${subdomain}`;
export const globalFeedUrl    = () => `${BASE_URL}/feeds/google-merchant`;
export const sitemapIndexUrl  = () => `${BASE_URL}/sitemap.xml`;
