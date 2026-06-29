/**
 * Schema.org JSON-LD builders for Shopysh SEO module.
 * All functions return plain objects — serialize with JSON.stringify before
 * embedding in <script type="application/ld+json">.
 */

import { absoluteUrl, storeUrl, productUrl, categoryUrl, BASE_URL } from './urls';

// ── Types ────────────────────────────────────────────────────────────────────

export interface StoreInfo {
  id: string;
  name: string;
  subdomain: string;
  industry?: string | null;
  logoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  description?: string;
  website?: string;
  currency: string;
}

export interface ProductInfo {
  id: string;
  slug?: string | null;
  name: string;
  description?: string | null;
  sku?: string | null;
  price: number;
  currency: string;
  stockQuantity: number;
  isFeatured?: boolean;
  images?: Array<{ url: string; altText?: string | null }>;
  category?: { id: string; name: string } | null;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BreadcrumbItem {
  name: string;
  url?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function defined<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ) as Partial<T>;
}

function gmcAvailability(qty: number): string {
  return qty > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
}

// ── 1. WebSite + SearchAction ────────────────────────────────────────────────

export function buildWebSiteSchema(overrides?: { name?: string; url?: string }) {
  const url  = overrides?.url  ?? BASE_URL;
  const name = overrides?.name ?? 'Shopysh — African SME Marketplace';
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${url}/#website`,
    url,
    name,
    description: 'Shopysh connects you to thousands of African SME online stores.',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${url}/store?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ── 2. Organization (Marketplace or Merchant) ────────────────────────────────

export function buildOrganizationSchema(store: StoreInfo) {
  const url = storeUrl(store.subdomain);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${url}/#organization`,
    name: store.name,
    url,
    ...defined({
      logo: store.logoUrl
        ? { '@type': 'ImageObject', url: absoluteUrl(store.logoUrl), width: 200, height: 200 }
        : undefined,
      telephone: store.phone,
      email: store.email,
      description: store.description || undefined,
      sameAs: store.website ? [store.website] : undefined,
    }),
    ...((store.address || store.city || store.country) ? {
      address: {
        '@type': 'PostalAddress',
        ...defined({
          streetAddress: store.address,
          addressLocality: store.city,
          addressRegion: store.state,
          addressCountry: store.country,
        }),
      },
    } : {}),
    ...( store.phone || store.email ? {
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        ...defined({ telephone: store.phone, email: store.email }),
      },
    } : {}),
  };
}

// ── 3. LocalBusiness / Store ─────────────────────────────────────────────────

export function buildStoreSchema(
  store: StoreInfo,
  products: ProductInfo[],
  categories: Array<{ id: string; name: string }>,
) {
  const url = storeUrl(store.subdomain);
  const prices = products.map((p) => p.price).filter((p) => p > 0).sort((a, b) => a - b);

  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${url}/#store`,
    name: store.name,
    url,
    ...defined({
      description: store.description || undefined,
      image: store.logoUrl ? absoluteUrl(store.logoUrl) : undefined,
      telephone: store.phone,
      email: store.email,
      currenciesAccepted: store.currency,
      industry: store.industry,
    }),
    ...((store.address || store.city || store.country) ? {
      address: {
        '@type': 'PostalAddress',
        ...defined({
          streetAddress: store.address,
          addressLocality: store.city,
          addressRegion: store.state,
          addressCountry: store.country || 'NG',
        }),
      },
    } : {}),
    ...(prices.length > 0 ? {
      priceRange: prices.length > 1
        ? `${store.currency} ${prices[0].toLocaleString()} – ${prices[prices.length - 1].toLocaleString()}`
        : `${store.currency} ${prices[0].toLocaleString()}`,
    } : {}),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${store.name} Products`,
      numberOfItems: products.length,
      ...(categories.length > 0 ? {
        itemListElement: categories.map((c) => ({
          '@type': 'OfferCatalog',
          name: c.name,
          url: categoryUrl(store.subdomain, c.id),
        })),
      } : {}),
    },
  };
}

// ── 4. Product ────────────────────────────────────────────────────────────────

export function buildProductSchema(product: ProductInfo, store: StoreInfo) {
  const url  = productUrl(store.subdomain, product.slug ?? product.id);
  const meta = product.metadata ?? {};

  // Absolute image URLs
  const images = (product.images ?? []).map((i) => absoluteUrl(i.url));

  // Optional GMC fields stored in product.metadata
  const gtin      = meta.gtin      as string | undefined;
  const mpn       = meta.mpn       as string | undefined;
  const condition = (meta.condition as string | undefined) ?? 'NewCondition';
  const googleCat = meta.googleProductCategory as string | undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}/#product`,
    name: product.name,
    url,
    ...defined({
      description: product.description,
      sku: product.sku,
      gtin: gtin,
      mpn: mpn,
      category: product.category?.name,
      image: images.length > 0 ? (images.length === 1 ? images[0] : images) : undefined,
    }),
    brand: {
      '@type': 'Brand',
      name: store.name,
      ...defined({ url: storeUrl(store.subdomain) }),
    },
    offers: {
      '@type': 'Offer',
      '@id': `${url}/#offer`,
      url,
      price: product.price,
      priceCurrency: product.currency || store.currency,
      availability: gmcAvailability(product.stockQuantity),
      itemCondition: `https://schema.org/${condition}`,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      seller: {
        '@type': 'Organization',
        name: store.name,
        url: storeUrl(store.subdomain),
        ...defined({ logo: store.logoUrl ? absoluteUrl(store.logoUrl) : undefined }),
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          currency: product.currency || store.currency,
          value: '0',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: store.country || 'NG',
        },
      },
    },
    ...(googleCat ? { additionalType: googleCat } : {}),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
}

// ── 5. BreadcrumbList ─────────────────────────────────────────────────────────

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: absoluteUrl(item.url) } : {}),
    })),
  };
}

// ── 6. ItemList (product listing) ─────────────────────────────────────────────

export function buildItemListSchema(
  products: ProductInfo[],
  store: StoreInfo,
  listName?: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName ?? `${store.name} Products`,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 50).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: productUrl(store.subdomain, p.slug ?? p.id),
      item: {
        '@type': 'Product',
        name: p.name,
        url: productUrl(store.subdomain, p.slug ?? p.id),
        ...defined({
          description: p.description?.slice(0, 200),
          image: p.images?.[0] ? absoluteUrl(p.images[0].url) : undefined,
        }),
        offers: {
          '@type': 'Offer',
          price: p.price,
          priceCurrency: p.currency || store.currency,
          availability: gmcAvailability(p.stockQuantity),
        },
      },
    })),
  };
}

// ── 7. FAQPage ────────────────────────────────────────────────────────────────

export function buildFaqSchema(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

// ── 8. Marketplace Organization (Shopysh itself) ──────────────────────────────

export function buildMarketplaceOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${BASE_URL}/#organization`,
    name: 'Shopysh',
    url: BASE_URL,
    logo: { '@type': 'ImageObject', url: `${BASE_URL}/og-image.png` },
    description: 'Shopysh is a multi-tenant e-commerce platform for African SMEs.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'English',
    },
  };
}
