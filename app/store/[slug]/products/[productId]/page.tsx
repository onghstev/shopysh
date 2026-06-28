export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Package, Tag, MapPin, Check, X, ChevronRight, Phone, Mail, Star, User, ShoppingBag } from 'lucide-react';
import StorefrontOrderForm from '@/components/storefront-order-form';

interface Props {
  params: { slug: string; productId: string };
}

function getCurrencySymbol(c: string) {
  const s: Record<string, string> = { NGN: '₦', USD: '$', GHS: 'GH₵', KES: 'KSh' };
  return s[c] ?? c + ' ';
}

function formatPrice(amount: number, currency: string) {
  return `${getCurrencySymbol(currency)}${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

async function getProductData(slug: string, productId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: slug },
    select: {
      id: true, name: true, subdomain: true, industry: true, logoUrl: true,
      primaryColor: true, defaultCurrency: true, phone: true, email: true,
      address: true, settings: true, isActive: true,
    },
  });
  if (!tenant || !tenant.isActive) return null;

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: tenant.id, isActive: true, deletedAt: null },
    include: {
      images: { orderBy: { displayOrder: 'asc' } },
      category: { select: { id: true, name: true, icon: true, description: true } },
    },
  });
  if (!product) return null;

  const relatedProducts = product.categoryId
    ? await prisma.product.findMany({
        where: { tenantId: tenant.id, categoryId: product.categoryId, isActive: true, deletedAt: null, id: { not: product.id } },
        include: { images: { where: { isPrimary: true }, take: 1 } },
        take: 4,
      })
    : [];

  const settings = (tenant.settings as any) ?? {};
  return {
    store: {
      id: tenant.id, name: tenant.name, subdomain: tenant.subdomain, industry: tenant.industry,
      logoUrl: tenant.logoUrl, primaryColor: tenant.primaryColor ?? '#10b981',
      currency: tenant.defaultCurrency, phone: tenant.phone, email: tenant.email,
      address: tenant.address, description: settings.description ?? '',
      city: settings.city ?? '', state: settings.state ?? '', country: settings.country ?? '',
    },
    product: {
      id: product.id, name: product.name, description: product.description,
      price: Number(product.price), currency: product.currency, sku: product.sku,
      stockQuantity: product.stockQuantity, isFeatured: product.isFeatured,
      category: product.category,
      images: product.images.map((img: any) => ({ url: img.url, alt: img.altText ?? product.name, isPrimary: img.isPrimary })),
      createdAt: product.createdAt,
    },
    relatedProducts: relatedProducts.map((p: any) => ({
      id: p.id, name: p.name, price: Number(p.price), currency: p.currency,
      image: p.images[0]?.url ?? null,
    })),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getProductData(params.slug, params.productId);
  if (!data) return { title: 'Product Not Found' };
  const { store, product } = data;
  const desc = product.description
    ? `${product.description.slice(0, 120)} — ${formatPrice(product.price, product.currency)} at ${store.name}.`
    : `Buy ${product.name} for ${formatPrice(product.price, product.currency)} at ${store.name}${store.city ? ` in ${store.city}` : ''}.`;
  return {
    title: `${product.name} | ${formatPrice(product.price, product.currency)} — ${store.name}`,
    description: desc.slice(0, 160),
    openGraph: { title: `${product.name} — ${store.name}`, description: desc.slice(0, 200), type: 'website', images: product.images.length > 0 ? [{ url: product.images[0].url, alt: product.name }] : [] },
    twitter: { card: 'summary_large_image', title: `${product.name} — ${store.name}`, description: desc.slice(0, 200), images: product.images.length > 0 ? [product.images[0].url] : [] },
    alternates: { canonical: `/store/${store.subdomain}/products/${product.id}` },
  };
}

export default async function ProductPage({ params }: Props) {
  const data = await getProductData(params.slug, params.productId);
  if (!data) notFound();
  const { store, product, relatedProducts } = data;
  const displayCurrency = product.currency || store.currency;

  const productJsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: product.name,
    ...(product.description ? { description: product.description } : {}),
    ...(product.images.length > 0 ? { image: product.images.map((i: any) => i.url) } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    brand: { '@type': 'Brand', name: store.name },
    offers: { '@type': 'Offer', price: product.price, priceCurrency: displayCurrency, availability: product.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', seller: { '@type': 'Organization', name: store.name, ...(store.logoUrl ? { logo: store.logoUrl } : {}) } },
    ...(product.category ? { category: product.category.name } : {}),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Stores', item: '/store' },
      { '@type': 'ListItem', position: 2, name: store.name, item: `/store/${store.subdomain}` },
      ...(product.category ? [{ '@type': 'ListItem', position: 3, name: product.category.name, item: `/store/${store.subdomain}?category=${product.category.id}` }] : []),
      { '@type': 'ListItem', position: product.category ? 4 : 3, name: product.name },
    ],
  };

  const faqJsonLd = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: `How much does ${product.name} cost?`, acceptedAnswer: { '@type': 'Answer', text: `${product.name} is priced at ${formatPrice(product.price, displayCurrency)} at ${store.name}. ${product.stockQuantity > 0 ? 'It is currently in stock.' : 'It is currently out of stock.'}` } },
      { '@type': 'Question', name: `Is ${product.name} available?`, acceptedAnswer: { '@type': 'Answer', text: product.stockQuantity > 0 ? `Yes, ${product.name} is in stock at ${store.name} with ${product.stockQuantity} unit${product.stockQuantity > 1 ? 's' : ''} available.` : `${product.name} is currently out of stock at ${store.name}. Please check back later.` } },
      { '@type': 'Question', name: `Where can I buy ${product.name}?`, acceptedAnswer: { '@type': 'Answer', text: `${product.name} is available from ${store.name}${store.city ? ` in ${store.city}` : ''}${store.country ? `, ${store.country}` : ''}. ${store.phone ? `Contact them at ${store.phone}` : store.email ? `Email them at ${store.email}` : 'Visit their online store'} for purchase inquiries.` } },
    ],
  };

  const primaryImage = product.images.find((i: any) => i.isPrimary) ?? product.images[0];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="min-h-screen bg-background">

        {/* ── Header ── */}
        <header className="border-b border-border/60 bg-card/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <Link href={`/store/${store.subdomain}`} className="flex items-center gap-3 hover:opacity-80 transition group">
              {store.logoUrl ? (
                <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-muted ring-1 ring-border">
                  <Image src={store.logoUrl} alt={store.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {store.name.charAt(0)}
                </div>
              )}
              <span className="font-bold text-foreground group-hover:text-primary transition-colors">{store.name}</span>
            </Link>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {store.phone && (
                <a href={`tel:${store.phone}`} className="hidden sm:flex items-center gap-1.5 hover:text-foreground transition-colors">
                  <Phone className="w-3.5 h-3.5" />{store.phone}
                </a>
              )}
              <Link
                href={`/store/${store.subdomain}/account`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/80 text-accent-foreground transition-colors font-medium"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">My Account</span>
              </Link>
            </div>
          </div>
        </header>

        {/* ── Breadcrumbs ── */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 border-b border-border/30 bg-secondary/20" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
            <li>
              <Link href={`/store/${store.subdomain}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />{store.name}
              </Link>
            </li>
            <li><ChevronRight className="w-3.5 h-3.5 opacity-40" /></li>
            {product.category && (
              <>
                <li>
                  <Link href={`/store/${store.subdomain}?category=${product.category.id}`} className="hover:text-primary transition-colors">
                    {product.category.name}
                  </Link>
                </li>
                <li><ChevronRight className="w-3.5 h-3.5 opacity-40" /></li>
              </>
            )}
            <li className="text-foreground font-medium truncate max-w-[200px]">{product.name}</li>
          </ol>
        </nav>

        {/* ── Product Detail ── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

            {/* Images */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary/50 shadow-md ring-1 ring-border/60">
                {primaryImage ? (
                  <Image src={primaryImage.url} alt={primaryImage.alt || product.name} fill className="object-cover" priority />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-20 h-20 text-muted-foreground/10" />
                  </div>
                )}
                {product.isFeatured && (
                  <span className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-gold text-gold-foreground text-xs font-bold flex items-center gap-1.5 shadow-md">
                    <Star className="w-3.5 h-3.5" fill="currentColor" />Featured
                  </span>
                )}
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images.slice(0, 4).map((img: any, i: number) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-secondary/50 border border-border/50 hover:border-primary/40 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer">
                      <Image src={img.url} alt={img.alt || `${product.name} image ${i + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-6">
              {product.category && (
                <Link
                  href={`/store/${store.subdomain}?category=${product.category.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-foreground bg-accent px-3.5 py-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors ring-1 ring-border/50"
                >
                  <Tag className="w-3 h-3" />{product.category.name}
                </Link>
              )}

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-foreground">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 py-3 border-y border-border/40">
                <span className="text-4xl sm:text-5xl font-bold text-gold">
                  {formatPrice(product.price, displayCurrency)}
                </span>
                <span className="text-sm text-muted-foreground font-medium">{displayCurrency}</span>
              </div>

              {/* Availability */}
              <div>
                {product.stockQuantity > 0 ? (
                  <span className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-accent text-accent-foreground ring-1 ring-primary/20">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    In Stock — {product.stockQuantity} available
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
                    <X className="w-4 h-4" />Out of Stock
                  </span>
                )}
              </div>

              {product.sku && (
                <p className="text-xs text-muted-foreground/60 font-mono">SKU: {product.sku}</p>
              )}

              {/* Description */}
              {product.description && (
                <div className="bg-secondary/50 rounded-xl p-5 border border-border/40">
                  <h3 className="text-sm font-bold mb-2 text-foreground">About this product</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
                </div>
              )}

              {/* Order Form */}
              <StorefrontOrderForm
                product={{ id: product.id, name: product.name, price: product.price, currency: displayCurrency, stockQuantity: product.stockQuantity }}
                slug={store.subdomain}
                storeId={store.id}
                storeName={store.name}
              />

              {/* Contact Store */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {store.phone && (
                  <a href={`tel:${store.phone}`} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border/60 bg-card font-medium text-sm hover:bg-accent hover:border-primary/30 transition-all shadow-sm text-foreground">
                    <Phone className="w-4 h-4" />Call {store.phone}
                  </a>
                )}
                {store.email && (
                  <a href={`mailto:${store.email}?subject=Inquiry about ${product.name}`} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border/60 bg-card font-medium text-sm hover:bg-accent hover:border-primary/30 transition-all shadow-sm text-foreground">
                    <Mail className="w-4 h-4" />Email Store
                  </a>
                )}
              </div>

              {/* Sold by */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/40 text-sm text-muted-foreground">
                <span>
                  Sold by{' '}
                  <Link href={`/store/${store.subdomain}`} className="text-primary font-semibold hover:text-gold transition-colors">
                    {store.name}
                  </Link>
                </span>
                {store.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />{store.city}{store.country ? `, ${store.country}` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── FAQ ── */}
          <section className="mt-20">
            <h2 className="text-2xl font-bold mb-6 tracking-tight text-foreground">Common Questions About {product.name}</h2>
            <div className="space-y-3 max-w-3xl">
              <FaqItem question={`How much does ${product.name} cost?`} answer={`${product.name} is priced at ${formatPrice(product.price, displayCurrency)} at ${store.name}. ${product.stockQuantity > 0 ? 'It is currently in stock and available for purchase.' : 'It is currently out of stock.'}`} />
              <FaqItem question={`Is ${product.name} available?`} answer={product.stockQuantity > 0 ? `Yes, ${product.name} is currently in stock at ${store.name} with ${product.stockQuantity} unit${product.stockQuantity > 1 ? 's' : ''} available.` : `${product.name} is currently out of stock at ${store.name}. Please check back later or contact the store for availability updates.`} />
              <FaqItem question={`Where can I buy ${product.name}?`} answer={`${product.name} is available from ${store.name}${store.city ? ` in ${store.city}` : ''}${store.country ? `, ${store.country}` : ''}. ${store.phone ? `Contact them at ${store.phone}` : store.email ? `Email them at ${store.email}` : 'Visit their online store'} for purchase inquiries.`} />
            </div>
          </section>

          {/* ── Related Products ── */}
          {relatedProducts.length > 0 && (
            <section className="mt-20">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-accent-foreground" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Related Products</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {relatedProducts.map((p: any) => (
                  <Link key={p.id} href={`/store/${store.subdomain}/products/${p.id}`} className="group">
                    <article className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300">
                      <div className="relative aspect-square bg-secondary/50 overflow-hidden">
                        {p.image ? (
                          <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-[1.05] transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted-foreground/15" />
                          </div>
                        )}
                      </div>
                      <div className="p-3.5">
                        <h4 className="text-sm font-semibold line-clamp-1 text-foreground group-hover:text-primary transition-colors">{p.name}</h4>
                        <p className="text-sm font-bold text-gold mt-1.5">{formatPrice(p.price, p.currency || store.currency)}</p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* ── Footer ── */}
        <footer className="border-t-4 border-primary bg-card py-10 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto text-center">
            <Link href={`/store/${store.subdomain}`} className="inline-flex items-center gap-2 font-bold text-foreground hover:text-primary transition-colors mb-3">
              {store.logoUrl ? (
                <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-muted ring-1 ring-border">
                  <Image src={store.logoUrl} alt={store.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {store.name.charAt(0)}
                </div>
              )}
              {store.name}
            </Link>
            <p className="text-xs text-muted-foreground/60 mt-4">
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

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group bg-card rounded-xl border border-border/60 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
      <summary className="cursor-pointer px-5 py-4 font-medium text-sm flex items-center justify-between hover:bg-accent/50 rounded-xl transition-colors text-foreground">
        {question}
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-open:rotate-90 transition-transform duration-200 shrink-0 ml-3" />
      </summary>
      <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{answer}</div>
    </details>
  );
}
