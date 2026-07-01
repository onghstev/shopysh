export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import {
  buildStoreMetadata, buildStoreSchema, buildOrganizationSchema,
  buildBreadcrumbSchema, buildFaqSchema, buildWebSiteSchema, storeUrl,
} from '@/lib/seo';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Store, Package, Search, ChevronRight, Star, MapPin, Mail, Phone, User, ShoppingBag, LayoutGrid } from 'lucide-react';

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
      category: { select: { id: true, name: true, icon: true, parentId: true } },
    },
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
  });

  const categories = await prisma.productCategory.findMany({
    where: { tenantId: tenant.id, isActive: true, parentId: null },
    include: { children: { where: { isActive: true }, select: { id: true } } },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
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
  const s: Record<string, string> = { NGN: '₦', USD: '$', GHS: 'GH₵', KES: 'KSh' };
  return s[c] ?? c + ' ';
}

function formatPrice(amount: number, currency: string) {
  return `${getCurrencySymbol(currency)}${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getStoreData(params.slug);
  if (!data) return { title: 'Store Not Found' };
  return buildStoreMetadata(data.store, data.products, data.categories);
}

export default async function StorePage({ params, searchParams }: Props) {
  const data = await getStoreData(params.slug);
  if (!data) notFound();
  const { store, products, categories } = data;

  const selectedCategory = searchParams.category;
  const searchQuery = searchParams.q?.toLowerCase();

  let filteredProducts = products;
  if (selectedCategory) {
    const parent = categories.find((c: any) => c.id === selectedCategory);
    const matchIds = new Set<string>([selectedCategory, ...(parent?.children?.map((ch: any) => ch.id) ?? [])]);
    filteredProducts = filteredProducts.filter((p: any) => p.category && matchIds.has(p.category.id));
  }
  if (searchQuery) filteredProducts = filteredProducts.filter((p: any) =>
    p.name.toLowerCase().includes(searchQuery) || p.description?.toLowerCase().includes(searchQuery)
  );

  const featuredProducts = filteredProducts.filter((p: any) => p.isFeatured);
  const regularProducts = filteredProducts.filter((p: any) => !p.isFeatured);

  const productInfos = products.map((p: any) => ({
    id: p.id, name: p.name, description: p.description, price: Number(p.price),
    currency: p.currency, stockQuantity: p.stockQuantity, isFeatured: p.isFeatured,
    images: p.image ? [{ url: p.image as string, altText: p.imageAlt as string | null }] : ([] as Array<{ url: string; altText?: string | null }>),
    category: p.category,
  }));

  const storeJsonLd   = buildStoreSchema(store, productInfos, categories);
  const orgJsonLd     = buildOrganizationSchema(store);
  const websiteJsonLd = buildWebSiteSchema({ name: store.name, url: storeUrl(store.subdomain) });

  const prices = products.map((p: any) => p.price).sort((a: number, b: number) => a - b);
  const faqJsonLd = buildFaqSchema([
    {
      question: `What products does ${store.name} sell?`,
      answer: categories.length > 0
        ? `${store.name} sells products in the following categories: ${categories.map((c: any) => c.name).join(', ')}. They offer ${products.length} products in total.`
        : `${store.name} offers ${products.length} products${store.industry ? ` in the ${store.industry} industry` : ''}.`,
    },
    {
      question: `Where is ${store.name} located?`,
      answer: store.city || store.country
        ? `${store.name} is located${store.address ? ` at ${store.address}` : ''}${store.city ? ` in ${store.city}` : ''}${store.state ? `, ${store.state}` : ''}${store.country ? `, ${store.country}` : ''}.`
        : `${store.name} operates online. Contact them for location details.`,
    },
    {
      question: `How can I contact ${store.name}?`,
      answer: [
        store.phone ? `Phone: ${store.phone}` : null,
        store.email ? `Email: ${store.email}` : null,
        store.website ? `Website: ${store.website}` : null,
      ].filter(Boolean).join('. ') || 'Visit their online store to get in touch.',
    },
    ...(prices.length > 0 ? [{
      question: `What is the price range at ${store.name}?`,
      answer: `Prices at ${store.name} range from ${formatPrice(prices[0], store.currency)} to ${formatPrice(prices[prices.length - 1], store.currency)} (${store.currency}).`,
    }] : []),
  ]);

  const breadcrumbJsonLd = buildBreadcrumbSchema([
    { name: 'Stores', url: '/store' },
    { name: store.name, url: `/store/${store.subdomain}` },
  ]);

  const selectedCatName = selectedCategory
    ? categories.find((c: any) => c.id === selectedCategory)?.name
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="min-h-screen bg-[#f8f7f4] text-foreground">

        {/* ── Header ── */}
        <header className="border-b border-border/60 bg-white sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Logo + name */}
              <div className="flex items-center gap-3 min-w-0">
                {store.logoUrl ? (
                  <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-muted ring-1 ring-border shrink-0">
                    <Image src={store.logoUrl} alt={store.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 bg-primary">
                    {store.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="font-bold text-sm sm:text-base tracking-tight truncate">{store.name}</h1>
                  {store.industry && <p className="text-[11px] text-muted-foreground truncate">{store.industry}</p>}
                </div>
              </div>

              {/* Search bar — centre */}
              <form method="get" className="hidden md:flex flex-1 max-w-md mx-4">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <input
                    type="text" name="q" defaultValue={searchQuery ?? ''}
                    placeholder="Search products…"
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-[#f8f7f4] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  />
                  {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
                </div>
              </form>

              {/* Contact + account */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
                {store.phone && (
                  <a href={`tel:${store.phone}`} className="hidden lg:flex items-center gap-1.5 hover:text-foreground transition-colors text-xs">
                    <Phone className="w-3.5 h-3.5" />{store.phone}
                  </a>
                )}
                {store.email && (
                  <a href={`mailto:${store.email}`} className="hidden xl:flex items-center gap-1.5 hover:text-foreground transition-colors text-xs">
                    <Mail className="w-3.5 h-3.5" />{store.email}
                  </a>
                )}
                <Link
                  href={`/store/${store.subdomain}/account`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/8 hover:bg-primary/15 text-primary transition-colors font-semibold text-xs"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">My Account</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* ── Hero banner ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 px-4 sm:px-6 py-8">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 32px)' }} />
          <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-gold/10 blur-[80px] pointer-events-none" />
          <div className="max-w-7xl mx-auto relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              {store.city && (
                <p className="text-white/60 text-xs flex items-center gap-1 mb-1">
                  <MapPin className="w-3 h-3" />{[store.city, store.country].filter(Boolean).join(', ')}
                </p>
              )}
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Welcome to <span className="text-gold">{store.name}</span>
              </h2>
              {store.description && (
                <p className="text-white/65 text-sm mt-1 max-w-xl line-clamp-2">{store.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-center px-4 py-2 rounded-xl bg-white/10 border border-white/15">
                <p className="text-white font-bold text-lg leading-none">{products.length}</p>
                <p className="text-white/60 text-[10px] mt-0.5">Products</p>
              </div>
              {categories.length > 0 && (
                <div className="text-center px-4 py-2 rounded-xl bg-white/10 border border-white/15">
                  <p className="text-white font-bold text-lg leading-none">{categories.length}</p>
                  <p className="text-white/60 text-[10px] mt-0.5">Categories</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile search ── */}
        <div className="md:hidden px-4 py-3 bg-white border-b border-border/40">
          <form method="get">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <input
                type="text" name="q" defaultValue={searchQuery ?? ''}
                placeholder="Search products…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-[#f8f7f4] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
            </div>
          </form>
        </div>

        {/* ── Main layout: sidebar + content ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex gap-8 items-start">

            {/* ── Left Sidebar: Categories ── */}
            {categories.length > 0 && (
              <aside className="hidden lg:block w-56 shrink-0 sticky top-[61px]">
                <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Categories</span>
                  </div>
                  <nav className="p-2">
                    <Link
                      href={`/store/${store.subdomain}${searchQuery ? `?q=${searchQuery}` : ''}`}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                        !selectedCategory
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-primary/8 hover:text-primary'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        All Products
                      </span>
                      <span className={`text-xs font-mono rounded-full px-1.5 py-0.5 ${!selectedCategory ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                        {products.length}
                      </span>
                    </Link>
                    <div className="mt-1 space-y-0.5">
                      {categories.map((cat: any) => {
                        const count = products.filter((p: any) => {
                          if (!p.category) return false;
                          const childIds = new Set([cat.id, ...(cat.children?.map((c: any) => c.id) ?? [])]);
                          return childIds.has(p.category.id);
                        }).length;
                        const isActive = selectedCategory === cat.id;
                        return (
                          <Link
                            key={cat.id}
                            href={`/store/${store.subdomain}?category=${cat.id}${searchQuery ? `&q=${searchQuery}` : ''}`}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                              isActive
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'text-foreground hover:bg-primary/8 hover:text-primary'
                            }`}
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              {cat.icon && <span className="text-base shrink-0">{cat.icon}</span>}
                              <span className="truncate">{cat.name}</span>
                            </span>
                            {count > 0 && (
                              <span className={`text-xs font-mono rounded-full px-1.5 py-0.5 shrink-0 ml-1 ${isActive ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                                {count}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </nav>
                </div>

                {/* Store contact card */}
                {(store.phone || store.email || store.city) && (
                  <div className="mt-4 bg-white rounded-2xl border border-border/60 shadow-sm p-4 space-y-2.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</p>
                    {store.phone && (
                      <a href={`tel:${store.phone}`} className="flex items-center gap-2 text-xs text-foreground hover:text-primary transition-colors">
                        <Phone className="w-3.5 h-3.5 text-primary/60 shrink-0" />{store.phone}
                      </a>
                    )}
                    {store.email && (
                      <a href={`mailto:${store.email}`} className="flex items-center gap-2 text-xs text-foreground hover:text-primary transition-colors break-all">
                        <Mail className="w-3.5 h-3.5 text-primary/60 shrink-0" />{store.email}
                      </a>
                    )}
                    {(store.city || store.country) && (
                      <p className="flex items-start gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 text-primary/60 shrink-0 mt-0.5" />
                        {[store.city, store.state, store.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </aside>
            )}

            {/* ── Mobile category pills ── */}
            {categories.length > 0 && (
              <div className="lg:hidden -mx-4 sm:-mx-6 mb-6 px-4 sm:px-6 overflow-x-auto">
                <div className="flex gap-2 pb-1 min-w-max">
                  <Link
                    href={`/store/${store.subdomain}${searchQuery ? `?q=${searchQuery}` : ''}`}
                    className={`px-4 py-2 rounded-full text-xs font-semibold border whitespace-nowrap transition-all ${
                      !selectedCategory ? 'bg-primary text-primary-foreground border-primary' : 'bg-white text-foreground border-border/60 hover:border-primary/40'
                    }`}
                  >
                    All
                  </Link>
                  {categories.map((cat: any) => (
                    <Link
                      key={cat.id}
                      href={`/store/${store.subdomain}?category=${cat.id}${searchQuery ? `&q=${searchQuery}` : ''}`}
                      className={`px-4 py-2 rounded-full text-xs font-semibold border whitespace-nowrap transition-all ${
                        selectedCategory === cat.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-white text-foreground border-border/60 hover:border-primary/40'
                      }`}
                    >
                      {cat.icon && <span className="mr-1">{cat.icon}</span>}{cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── Product area ── */}
            <div className="flex-1 min-w-0">
              {/* Section heading */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">
                    {selectedCatName ?? (searchQuery ? `"${searchQuery}"` : 'All Products')}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</p>
                </div>
                {(selectedCategory || searchQuery) && (
                  <Link href={`/store/${store.subdomain}`} className="text-xs text-primary hover:underline font-medium">
                    Clear filter
                  </Link>
                )}
              </div>

              {/* Featured strip */}
              {featuredProducts.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-4 h-4 text-gold" fill="currentColor" />
                    <span className="text-sm font-semibold text-foreground">Featured</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {featuredProducts.map((product: any) => (
                      <ProductCard key={product.id} product={product} slug={store.subdomain} currency={store.currency} />
                    ))}
                  </div>
                  {regularProducts.length > 0 && <div className="mt-8 border-t border-border/40" />}
                </div>
              )}

              {/* Regular products */}
              {regularProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {regularProducts.map((product: any) => (
                    <ProductCard key={product.id} product={product} slug={store.subdomain} currency={store.currency} />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-border">
                  <Package className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium text-sm">No products found</p>
                  <Link href={`/store/${store.subdomain}`} className="text-xs text-primary hover:underline mt-2 inline-block font-medium">
                    View all products
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <section className="px-4 sm:px-6 py-16 bg-white border-t border-border/40">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-xl font-bold tracking-tight text-foreground mb-6">Frequently Asked Questions</h3>
            <div className="space-y-2">
              <FaqItem question={`What products does ${store.name} sell?`} answer={categories.length > 0 ? `${store.name} offers ${products.length} products across categories including ${categories.map((c: any) => c.name).join(', ')}.` : `${store.name} offers ${products.length} quality products${store.industry ? ` in the ${store.industry} space` : ''}.`} />
              <FaqItem question={`Where is ${store.name} located?`} answer={store.city || store.country ? `${store.name} is based${store.city ? ` in ${store.city}` : ''}${store.state ? `, ${store.state}` : ''}${store.country ? `, ${store.country}` : ''}.` : `${store.name} operates online.`} />
              <FaqItem question={`How can I contact ${store.name}?`} answer={[store.phone ? `Call: ${store.phone}` : null, store.email ? `Email: ${store.email}` : null].filter(Boolean).join(' · ') || 'Use the chat widget on this page.'} />
              {prices.length > 0 && (
                <FaqItem question={`What is the price range at ${store.name}?`} answer={`Products range from ${formatPrice(prices[0], store.currency)} to ${formatPrice(prices[prices.length - 1], store.currency)}.`} />
              )}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-border/60 bg-white py-8 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {store.logoUrl ? (
                <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-muted ring-1 ring-border">
                  <Image src={store.logoUrl} alt={store.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                  {store.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-bold text-sm text-foreground">{store.name}</p>
                {store.industry && <p className="text-[11px] text-muted-foreground">{store.industry}</p>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              {store.phone && <a href={`tel:${store.phone}`} className="flex items-center gap-1 hover:text-foreground transition-colors"><Phone className="w-3 h-3" />{store.phone}</a>}
              {store.email && <a href={`mailto:${store.email}`} className="flex items-center gap-1 hover:text-foreground transition-colors"><Mail className="w-3 h-3" />{store.email}</a>}
              {(store.city || store.country) && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{[store.city, store.country].filter(Boolean).join(', ')}</span>}
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-border/40 text-center">
            <p className="text-[11px] text-muted-foreground/50">
              &copy; {new Date().getFullYear()} {store.name}. Powered by{' '}
              <Link href="/pitch" className="text-primary font-semibold hover:text-gold transition-colors">SHOPYSH</Link>
            </p>
          </div>
        </footer>

        <script src="/widget/tekhuna-chat.js" data-tenant-id={store.id} />
      </div>
    </>
  );
}

function ProductCard({ product, slug, currency }: { product: any; slug: string; currency: string }) {
  const displayCurrency = product.currency || currency;
  return (
    <Link href={`/store/${slug}/products/${product.id}`} className="group">
      <article className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:shadow-primary/6 hover:-translate-y-0.5 hover:border-primary/25">
        <div className="relative aspect-[4/3] bg-[#f8f7f4] overflow-hidden">
          {product.image ? (
            <Image src={product.image} alt={product.imageAlt || product.name} fill className="object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground/15" />
            </div>
          )}
          {product.isFeatured && (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-gold text-gold-foreground text-[10px] font-bold tracking-wide uppercase shadow-sm flex items-center gap-1">
              <Star className="w-2.5 h-2.5" fill="currentColor" />Featured
            </span>
          )}
          {product.stockQuantity === 0 && (
            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-destructive/90 text-destructive-foreground text-[10px] font-bold tracking-wide uppercase">
              Out of Stock
            </span>
          )}
        </div>
        <div className="p-4">
          {product.category && (
            <p className="text-[10px] uppercase tracking-widest text-primary/60 font-semibold mb-1">
              {product.category.icon && <span className="mr-0.5">{product.category.icon}</span>}
              {product.category.name}
            </p>
          )}
          <h4 className="font-semibold text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors leading-snug">
            {product.name}
          </h4>
          {product.description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{product.description}</p>
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
            <span className="text-base font-bold text-gold">
              {formatPrice(product.price, displayCurrency)}
            </span>
            <span className="flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              View <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group bg-[#f8f7f4] rounded-xl border border-border/50 hover:border-primary/25 transition-all">
      <summary className="cursor-pointer px-5 py-3.5 font-medium text-sm flex items-center justify-between hover:bg-primary/4 rounded-xl transition-colors">
        {question}
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-open:rotate-90 transition-transform duration-200 shrink-0 ml-3" />
      </summary>
      <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{answer}</div>
    </details>
  );
}
