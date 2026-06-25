import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'SHOPYSH | AI-Powered Commerce for African SMEs',
  description: 'Transform your business with an AI sales assistant, SEO storefront, payments, customer insights, finance tracking, and marketing campaigns — built for African entrepreneurs.',
  openGraph: {
    title: 'SHOPYSH | AI-Powered Commerce for African SMEs',
    description: 'AI sales assistant, SEO storefront, payments, customer insights, finance, and campaigns — all in one platform.',
  },
};

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI Sales Assistant',
    description: 'Your 24/7 sales agent that understands Nigerian English and Pidgin. Handles customer enquiries, takes orders, recommends products, and responds instantly — powered by an embeddable chat widget on your website.',
  },
  {
    icon: '🔍',
    title: 'Get Found Online',
    description: 'Every business gets a fully SEO-optimised storefront at shopysh.com/store/your-name. Your products are indexed by Google and AI search engines, making you discoverable to customers searching online — no extra setup needed.',
  },
  {
    icon: '💳',
    title: 'Accept Payments Instantly',
    description: 'Paystack and Flutterwave are built in. Accept card, bank transfer, and USSD payments with automatic verification and webhook processing. Manual payments (cash/bank) are supported via the access code system.',
  },
  {
    icon: '📊',
    title: 'Smart Customer Insights',
    description: 'AI-powered RFM segmentation automatically classifies your customers as VIP, Active, At Risk, New, or Dormant. Know exactly who your best customers are and who needs re-engagement.',
  },
  {
    icon: '💰',
    title: 'Track Your Money',
    description: 'Income, expenses, invoices, and cash flow tracked in one place. See your actual profit beyond just order revenue — know if your business is truly growing.',
  },
  {
    icon: '📢',
    title: 'Reach Your Customers',
    description: 'Create SMS and Email campaigns targeted to specific customer segments. Send the right message to the right people — VIP rewards, re-engagement offers, or product launches.',
  },
  {
    icon: '📦',
    title: 'Smart Inventory',
    description: 'Track products, categories, and stock levels with automatic low-stock alerts. Multi-currency support (NGN, USD, GHS, KES) built in. Never run out of stock unexpectedly again.',
  },
  {
    icon: '👥',
    title: 'Team Collaboration',
    description: 'Invite team members with role-based access (Admin, Manager, Staff). Control exactly who sees what. Your staff focuses on their tasks while you maintain full oversight.',
  },
];

const PLANS = [
  {
    name: 'Starter',
    price: '₦5,000',
    priceUsd: '$10',
    period: '/month',
    description: 'Perfect for small businesses getting started',
    features: ['1,000 AI conversations/month', 'Up to 100 products', 'SEO storefront', 'Chat widget', '1 user seat', 'Basic analytics', 'Email support'],
    highlighted: false,
  },
  {
    name: 'Business',
    price: '₦15,000',
    priceUsd: '$30',
    period: '/month',
    description: 'For growing businesses that need more power',
    features: ['5,000 AI conversations/month', 'Unlimited products', 'SEO storefront + payments', '5 user seats', 'Advanced analytics & reports', 'CRM & AI segmentation', 'SMS & Email campaigns', 'Finance tracking', 'Priority support'],
    highlighted: true,
  },
  {
    name: 'Premium',
    price: '₦25,000',
    priceUsd: '$50',
    period: '/month',
    description: 'Full power for established businesses',
    features: ['15,000 AI conversations/month', 'Unlimited everything', '10 user seats', 'API access', 'Custom AI training', 'White-label options', 'Dedicated account manager', 'SLA guarantees'],
    highlighted: false,
  },
];

const STATS = [
  { value: '44M+', label: 'African SMEs' },
  { value: '500M+', label: 'Online Shoppers' },
  { value: '70%', label: 'Inquiry Automation' },
  { value: '24/7', label: 'AI Availability' },
];

const TESTIMONIALS = [
  { name: 'Adebayo O.', business: 'Fashion Retailer, Lagos', quote: 'Shopysh handles 80% of my customer inquiries automatically. My sales increased by 40% in the first month!' },
  { name: 'Chioma N.', business: 'Food Business, Abuja', quote: 'The AI understands when customers order in Pidgin! My team can focus on cooking while the bot takes orders.' },
  { name: 'Kwame A.', business: 'Electronics Store, Accra', quote: 'Inventory alerts saved me from stockouts three times. The customer insights help me know exactly who to target with promotions.' },
];

const jade = 'hsl(168,84%,26%)';
const jadeDark = 'hsl(172,72%,18%)';
const gold = 'hsl(40,78%,47%)';

export default function PitchPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md" style={{ background: `linear-gradient(135deg, ${jade}, ${jadeDark})` }}>
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ color: jade }}>SHOPYSH</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/guide" className="text-sm text-gray-500 hover:text-gray-800 hidden sm:inline transition-colors">User Guide</Link>
            <Link href="/login" className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-all shadow-md" style={{ background: jade }}>
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, hsl(168,60%,97%) 0%, hsl(45,33%,98%) 60%, white 100%)` }} />
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: jade }} />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: gold }} />

        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold mb-6 tracking-wide uppercase" style={{ background: 'hsl(168,84%,96%)', borderColor: 'hsl(168,84%,80%)', color: jade }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: jade }} />
              Built for African Entrepreneurs
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6 text-gray-900">
              Your AI-Powered<br />
              <span style={{ color: jade }}>Business Manager</span><br />
              for Africa
            </h1>
            <p className="text-lg md:text-xl text-gray-500 mb-8 max-w-2xl leading-relaxed">
              AI sales assistant, SEO storefront, instant payments, customer intelligence, cash flow tracking, and targeted campaigns —
              all in one platform built for African businesses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all shadow-lg text-lg" style={{ background: jade }}>
                Start Free Trial →
              </Link>
              <Link href="/guide" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all text-lg border-2" style={{ borderColor: jade, color: jade }}>
                View Documentation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-bold" style={{ color: jade }}>{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">The Challenge African SMEs Face</h2>
            <p className="text-lg text-gray-500">
              44 million African SMEs lose sales daily — slow responses, manual inventory, no online presence, and no way to understand their customers.
              Shopysh solves all of this with one intelligent platform.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Everything You Need to Grow</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">One platform to automate operations, delight customers, and increase revenue.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white border hover:shadow-md transition-shadow group">
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="font-semibold text-base mb-2 text-gray-900 group-hover:transition-colors" style={{ color: 'inherit' }}>{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-14 text-gray-900">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl border" style={{ background: 'hsl(168,84%,97%)', borderColor: 'hsl(168,84%,88%)' }}>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => <span key={j} style={{ color: gold }}>★</span>)}
                </div>
                <p className="text-gray-600 italic mb-4 text-sm leading-relaxed">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.business}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-500">Start free, upgrade as you grow. No hidden fees.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {PLANS.map((plan, i) => (
              <div key={i} className={`p-6 rounded-2xl border ${plan.highlighted ? 'text-white shadow-2xl scale-105' : 'bg-white border-gray-200'}`}
                style={plan.highlighted ? { background: `linear-gradient(135deg, ${jade}, ${jadeDark})`, borderColor: jade } : {}}>
                <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                <p className={`text-sm mb-4 ${plan.highlighted ? 'text-white/75' : 'text-gray-500'}`}>{plan.description}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? 'text-white/60' : 'text-gray-400'}`}>{plan.period}</span>
                </div>
                <p className={`text-xs mb-6 ${plan.highlighted ? 'text-white/50' : 'text-gray-400'}`}>({plan.priceUsd}/month)</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`text-sm flex items-start gap-2 ${plan.highlighted ? 'text-white/85' : 'text-gray-500'}`}>
                      <span style={{ color: plan.highlighted ? 'hsl(40,78%,70%)' : jade }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`block text-center py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                  plan.highlighted ? 'bg-white' : 'text-white'
                }`} style={plan.highlighted ? { color: jade } : { background: jade }}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ background: `linear-gradient(135deg, hsl(168,84%,26%), hsl(172,72%,14%))` }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to Transform Your Business?</h2>
          <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
            Join African entrepreneurs who are automating their businesses with AI. Start your free trial today — no credit card required.
          </p>
          <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg" style={{ background: gold, color: 'white' }}>
            Start Your Free Trial →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: jade }}>
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="text-sm font-bold tracking-tight" style={{ color: jade }}>SHOPYSH</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/guide" className="hover:text-gray-700 transition-colors">User Guide</Link>
            <Link href="/login" className="hover:text-gray-700 transition-colors">Login</Link>
            <Link href="/register" className="hover:text-gray-700 transition-colors">Sign Up</Link>
          </div>
          <p className="text-xs text-gray-400">© 2026 Shopysh. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
