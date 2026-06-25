import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Guide | SHOPYSH',
  description: 'Complete user guide for SHOPYSH — AI-powered commerce platform for African SMEs',
};

const sections = [
  {
    id: 'getting-started',
    title: '1. Getting Started',
    content: [
      {
        heading: 'Creating Your Account',
        text: `Visit the login page and choose your signup method. Option A — Standard: click "Create one free", enter your name, email, business name, and a strong password (minimum 8 characters). Option B — Google SSO: click "Continue with Google" to sign up instantly with your Google account. Option C — Secure Code: if you paid via cash or bank transfer, click "Sign up with secure code", enter the code provided by the Shopysh team, then create your account — your subscription plan is activated automatically, no payment step required. After registration you will be guided through the onboarding flow.`,
      },
      {
        heading: 'Onboarding Flow',
        text: `After signing up you are taken through a short setup: (1) Business Info — enter your business name, industry, phone, email, and address. (2) Choose Plan — select Starter, Business, or Premium (monthly or yearly). If you used a secure code this step shows your pre-activated plan. (3) Payment Method — choose Pay Online (Paystack/Flutterwave) or Bank Transfer; skipped entirely when using a secure code. (4) Confirm — review your selections and complete setup. You are then redirected to your dashboard.`,
      },
      {
        heading: 'Logging In',
        text: `Use your email and password or click "Continue with Google". If you are a Super Admin you are redirected to the Admin Panel; all other users land on the main Dashboard.`,
      },
      {
        heading: 'Dashboard Overview',
        text: `Your dashboard shows a real-time snapshot: total orders, today's revenue, monthly revenue, active products, and customer count. Below you'll find a 7-day revenue chart, recent orders, and low-stock alerts. Quick-action buttons let you jump to key tasks like adding a product or viewing orders.`,
      },
    ],
  },
  {
    id: 'storefront',
    title: '2. Your Online Storefront',
    content: [
      {
        heading: 'Public Storefront URL',
        text: `Every Shopysh business gets a public storefront at shopysh.com/store/your-subdomain. This page is SEO-optimised — product names, descriptions, and categories are indexed by Google and AI search engines, making your products discoverable to people searching online.`,
      },
      {
        heading: 'Storefront Features',
        text: `The storefront displays your logo, store description, product catalog with categories, prices, and images. Customers can browse products, filter by category, and view individual product pages. Each product page shows the full description, price, stock availability, and category.`,
      },
      {
        heading: 'Customer Accounts on Storefront',
        text: `Customers can create accounts on your storefront using phone/password or Google Sign-In. Once logged in they can view their order history and track order statuses. Customer logins on your storefront are separate from your business login.`,
      },
    ],
  },
  {
    id: 'products',
    title: '3. Products & Categories',
    content: [
      {
        heading: 'Managing Products',
        text: `Navigate to Products from the sidebar. You'll see a searchable, filterable list of all your products with stock status indicators. Click "Add Product" to create a new item — fill in the name, description, price, cost price, SKU, stock quantity, and assign a category. Every product can be toggled active/inactive and featured/unfeatured.`,
      },
      {
        heading: 'Categories',
        text: `Go to Categories in the sidebar to create, edit, and delete product categories. Categories organise your catalog and appear as filter tabs on your storefront. You can add categories inline when creating a product by clicking the "+" button next to the category dropdown.`,
      },
      {
        heading: 'Inventory Alerts',
        text: `Each product has a "Low Stock Threshold" field. When stock drops to or below this number, the product appears in your dashboard alerts and notification bell, prompting you to restock.`,
      },
    ],
  },
  {
    id: 'orders',
    title: '4. Order Management',
    content: [
      {
        heading: 'Viewing Orders',
        text: `The Orders page shows all orders in a table with order number, customer name, status, payment status, total amount, and date. Use the search bar and status filter to narrow results. Click any order to view its full details.`,
      },
      {
        heading: 'Order Lifecycle',
        text: `Orders move through these stages: Pending → Confirmed → Processing → Ready for Pickup / Out for Delivery → Delivered → Completed. You can also Cancel or Refund orders. From the order detail page, use the status dropdown to advance an order. Each status change is timestamped.`,
      },
      {
        heading: 'Order Details',
        text: `The detail page shows the complete order: line items with quantities and prices, customer contact information, delivery address, payment status, and a timeline of status changes.`,
      },
    ],
  },
  {
    id: 'customers',
    title: '5. Customer Relationship Management',
    content: [
      {
        heading: 'Customer List',
        text: `The Customers page displays all customers with name, phone, email, total orders, and lifetime value. Click any customer to see their detailed profile.`,
      },
      {
        heading: 'Customer Profiles',
        text: `Each customer detail page shows contact information, business metrics (total orders, average order value, lifetime value), assigned tags, and an activity timeline of all interactions — orders, conversations, and tag changes.`,
      },
      {
        heading: 'AI-Powered Segmentation',
        text: `The system automatically segments customers using RFM analysis (Recency, Frequency, Monetary value): VIP, Active, At Risk, New, or Dormant. This helps you identify your best customers, recover at-risk ones, and target the right group with campaigns. You can also add manual tags (e.g. "Wholesale", "Loyal") to any customer.`,
      },
    ],
  },
  {
    id: 'payments',
    title: '6. Payments',
    content: [
      {
        heading: 'Payment Dashboard',
        text: `View all payment transactions with summary cards for total, successful, and pending payments. Filter by status and gateway (Paystack or Flutterwave).`,
      },
      {
        heading: 'Payment Gateways',
        text: `Shopysh supports Paystack and Flutterwave for online payments. Configure your API keys in Settings. The system handles payment initialisation, verification, and webhook processing automatically. A demo mode is available when API keys are not yet configured.`,
      },
      {
        heading: 'Bank Transfer & Manual Payments',
        text: `For customers paying via cash or bank transfer outside the automated system, you (the platform owner) can generate an Access Code from the admin panel and send it to the tenant. The tenant uses the code on the signup page to bypass payment and complete onboarding with their plan pre-activated.`,
      },
    ],
  },
  {
    id: 'finance',
    title: '7. Finance & Cash Flow',
    content: [
      {
        heading: 'Income & Expenses',
        text: `Track all your business income and expenses in one place. Record income sources (sales, services, other) and expenses (rent, salaries, supplies) with categories, dates, and notes. The finance module gives you a clear picture of your actual cash flow beyond just order revenue.`,
      },
      {
        heading: 'Invoices',
        text: `Create and manage invoices for clients directly from the Finance section. Invoices can be marked as paid, pending, or overdue.`,
      },
      {
        heading: 'Cash Flow Overview',
        text: `The finance dashboard shows total income, total expenses, and net profit for the selected period. Use this to understand the financial health of your business beyond just order volume.`,
      },
    ],
  },
  {
    id: 'conversations',
    title: '8. AI Assistant & Conversations',
    content: [
      {
        heading: 'AI Sales Assistant',
        text: `Your AI assistant responds to customer enquiries 24/7, takes orders, recommends products, and handles FAQs — in English and Nigerian Pidgin. It knows your full product catalog, current prices, and stock levels.`,
      },
      {
        heading: 'Conversations Inbox',
        text: `The Conversations page shows all customer chat interactions. Each conversation displays the customer name, last message, status (active/closed), and the intent detected by AI. Escalated conversations are flagged for your personal attention.`,
      },
      {
        heading: 'Testing the AI',
        text: `Go to AI Assistant in the sidebar to test how your AI responds before customers interact with it. Type messages to simulate customer inquiries about products, pricing, and orders.`,
      },
      {
        heading: 'Chat Widget Setup',
        text: `Go to Chat Widget in the sidebar to get your embeddable script. Copy the tag and paste it into your website. The widget connects customers directly to your AI — no API keys or complex setup needed. Powered by Shopysh.`,
      },
      {
        heading: 'AI Configuration',
        text: `In Settings → AI Configuration, customise your assistant's name, welcome message, and tone (friendly, professional, formal). Toggle auto-reply on or off. These settings shape how the AI represents your brand.`,
      },
    ],
  },
  {
    id: 'campaigns',
    title: '9. Marketing Campaigns',
    content: [
      {
        heading: 'Creating Campaigns',
        text: `Navigate to Campaigns from the sidebar. Click "Create Campaign" to set up a broadcast. Enter a campaign name, message template, and optionally target a specific customer segment (VIP, Active, New, etc.). Campaigns start in "Draft" status.`,
      },
      {
        heading: 'Sending Campaigns',
        text: `From the campaigns list, click the send button on a draft campaign to dispatch it via SMS or Email. The system tracks delivery stats (sent, delivered, failed counts) for each campaign.`,
      },
      {
        heading: 'Segmented Targeting',
        text: `Combine AI segmentation with campaigns to reach the right customers. For example: send a re-engagement offer to "At Risk" customers, or a loyalty reward to "VIP" customers only.`,
      },
    ],
  },
  {
    id: 'analytics',
    title: '10. Analytics & Reports',
    content: [
      {
        heading: 'Analytics Dashboard',
        text: `The Analytics page provides a comprehensive view of your business: revenue trends, order volumes, customer growth, AI conversation metrics, and campaign performance. Filter by time period (7, 30, or 90 days). Charts visualise trends over time.`,
      },
      {
        heading: 'Reports & Export',
        text: `Go to Reports in the sidebar to download CSV exports. Available reports: Orders Report (with customer details and line items), Product Inventory (pricing and stock levels), Customer Database (contact info and lifetime value), and Payment Transactions. Apply a date range filter for time-bound exports.`,
      },
    ],
  },
  {
    id: 'team',
    title: '11. Team Management',
    content: [
      {
        heading: 'Adding Team Members',
        text: `As an Admin, go to Team in the sidebar. Click "Add Member" to invite colleagues. Enter their name, email, a temporary password, and assign a role: Staff (view/manage daily tasks) or Manager (full access except billing).`,
      },
      {
        heading: 'Managing Roles',
        text: `From the team list, use the action menu on any staff or manager to: promote/demote their role, activate/deactivate their account, or remove them. Admins cannot be modified by other admins for security reasons.`,
      },
    ],
  },
  {
    id: 'settings',
    title: '12. Settings',
    content: [
      {
        heading: 'Business Profile',
        text: `Update your business name, email, phone, description, address, city, and country. This information is used across the platform and in customer-facing communications.`,
      },
      {
        heading: 'AI Configuration',
        text: `Customise your AI assistant's name, welcome message, personality/tone, and toggle auto-reply on or off.`,
      },
      {
        heading: 'Billing & Subscription',
        text: `View your current subscription plan (Starter, Business, or Premium), usage statistics for the current month, and available plans for upgrade. Plans differ in AI conversation limits, product limits, user seats, and advanced features like API access.`,
      },
    ],
  },
  {
    id: 'admin',
    title: '13. Platform Administration (Super Admin Only)',
    content: [
      {
        heading: 'Admin Panel',
        text: `Super Admin users see an "Admin Panel" link in the sidebar. The panel shows platform-wide statistics: total companies, users, revenue, and active tenant rates. Below is a searchable table of all registered businesses with the ability to activate or deactivate any account.`,
      },
      {
        heading: 'Access Codes',
        text: `Go to Admin → Access Codes to generate secure onboarding codes for tenants who paid via cash or bank transfer. Select a subscription plan, billing cycle (monthly/yearly), optional expiry period, and an optional note (e.g. tenant's name). The system generates a unique code like SHP-XXXX-XXXX-XXXX. Copy and send it to the tenant. Codes are single-use — once a tenant completes onboarding with the code, it is automatically marked as used. The table shows all codes with their status (Active, Used, Expired) and a copy button for active ones.`,
      },
      {
        heading: 'Tenant Management',
        text: `Search for any business by name. Use the toggle switches to activate or deactivate tenant accounts. Deactivated tenants cannot log in until reactivated.`,
      },
    ],
  },
  {
    id: 'technical',
    title: '14. Technical Reference',
    content: [
      {
        heading: 'Architecture',
        text: `Shopysh is a multi-tenant Next.js 14 application. Each business gets isolated data storage while sharing the same infrastructure. The platform uses server-side rendering for fast page loads, JWT-based authentication, and real-time notifications.`,
      },
      {
        heading: 'Authentication Methods',
        text: `Three signup/login paths: (1) Email + password with bcrypt hashing. (2) Google SSO via NextAuth (for business owner accounts) and a separate custom OAuth flow for storefront customers. (3) Secure Code — single-use access codes generated by the Super Admin for manual-payment tenants. Sessions use secure JWT tokens with 7-day expiry.`,
      },
      {
        heading: 'API Endpoints',
        text: `Key REST API routes: /api/products, /api/orders, /api/customers, /api/payments, /api/campaigns, /api/analytics, /api/finance, /api/team, /api/reports/export, /api/settings/*, /api/admin/*, /api/admin/access-codes, /api/auth/verify-code, /api/store/[slug]/auth/*. All endpoints require authentication via session cookies. Admin endpoints require SUPER_ADMIN role.`,
      },
      {
        heading: 'Payment Webhooks',
        text: `Payment notifications arrive at /api/payments/webhook/paystack and /api/payments/webhook/flutterwave. Both verify webhook signatures — Paystack uses HMAC-SHA512, Flutterwave uses a shared hash.`,
      },
      {
        heading: 'Storefront SEO',
        text: `Each tenant storefront at /store/[subdomain] has server-rendered meta tags including the store name, description, and product data. This makes products indexable by Google and AI search engines without any additional setup by the tenant.`,
      },
      {
        heading: 'Data Security',
        text: `All data is stored in a secure PostgreSQL database with row-level tenant isolation. Sensitive fields (passwords, tokens) are hashed or encrypted. API routes enforce role-based access control. CSRF protection is built-in via NextAuth. Session cookies are HttpOnly and Secure in production.`,
      },
    ],
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(45,33%,98%)] to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, hsl(168,84%,26%), hsl(172,72%,20%))' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight" style={{ color: 'hsl(168,84%,20%)' }}>SHOPYSH</h1>
              <p className="text-xs text-gray-500">User Guide & Documentation</p>
            </div>
          </div>
          <a href="/login" className="text-sm font-semibold px-4 py-1.5 rounded-lg text-white transition-colors" style={{ background: 'hsl(168,84%,26%)' }}>
            Go to App →
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="mb-10 p-6 rounded-2xl text-white" style={{ background: 'linear-gradient(135deg, hsl(168,84%,26%), hsl(172,72%,18%))' }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-amber-300 mb-4 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            AI-Powered Commerce for African SMEs
          </div>
          <h2 className="text-2xl font-bold mb-2">Shopysh User Guide</h2>
          <p className="text-white/80 text-sm max-w-2xl leading-relaxed">
            Everything you need to run your business with Shopysh — from your first login to advanced AI configuration, marketing campaigns, and platform administration.
          </p>
        </div>

        {/* TOC */}
        <div className="mb-12 p-6 rounded-2xl bg-white border shadow-sm">
          <h2 className="font-bold text-lg mb-4" style={{ color: 'hsl(168,84%,22%)' }}>Table of Contents</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
            {sections.map(s => (
              <a key={s.id} href={`#${s.id}`} className="text-sm font-medium px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors" style={{ color: 'hsl(168,84%,26%)' }}>
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map(section => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="font-bold text-xl mb-6 border-b pb-3" style={{ color: 'hsl(168,84%,22%)' }}>{section.title}</h2>
              <div className="space-y-5">
                {section.content.map((item, i) => (
                  <div key={i} className="pl-4 border-l-2 rounded-sm" style={{ borderColor: 'hsl(40,78%,47%)' }}>
                    <h3 className="font-semibold text-base mb-1.5">{item.heading}</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t text-center text-sm text-gray-400">
          <p>Shopysh User Guide • Last updated: June 2026</p>
          <p className="mt-1">For support, contact your platform administrator.</p>
        </div>
      </div>
    </div>
  );
}
