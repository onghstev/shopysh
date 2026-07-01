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
import { Store, Package, Search, Tag, ChevronRight, Star, MapPin, Mail, Phone, User, ShoppingBag, Sparkles } from 'lucide-react';

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

  // Build set of all category IDs that match the selected parent (parent itself + its children)
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

  // Normalize products shape to match ProductInfo interface
  const productInfos = products.map((p: any) => ({
    id: p.id, name: p.name, description: p.description, price: Number(p.price),
    currency: p.currency, stockQuantity: p.stockQuantity, isFeatured: p.isFeatured,
    images: p.image ? [{ url: p.image as string, altText: p.imageAlt as string | null }] : ([] as Array<{ url: string; altText?: string | null }>),
    category: p.category,
  }));

  const storeJsonLd    = buildStoreSchema(store, productInfos, categories);
  const orgJsonLd      = buildOrganizationSchema(store);
  const websiteJsonLd  = buildWebSiteSchema({ name: store.name, url: storeUrl(store.subdomain) });

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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="min-h-screen bg-background">

        {/* ── Header ── */}
        <header className="border-b border-border/60 bg-card/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {store.logoUrl ? (
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-muted ring-1 ring-border shadow-sm">
                    <Image src={store.logoUrl} alt={store.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground text-base font-bold shadow-md bg-primary">
                    {store.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h1 className="font-bold text-base tracking-tight text-foreground">{store.name}</h1>
                  {store.industry && <p className="text-[11px] text-muted-foreground">{store.industry}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {store.phone && (
                  <a href={`tel:${store.phone}`} className="hidden sm:flex items-center gap-1.5 hover:text-foreground transition-colors">
                    <Phone className="w-3.5 h-3.5" />{store.phone}
                  </a>
                )}
                {store.email && (
                  <a href={`mailto:${store.email}`} className="hidden md:flex items-center gap-1.5 hover:text-foreground transition-colors">
                    <Mail className="w-3.5 h-3.5" />{store.email}
                  </a>
                )}
                <Link
                  href={`/store/${store.subdomain}/account`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/80 text-accent-foreground transition-colors font-medium text-sm"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">My Account</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-primary/80 py-8 sm:py-12 px-4 sm:px-6">
          {/* decorative blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full bg-gold/10 blur-[100px]" />
            <div className="absolute bottom-0 -left-24 w-[360px] h-[360px] rounded-full bg-white/5 blur-[80px]" />
          </div>
          {/* subtle grid texture */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)' }} />

          <div className="max-w-7xl mx-auto relative">
            <div className="max-w-2xl">
              {/* badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-white/90 text-xs font-medium backdrop-blur-sm">
                  <Store className="w-3 h-3" />{store.industry ?? 'Online Store'}
                </span>
                {store.city && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-white/90 text-xs font-medium backdrop-blur-sm">
                    <MapPin className="w-3 h-3" />{store.city}{store.country ? `, ${store.country}` : ''}
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug mb-2">
                <span className="text-gold">{store.name}</span>
              </h2>

              {store.description && (
                <p className="text-white/70 text-sm leading-relaxed mb-4 max-w-xl">{store.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs font-semibold backdrop-blur-sm">
                  <Package className="w-3.5 h-3.5 text-gold" />
                  {products.length} product{products.length !== 1 ? 's' : ''}
                </div>
                {categories.length > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs font-semibold backdrop-blur-sm">
                    <Tag className="w-3.5 h-3.5 text-gold" />
                    {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Filters ── */}
        <section className="px-4 sm:px-6 py-6 bg-secondary/40 border-b border-border/40">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center gap-3">
              <form method="get" className="flex-1 min-w-[200px] max-w-sm">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <input
                    type="text" name="q" defaultValue={searchQuery ?? ''}
                    placeholder="Search products…"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 shadow-sm transition-all"
                  />
                  {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
                </div>
              </form>
              <div className="flex gap-2 flex-wrap">
                <Link
                  href={`/store/${store.subdomain}${searchQuery ? `?q=${searchQuery}` : ''}`}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 ${
                    !selectedCategory
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card text-foreground hover:bg-accent hover:text-accent-foreground border-border/60'
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
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card text-foreground hover:bg-accent hover:text-accent-foreground border-border/60'
                    }`}
                  >
                    {cat.icon && <span className="mr-1">{cat.icon}</span>}{cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Featured Products ── */}
        {featuredProducts.length > 0 && (
          <section className="px-4 sm:px-6 py-12">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
                  <Star className="w-4 h-4 text-gold" fill="currentColor" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">Featured Products</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {featuredProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} slug={store.subdomain} currency={store.currency} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── All Products ── */}
        <section className="px-4 sm:px-6 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                {selectedCategory
                  ? categories.find((c: any) => c.id === selectedCategory)?.name ?? 'Products'
                  : searchQuery ? `Results for “${searchQuery}”` : 'All Products'}
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
              <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
                <Package className="w-14 h-14 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No products found</p>
                {(searchQuery || selectedCategory) && (
                  <Link href={`/store/${store.subdomain}`} className="text-sm text-primary hover:underline mt-2 inline-block font-medium">
                    View all products
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="px-4 sm:px-6 pb-20 bg-secondary/30">
          <div className="max-w-4xl mx-auto pt-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold tracking-tight text-foreground">Frequently Asked Questions</h3>
              <p className="text-sm text-muted-foreground mt-2">Find answers to common questions about {store.name}</p>
            </div>
            <div className="space-y-3">
              <FaqItem question={`What products does ${store.name} sell?`} answer={categories.length > 0 ? `${store.name} offers ${products.length} products across categories including ${categories.map((c: any) => c.name).join(', ')}. Browse our catalog above to explore our full range.` : `${store.name} offers ${products.length} quality products${store.industry ? ` in the ${store.industry} space` : ''}. Browse our catalog above to explore our full range.`} />
              <FaqItem question={`Where is ${store.name} located?`} answer={store.city || store.country ? `${store.name} is based${store.address ? ` at ${store.address}` : ''}${store.city ? ` in ${store.city}` : ''}${store.state ? `, ${store.state}` : ''}${store.country ? `, ${store.country}` : ''}. We serve customers across our region and beyond.` : `${store.name} operates online. Reach out via our contact details above for more information.`} />
              <FaqItem question={`How can I contact ${store.name}?`} answer={[store.phone ? `Call us at ${store.phone}` : null, store.email ? `Email us at ${store.email}` : null, store.website ? `Visit our website at ${store.website}` : null, 'You can also use the chat widget on our website for instant assistance.'].filter(Boolean).join('. ')} />
              {products.length > 0 && (
                <FaqItem question={`What is the price range at ${store.name}?`} answer={(() => { const prices = products.map((p: any) => p.price).sort((a: number, b: number) => a - b); return `Our products range from ${formatPrice(prices[0], store.currency)} to ${formatPrice(prices[prices.length - 1], store.currency)}. We offer quality products at competitive prices for our customers.`; })()} />
              )}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t-4 border-primary bg-card py-12 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                {store.logoUrl ? (
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-muted ring-1 ring-border">
                    <Image src={store.logoUrl} alt={store.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {store.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-bold text-foreground">{store.name}</p>
                  {store.industry && <p className="text-xs text-muted-foreground">{store.industry}</p>}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                {store.phone && (
                  <a href={`tel:${store.phone}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    <Phone className="w-3.5 h-3.5" />{store.phone}
                  </a>
                )}
                {store.email && (
                  <a href={`mailto:${store.email}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    <Mail className="w-3.5 h-3.5" />{store.email}
                  </a>
                )}
                {(store.city || store.country) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {[store.city, store.state, store.country].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border/50 text-center">
              <p className="text-xs text-muted-foreground/60">
                &copy; {new Date().getFullYear()} {store.name}. Powered by{' '}
                <Link href="/pitch" className="text-primary font-semibold hover:text-gold transition-colors">SHOPYSH</Link>
              </p>
            </div>
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
      <article className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/8 hover:-translate-y-1 hover:border-primary/30">
        <div className="relative aspect-square bg-secondary/50 overflow-hidden">
          {product.image ? (
            <Image src={product.image} alt={product.imageAlt || product.name} fill className="object-cover group-hover:scale-[1.06] transition-transform duration-500 ease-out" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground/15" />
            </div>
          )}
          {product.isFeatured && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-gold text-gold-foreground text-[10px] font-bold tracking-wide uppercase shadow-sm flex items-center gap-1">
              <Star className="w-3 h-3" fill="currentColor" />Featured
            </span>
          )}
          {product.stockQuantity === 0 && (
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-destructive/90 text-destructive-foreground text-[10px] font-bold tracking-wide uppercase shadow-sm">
              Out of Stock
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="p-4">
          {product.category && (
            <span className="text-[10px] uppercase tracking-[0.08em] text-primary/70 font-semibold">
              {product.category.icon && <span className="mr-0.5">{product.category.icon}</span>}
              {product.category.name}
            </span>
          )}
          <h4 className="font-semibold text-sm mt-1.5 line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-200">
            {product.name}
          </h4>
          {product.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
            <span className="text-base font-bold text-gold">
              {formatPrice(product.price, displayCurrency)}
            </span>
            <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
              <ChevronRight className="w-4 h-4 text-accent-foreground group-hover:text-primary-foreground transition-colors" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group bg-card rounded-xl border border-border/60 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
      <summary className="cursor-pointer px-6 py-4 font-medium text-sm flex items-center justify-between hover:bg-accent/50 rounded-xl transition-colors text-foreground">
        {question}
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-open:rotate-90 transition-transform duration-200 shrink-0 ml-3" />
      </summary>
      <div className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">{answer}</div>
    </details>
  );
}
