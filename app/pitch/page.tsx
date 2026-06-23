import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'SHOPYSH | AI-Powered Business Management for African SMEs',
  description: 'Transform your business with AI-powered chat automation, smart inventory, CRM, payments, and analytics — built for African entrepreneurs.',
  openGraph: {
    title: 'SHOPYSH | AI-Powered Business Management',
    description: 'Transform your business with AI-powered chat automation, smart inventory, CRM, payments, and analytics.',
  },
};

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI Chat Assistant',
    description: 'Your 24/7 sales agent that understands Nigerian English, Pidgin, and handles customer inquiries, takes orders, and recommends products — powered by an embeddable chat widget.',
  },
  {
    icon: '📦',
    title: 'Smart Inventory Management',
    description: 'Track products, categories, stock levels, and get automatic low-stock alerts. Multi-currency support (NGN, USD, GHS, KES) built in.',
  },
  {
    icon: '📊',
    title: 'Business Analytics',
    description: 'Real-time dashboards showing revenue trends, top products, customer segments, AI performance metrics, and exportable CSV reports.',
  },
  {
    icon: '💳',
    title: 'Integrated Payments',
    description: 'Accept payments via Paystack and Flutterwave with automatic webhook processing, transaction tracking, and payment verification.',
  },
  {
    icon: '👥',
    title: 'CRM & Customer Intelligence',
    description: 'Automatic customer segmentation (VIP, Active, At Risk), tagging, activity timelines, and lifetime value tracking. Know your customers deeply.',
  },
  {
    icon: '📢',
    title: 'Marketing Campaigns',
    description: 'Create and send targeted broadcast campaigns to specific customer segments. Track delivery and engagement metrics.',
  },
  {
    icon: '👨\u200d💼',
    title: 'Team Collaboration',
    description: 'Invite team members with role-based access (Admin, Manager, Staff). Control who sees what with granular permissions.',
  },
  {
    icon: '🌐',
    title: 'Multi-Tenant Platform',
    description: 'Each business gets its own isolated workspace with custom branding. Perfect for agencies managing multiple clients.',
  },
];

const PLANS = [
  {
    name: 'Starter',
    price: '\u20a65,000',
    priceUsd: '$10',
    period: '/month',
    description: 'Perfect for small businesses getting started',
    features: ['1,000 AI conversations/month', 'Up to 100 products', 'Chat widget included', '1 user seat', 'Basic analytics', 'Email support'],
    highlighted: false,
  },
  {
    name: 'Business',
    price: '\u20a615,000',
    priceUsd: '$30',
    period: '/month',
    description: 'For growing businesses that need more power',
    features: ['5,000 AI conversations/month', 'Unlimited products', 'Chat widget included', '5 user seats', 'Advanced analytics & reports', 'Payment integration', 'CRM & segmentation', 'Marketing campaigns', 'Priority support'],
    highlighted: true,
  },
  {
    name: 'Premium',
    price: '\u20a625,000',
    priceUsd: '$50',
    period: '/month',
    description: 'Full power for established businesses',
    features: ['15,000 AI conversations/month', 'Unlimited everything', 'Chat widget included', '10 user seats', 'API access', 'Custom AI training', 'White-label options', 'Dedicated account manager', 'SLA guarantees'],
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
  { name: 'Adebayo O.', business: 'Fashion Retailer, Lagos', quote: 'SHOPYSH handles 80% of my customer inquiries automatically. My sales increased by 40% in the first month!' },
  { name: 'Chioma N.', business: 'Food Business, Abuja', quote: 'The AI understands when customers order in Pidgin! My team can focus on cooking while the bot takes orders.' },
  { name: 'Kwame A.', business: 'Electronics Store, Accra', quote: 'Inventory alerts saved me from stockouts three times this month. The analytics help me make better buying decisions.' },
];

export default function PitchPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-bold text-lg">SHOPYSH</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/guide" className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline">User Guide</Link>
            <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm">Get Started Free</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-white dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-gray-950" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-200/20 dark:bg-teal-800/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Built for African Entrepreneurs
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Your AI-Powered
              <span className="text-emerald-600 dark:text-emerald-400"> Business Manager</span>
              <br />for Africa
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
              Automate customer service, process orders, manage inventory, accept payments, and grow your business —
              all powered by AI that understands your customers and speaks their language.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/25 text-lg">
                Start Free Trial →
              </Link>
              <Link href="/guide" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-all text-lg">
                View Documentation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-emerald-600 dark:text-emerald-400">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Challenge African SMEs Face</h2>
            <p className="text-lg text-muted-foreground">
              44 million African SMEs lose sales daily because they can't respond to customer messages fast enough,
              manage inventory manually, and lack the tools to understand their customers. SHOPYSH solves all of this
              with one intelligent platform.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Grow</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">One platform to automate your business operations, delight your customers, and increase revenue.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white dark:bg-gray-800 border shadow-sm hover:shadow-md transition-shadow">
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
                <p className="text-muted-foreground italic mb-4">"{t.quote}"</p>
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.business}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-muted-foreground">Start free, upgrade as you grow. No hidden fees.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {PLANS.map((plan, i) => (
              <div key={i} className={`p-6 rounded-2xl border ${plan.highlighted ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-600/20 scale-105' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                <p className={`text-sm mb-4 ${plan.highlighted ? 'text-emerald-100' : 'text-muted-foreground'}`}>{plan.description}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? 'text-emerald-200' : 'text-muted-foreground'}`}>{plan.period}</span>
                </div>
                <p className={`text-xs mb-6 ${plan.highlighted ? 'text-emerald-200' : 'text-muted-foreground'}`}>({plan.priceUsd}/month)</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`text-sm flex items-start gap-2 ${plan.highlighted ? 'text-emerald-50' : 'text-muted-foreground'}`}>
                      <span className={plan.highlighted ? 'text-emerald-200' : 'text-emerald-500'}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`block text-center py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                  plan.highlighted
                    ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-lg text-muted-foreground mb-8">Join thousands of African entrepreneurs who are automating their businesses with AI. Start your free trial today — no credit card required.</p>
          <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/25 text-lg">
            Start Your Free Trial →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">T</span>
            </div>
            <span className="text-sm font-semibold">SHOPYSH</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/guide" className="hover:text-foreground">User Guide</Link>
            <Link href="/login" className="hover:text-foreground">Login</Link>
            <Link href="/register" className="hover:text-foreground">Sign Up</Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Shopysh. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
