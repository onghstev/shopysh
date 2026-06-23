export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Store, Package, Search, Tag, ChevronRight, Star, MapPin, Globe, Mail, Phone, User, Sparkles, ShoppingBag } from 'lucide-react';

interface Props {
  params: { slug: string };
  searchParams: { category?: string; q?: string };
}

async function getStoreData(slug: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: slug },
    select: {
      id: true, name: true, subdomain: true, industry: true, logoUrl: true,
      primaryColor: true, defaultCurrency: true, phone: true, email: true,
      address: true, settings: true, isActive: true,
    },
  });
  if (!tenant || !tenant.isActive) return null;

  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id, isActive: true, deletedAt: null },
    include: {
      images: { orderBy: { displayOrder: 'asc' }, take: 1 },
      category: { select: { id: true, name: true, icon: true } },
    },
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
  });

  const categories = await prisma.productCategory.findMany({
    where: { tenantId: tenant.id, isActive: true },
    select: { id: true, name: true, icon: true },
    orderBy: { displayOrder: 'asc' },
  });

  const settings = (tenant.settings as any) ?? {};
  return {
    store: {
      id: tenant.id, name: tenant.name, subdomain: tenant.subdomain, industry: tenant.industry,
      logoUrl: tenant.logoUrl, primaryColor: tenant.primaryColor ?? '#10b981',
      currency: tenant.defaultCurrency, phone: tenant.phone, email: tenant.email,
      address: tenant.address, description: settings.description ?? '',
      city: settings.city ?? '', state: settings.state ?? '', country: settings.country ?? '',
      website: settings.website ?? '',
    },
    products: products.map((p: any) => ({
      id: p.id, name: p.name, description: p.description, price: Number(p.price),
      currency: p.currency, stockQuantity: p.stockQuantity, isFeatured: p.isFeatured,
      category: p.category, image: p.images[0]?.url ?? null, imageAlt: p.images[0]?.altText ?? p.name,
    })),
    categories,
  };
}

function getCurrencySymbol(c: string) {
  const s: Record<string, string> = { NGN: '\u20a6', USD: '$', GHS: 'GH\u20b5', KES: 'KSh' };
  return s[c] ?? c + ' ';
}

function formatPrice(amount: number, currency: string) {
  return `${getCurrencySymbol(currency)}${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getStoreData(params.slug);
  if (!data) return { title: 'Store Not Found' };
  const { store, products } = data;
  const desc = store.description
    ? `${store.description} \u2014 Browse ${products.length} products from ${store.name}${store.city ? ` in ${store.city}` : ''}${store.country ? `, ${store.country}` : ''}.`
    : `Shop ${products.length} products from ${store.name}${store.industry ? `, a ${store.industry} business` : ''}${store.city ? ` in ${store.city}` : ''}${store.country ? `, ${store.country}` : ''}. Quality products at great prices.`;

  return {
    title: `${store.name} | Shop Online \u2014 ${store.industry ?? 'Products'}${store.city ? ` in ${store.city}` : ''}`,
    description: desc.slice(0, 160),
    openGraph: {
      title: `${store.name} \u2014 Online Store`,
      description: desc.slice(0, 200),
      type: 'website',
      ...(store.logoUrl ? { images: [{ url: store.logoUrl, alt: store.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${store.name} \u2014 Online Store`,
      description: desc.slice(0, 200),
    },
    alternates: {
      canonical: `/store/${store.subdomain}`,
    },
  };
}

export default async function StorePage({ params, searchParams }: Props) {
  const data = await getStoreData(params.slug);
  if (!data) notFound();
  const { store, products, categories } = data;

  const selectedCategory = searchParams.category;
  const searchQuery = searchParams.q?.toLowerCase();

  let filteredProducts = products;
  if (selectedCategory) {
    filteredProducts = filteredProducts.filter((p: any) => p.category?.id === selectedCategory);
  }
  if (searchQuery) {
    filteredProducts = filteredProducts.filter((p: any) =>
      p.name.toLowerCase().includes(searchQuery) ||
      (p.description?.toLowerCase().includes(searchQuery))
    );
  }

  const featuredProducts = filteredProducts.filter((p: any) => p.isFeatured);
  const regularProducts = filteredProducts.filter((p: any) => !p.isFeatured);

  // Build JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: store.name,
    description: store.description || `${store.name} online store`,
    ...(store.logoUrl ? { image: store.logoUrl } : {}),
    ...(store.phone ? { telephone: store.phone } : {}),
    ...(store.email ? { email: store.email } : {}),
    ...(store.website ? { url: store.website } : {}),
    ...(store.address || store.city || store.country ? {
      address: {
        '@type': 'PostalAddress',
        ...(store.address ? { streetAddress: store.address } : {}),
        ...(store.city ? { addressLocality: store.city } : {}),
        ...(store.state ? { addressRegion: store.state } : {}),
        ...(store.country ? { addressCountry: store.country } : {}),
      },
    } : {}),
    ...(store.industry ? { '@additionalType': store.industry } : {}),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${store.name} Products`,
      numberOfItems: products.length,
      itemListElement: products.slice(0, 20).map((p: any, i: number) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.name,
          ...(p.description ? { description: p.description.slice(0, 200) } : {}),
          ...(p.image ? { image: p.image } : {}),
          offers: {
            '@type': 'Offer',
            price: p.price,
            priceCurrency: p.currency,
            availability: p.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
        },
      })),
    },
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What products does ${store.name} sell?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: categories.length > 0
            ? `${store.name} sells products in the following categories: ${categories.map((c: any) => c.name).join(', ')}. They offer ${products.length} products in total.`
            : `${store.name} offers ${products.length} products${store.industry ? ` in the ${store.industry} industry` : ''}.`,
        },
      },
      {
        '@type': 'Question',
        name: `Where is ${store.name} located?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: store.city || store.country
            ? `${store.name} is located${store.address ? ` at ${store.address}` : ''}${store.city ? ` in ${store.city}` : ''}${store.state ? `, ${store.state}` : ''}${store.country ? `, ${store.country}` : ''}.`
            : `${store.name} operates online. Contact them for location details.`,
        },
      },
      {
        '@type': 'Question',
        name: `How can I contact ${store.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: [
            store.phone ? `Phone: ${store.phone}` : null,
            store.email ? `Email: ${store.email}` : null,
            store.website ? `Website: ${store.website}` : null,
          ].filter(Boolean).join('. ') || `Visit their online store to get in touch.`,
        },
      },
      ...(products.length > 0 ? [{
        '@type': 'Question',
        name: `What is the price range at ${store.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: (() => {
            const prices = products.map((p: any) => p.price).sort((a: number, b: number) => a - b);
            return `Prices at ${store.name} range from ${formatPrice(prices[0], store.currency)} to ${formatPrice(prices[prices.length - 1], store.currency)} (${store.currency}).`;
          })(),
        },
      }] : []),
    ],
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Stores', item: '/store' },
      { '@type': 'ListItem', position: 2, name: store.name },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="min-h-screen bg-gradient-to-b from-gray-50/80 to-white dark:from-gray-950 dark:to-gray-900">
        {/* Store Header */}
        <header className="border-b bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl sticky top-0 z-40 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {store.logoUrl ? (
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-muted ring-1 ring-black/5 shadow-sm">
                    <Image src={store.logoUrl} alt={store.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-md" style={{ backgroundColor: store.primaryColor }}>
                    {store.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h1 className="font-bold text-lg tracking-tight">{store.name}</h1>
                  {store.industry && <p className="text-xs text-muted-foreground">{store.industry}</p>}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {store.phone && <span className="hidden sm:flex items-center gap-1.5 hover:text-foreground transition-colors"><Phone className="w-3.5 h-3.5" />{store.phone}</span>}
                {store.email && <span className="hidden md:flex items-center gap-1.5 hover:text-foreground transition-colors"><Mail className="w-3.5 h-3.5" />{store.email}</span>}
                <Link href={`/store/${store.subdomain}/account`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted/60 transition-colors font-medium">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">My Account</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="py-14 sm:py-20 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-[120px]" style={{ backgroundColor: `${store.primaryColor}08` }} />
            <div className="absolute bottom-0 -left-32 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ backgroundColor: `${store.primaryColor}05` }} />
          </div>
          <div className="max-w-7xl mx-auto relative">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border/50">
                  <Store className="w-3.5 h-3.5" />
                  <span className="font-medium">{store.industry ?? 'Online Store'}</span>
                </div>
                {store.city && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 border border-border/50">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{store.city}{store.country ? `, ${store.country}` : ''}</span>
                  </div>
                )}
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 leading-[1.1]">
                Welcome to{' '}
                <span style={{ color: store.primaryColor }}>{store.name}</span>
              </h2>
              {store.description && (
                <p className="text-lg text-muted-foreground leading-relaxed mb-5 max-w-2xl">{store.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-medium">
                  <Package className="w-4 h-4" />
                  {products.length} product{products.length !== 1 ? 's' : ''}
                </div>
                {categories.length > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 font-medium">
                    <Tag className="w-4 h-4" />
                    {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="px-4 sm:px-6 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center gap-3">
              <form method="get" className="flex-1 min-w-[200px] max-w-sm">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <input
                    type="text" name="q" defaultValue={searchQuery ?? ''}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white dark:bg-gray-800/80 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 shadow-sm transition-all"
                  />
                  {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
                </div>
              </form>
              <div className="flex gap-2 flex-wrap">
                <Link
                  href={`/store/${store.subdomain}${searchQuery ? `?q=${searchQuery}` : ''}`}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 ${
                    !selectedCategory
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-sm'
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-border/50'
                  }`}
                >
                  All
                </Link>
                {categories.map((cat: any) => (
                  <Link
                    key={cat.id}
                    href={`/store/${store.subdomain}?category=${cat.id}${searchQuery ? `&q=${searchQuery}` : ''}`}
                    className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 ${
                      selectedCategory === cat.id
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-sm'
                        : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-border/50'
                    }`}
                  >
                    {cat.icon && <span className="mr-1">{cat.icon}</span>}{cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="px-4 sm:px-6 pb-12">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">Featured Products</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {featuredProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} slug={store.subdomain} currency={store.currency} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Products */}
        <section className="px-4 sm:px-6 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">
                {selectedCategory
                  ? categories.find((c: any) => c.id === selectedCategory)?.name ?? 'Products'
                  : searchQuery ? `Results for \u201c${searchQuery}\u201d` : 'All Products'}
                <span className="text-sm font-normal text-muted-foreground ml-2">({regularProducts.length})</span>
              </h3>
            </div>
            {regularProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {regularProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} slug={store.subdomain} currency={store.currency} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-gray-800/50 rounded-2xl border border-dashed">
                <Package className="w-14 h-14 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No products found</p>
                {(searchQuery || selectedCategory) && (
                  <Link href={`/store/${store.subdomain}`} className="text-sm text-emerald-600 hover:underline mt-2 inline-block font-medium">
                    View all products
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-4 sm:px-6 pb-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold tracking-tight">Frequently Asked Questions</h3>
              <p className="text-sm text-muted-foreground mt-2">Find answers to common questions about {store.name}</p>
            </div>
            <div className="space-y-3">
              <FaqItem
                question={`What products does ${store.name} sell?`}
                answer={
                  categories.length > 0
                    ? `${store.name} offers ${products.length} products across categories including ${categories.map((c: any) => c.name).join(', ')}. Browse our catalog above to explore our full range.`
                    : `${store.name} offers ${products.length} quality products${store.industry ? ` in the ${store.industry} space` : ''}. Browse our catalog above to explore our full range.`
                }
              />
              <FaqItem
                question={`Where is ${store.name} located?`}
                answer={
                  store.city || store.country
                    ? `${store.name} is based${store.address ? ` at ${store.address}` : ''}${store.city ? ` in ${store.city}` : ''}${store.state ? `, ${store.state}` : ''}${store.country ? `, ${store.country}` : ''}. We serve customers across our region and beyond.`
                    : `${store.name} operates online. Reach out via our contact details above for more information.`
                }
              />
              <FaqItem
                question={`How can I contact ${store.name}?`}
                answer={[
                  store.phone ? `Call us at ${store.phone}` : null,
                  store.email ? `Email us at ${store.email}` : null,
                  store.website ? `Visit our website at ${store.website}` : null,
                  'You can also use the chat widget on our website for instant assistance.',
                ].filter(Boolean).join('. ')}
              />
              {products.length > 0 && (
                <FaqItem
                  question={`What is the price range at ${store.name}?`}
                  answer={(() => {
                    const prices = products.map((p: any) => p.price).sort((a: number, b: number) => a - b);
                    return `Our products range from ${formatPrice(prices[0], store.currency)} to ${formatPrice(prices[prices.length - 1], store.currency)}. We offer quality products at competitive prices for our customers.`;
                  })()}
                />
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t bg-white/50 dark:bg-gray-900/50 py-10 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {store.name}. Powered by{' '}
              <Link href="/pitch" className="text-emerald-600 hover:underline font-semibold">SHOPYSH</Link>
            </p>
            {(store.city || store.country) && (
              <p className="text-xs text-muted-foreground/50 mt-2 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3" />
                {[store.address, store.city, store.state, store.country].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </footer>

        {/* Chat Widget */}
        <script src="/widget/tekhuna-chat.js" data-tenant-id={store.id} />
      </div>
    </>
  );
}

function ProductCard({ product, slug, currency }: { product: any; slug: string; currency: string }) {
  const displayCurrency = product.currency || currency;
  return (
    <Link href={`/store/${slug}/products/${product.id}`} className="group">
      <article className="bg-white dark:bg-gray-800/80 rounded-2xl border border-border/50 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/[0.04] hover:-translate-y-1">
        <div className="relative aspect-square bg-gray-50 dark:bg-gray-700/50 overflow-hidden">
          {product.image ? (
            <Image src={product.image} alt={product.imageAlt || product.name} fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500 ease-out" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground/15" />
            </div>
          )}
          {product.isFeatured && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-bold tracking-wide uppercase shadow-sm flex items-center gap-1">
              <Star className="w-3 h-3" />Featured
            </span>
          )}
          {product.stockQuantity === 0 && (
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-red-500/90 text-white text-[10px] font-bold tracking-wide uppercase shadow-sm">Out of Stock</span>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="p-4">
          {product.category && (
            <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/70 font-semibold">
              {product.category.icon && <span className="mr-0.5">{product.category.icon}</span>}
              {product.category.name}
            </span>
          )}
          <h4 className="font-semibold text-sm mt-1.5 line-clamp-2 group-hover:text-emerald-600 transition-colors duration-200">{product.name}</h4>
          {product.description && (
            <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
            <span className="text-base font-bold text-emerald-600">
              {formatPrice(product.price, displayCurrency)}
            </span>
            <span className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 transition-colors">
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group bg-white dark:bg-gray-800/80 rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <summary className="cursor-pointer px-6 py-4 font-medium text-sm flex items-center justify-between hover:bg-muted/30 rounded-xl transition-colors">
        {question}
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-open:rotate-90 transition-transform duration-200 shrink-0 ml-3" />
      </summary>
      <div className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">
        {answer}
      </div>
    </details>
  );
}
