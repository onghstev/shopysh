/**
 * Google Merchant Center XML feed builder (RSS 2.0 + Google Base namespace).
 * Spec: https://support.google.com/merchants/answer/7052112
 */

import { absoluteUrl, productUrl, storeUrl, BASE_URL } from './urls';
import type { StoreInfo, ProductInfo } from './schemas';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FeedOptions {
  /** If provided, only this store's products are included. */
  store?: StoreInfo;
  /** Store display name for the channel title. */
  title?: string;
  /** Feed description. */
  description?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function gmcPrice(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`;
}

function gmcAvailability(qty: number): string {
  return qty > 0 ? 'in_stock' : 'out_of_stock';
}

// ── Per-product XML item ───────────────────────────────────────────────────────

function buildProductItem(product: ProductInfo, store: StoreInfo): string {
  const url      = productUrl(store.subdomain, product.id);
  const currency = product.currency || store.currency;
  const meta     = product.metadata ?? {};

  const primaryImage   = product.images?.[0];
  const additionalImgs = product.images?.slice(1, 10) ?? [];

  // Optional fields from product.metadata
  const gtin      = meta.gtin      as string | undefined;
  const mpn       = meta.mpn       as string | undefined;
  const condition = (meta.condition as string | undefined) ?? 'new';
  const googleCat = meta.googleProductCategory as string | undefined;
  const productType = product.category?.name;

  const lines: string[] = [
    `    <item>`,
    `      <g:id>${esc(product.id)}</g:id>`,
    `      <g:title>${esc(product.name.slice(0, 150))}</g:title>`,
    `      <g:description>${esc((product.description ?? product.name).slice(0, 5000))}</g:description>`,
    `      <g:link>${esc(url)}</g:link>`,
    primaryImage ? `      <g:image_link>${esc(absoluteUrl(primaryImage.url))}</g:image_link>` : '',
    ...additionalImgs.map((img) => `      <g:additional_image_link>${esc(absoluteUrl(img.url))}</g:additional_image_link>`),
    `      <g:availability>${gmcAvailability(product.stockQuantity)}</g:availability>`,
    `      <g:price>${gmcPrice(product.price, currency)}</g:price>`,
    `      <g:brand>${esc(store.name)}</g:brand>`,
    `      <g:condition>${esc(condition)}</g:condition>`,
    gtin      ? `      <g:gtin>${esc(gtin)}</g:gtin>` : '',
    mpn       ? `      <g:mpn>${esc(mpn)}</g:mpn>` : '',
    product.sku ? `      <g:mpn>${esc(product.sku)}</g:mpn>` : '',
    googleCat ? `      <g:google_product_category>${esc(googleCat)}</g:google_product_category>` : '',
    productType ? `      <g:product_type>${esc(productType)}</g:product_type>` : '',
    `      <g:seller_name>${esc(store.name)}</g:seller_name>`,
    `      <g:store_code>${esc(store.subdomain)}</g:store_code>`,
    `    </item>`,
  ];

  return lines.filter(Boolean).join('\n');
}

// ── Main feed builder ────────────────────────────────────────────────────────

export function buildGoogleMerchantFeed(
  products: Array<{ product: ProductInfo; store: StoreInfo }>,
  options: FeedOptions = {},
): string {
  const now   = new Date().toUTCString();
  const title = options.title ?? 'Shopysh — All Products';
  const desc  = options.description ?? 'Products from Shopysh marketplace';
  const link  = options.store ? storeUrl(options.store.subdomain) : BASE_URL;

  const items = products.map(({ product, store }) => buildProductItem(product, store)).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${esc(title)}</title>
    <link>${esc(link)}</link>
    <description>${esc(desc)}</description>
    <lastBuildDate>${now}</lastBuildDate>
    <generator>Shopysh SEO Module</generator>
${items}
  </channel>
</rss>`;
}

// ── XML Sitemap helpers ────────────────────────────────────────────────────────

export function buildXmlSitemap(
  urls: Array<{
    loc: string;
    lastmod?: Date | string;
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
    images?: Array<{ loc: string; title?: string; caption?: string }>;
  }>,
): string {
  const urlEntries = urls.map(({ loc, lastmod, changefreq, priority, images }) => {
    const lastmodStr = lastmod
      ? (lastmod instanceof Date ? lastmod : new Date(lastmod)).toISOString().split('T')[0]
      : '';

    const imageEntries = images?.map(({ loc: imgLoc, title, caption }) => `
    <image:image>
      <image:loc>${esc(absoluteUrl(imgLoc))}</image:loc>
      ${title ? `<image:title>${esc(title)}</image:title>` : ''}
      ${caption ? `<image:caption>${esc(caption)}</image:caption>` : ''}
    </image:image>`).join('') ?? '';

    return `  <url>
    <loc>${esc(absoluteUrl(loc))}</loc>
    ${lastmodStr ? `<lastmod>${lastmodStr}</lastmod>` : ''}
    ${changefreq ? `<changefreq>${changefreq}</changefreq>` : ''}
    ${priority !== undefined ? `<priority>${priority.toFixed(1)}</priority>` : ''}
    ${imageEntries}
  </url>`;
  });

  const hasImages = urls.some((u) => u.images && u.images.length > 0);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  ${hasImages ? 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : ''}
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
    http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries.join('\n')}
</urlset>`;
}
