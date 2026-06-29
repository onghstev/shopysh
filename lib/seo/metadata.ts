/**
 * Next.js Metadata builders for Shopysh SEO module.
 * Returns Metadata objects for use in generateMetadata().
 */

import type { Metadata } from 'next';
import { absoluteUrl, storeUrl, productUrl, BASE_URL } from './urls';
import type { StoreInfo, ProductInfo } from './schemas';

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

function formatPrice(amount: number, currency: string): string {
  const symbols: Record<string, string> = { NGN: '₦', USD: '$', GHS: 'GH₵', KES: 'KSh' };
  return `${symbols[currency] ?? currency + ' '}${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ── Product page metadata ─────────────────────────────────────────────────────

export function buildProductMetadata(product: ProductInfo, store: StoreInfo): Metadata {
  const currency = product.currency || store.currency;
  const priceStr = formatPrice(product.price, currency);
  const canonical = productUrl(store.subdomain, product.slug ?? product.id);
  const locationStr = store.city ? ` in ${store.city}` : '';
  const countryStr  = store.country && store.country !== 'NG' ? `, ${store.country}` : '';

  const title = truncate(
    `${product.name} | ${priceStr} — ${store.name}`,
    60,
  );

  const desc = product.description
    ? truncate(`${product.description} — ${priceStr} at ${store.name}${locationStr}. Buy online now.`, 160)
    : truncate(`Buy ${product.name} for ${priceStr} at ${store.name}${locationStr}${countryStr}. ${product.stockQuantity > 0 ? 'In stock' : 'Limited availability'}.`, 160);

  const ogImage = (product.images?.length ?? 0) > 0
    ? { url: absoluteUrl(product.images![0].url), alt: product.name, width: 1200, height: 630 }
    : { url: `${BASE_URL}/og-image.png`, alt: store.name };

  return {
    title,
    description: desc,
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      title: truncate(`${product.name} | ${store.name}`, 95),
      description: truncate(desc, 200),
      images: [ogImage],
      siteName: 'Shopysh',
    },
    twitter: {
      card: 'summary_large_image',
      title: truncate(`${product.name} — ${priceStr}`, 70),
      description: truncate(desc, 200),
      images: [ogImage.url],
    },
    other: {
      'product:price:amount':   String(product.price),
      'product:price:currency': currency,
      'product:availability':   product.stockQuantity > 0 ? 'in stock' : 'out of stock',
      ...(product.sku ? { 'product:retailer_item_id': product.sku } : {}),
    },
  };
}

// ── Store / merchant page metadata ────────────────────────────────────────────

export function buildStoreMetadata(
  store: StoreInfo,
  products: ProductInfo[],
  _categories: Array<{ id: string; name: string }>,
): Metadata {
  const canonical = storeUrl(store.subdomain);
  const locationStr = [store.city, store.state, store.country].filter(Boolean).join(', ');

  const title = truncate(
    `${store.name} | Shop Online${store.city ? ` in ${store.city}` : ''} — ${store.industry ?? 'Products'} | Shopysh`,
    60,
  );

  const desc = store.description
    ? truncate(`${store.description} — Browse ${products.length} products from ${store.name}${locationStr ? ` in ${locationStr}` : ''}.`, 160)
    : truncate(`Shop ${products.length} products from ${store.name}${store.industry ? `, a ${store.industry} business` : ''}${locationStr ? ` in ${locationStr}` : ''}. Quality products at great prices.`, 160);

  const ogImage = store.logoUrl
    ? { url: absoluteUrl(store.logoUrl), alt: store.name, width: 1200, height: 630 }
    : { url: `${BASE_URL}/og-image.png`, alt: 'Shopysh Marketplace' };

  return {
    title,
    description: desc,
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      title: truncate(`${store.name} — Online Store`, 95),
      description: truncate(desc, 200),
      images: [ogImage],
      siteName: 'Shopysh',
    },
    twitter: {
      card: 'summary_large_image',
      title: truncate(`${store.name} — Online Store`, 70),
      description: truncate(desc, 200),
      images: [ogImage.url],
    },
  };
}

// ── Marketplace homepage metadata ─────────────────────────────────────────────

export function buildMarketplaceMetadata(): Metadata {
  return {
    title: 'Shopysh — Shop African SME Businesses Online',
    description: 'Discover thousands of African SME stores on Shopysh. Shop products across fashion, electronics, food, and more from verified local businesses.',
    alternates: { canonical: BASE_URL },
    openGraph: {
      type: 'website',
      url: BASE_URL,
      title: 'Shopysh — African SME Marketplace',
      description: 'Discover thousands of African SME stores on Shopysh.',
      images: [{ url: `${BASE_URL}/og-image.png`, alt: 'Shopysh', width: 1200, height: 630 }],
      siteName: 'Shopysh',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Shopysh — African SME Marketplace',
      description: 'Shop from thousands of African SME businesses online.',
      images: [`${BASE_URL}/og-image.png`],
    },
  };
}
