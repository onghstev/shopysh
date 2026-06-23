import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Guide | SHOPYSH',
  description: 'Complete user guide for SHOPYSH - Your AI-powered business management platform',
};

const sections = [
  {
    id: 'getting-started',
    title: '1. Getting Started',
    content: [
      {
        heading: 'Creating Your Account',
        text: `Visit the login page and click "Create Account". Enter your full name, email address, business name, and a strong password (minimum 6 characters). You can also sign up instantly using your Google account by clicking "Continue with Google". After registration, you will be redirected to your personalised business dashboard.`,
      },
      {
        heading: 'Logging In',
        text: `Use your email and password to log in, or click the Google button for SSO. If you are a Super Admin, you will be automatically redirected to the Admin Panel. Other users land on the main Dashboard.`,
      },
      {
        heading: 'Dashboard Overview',
        text: `Your dashboard shows a real-time snapshot of your business: total orders, today's revenue, monthly revenue, active products, and customer count. Below the stats you will find a revenue chart for the past 7 days, recent orders, and low-stock alerts. Quick action buttons let you jump to key tasks like adding a product or viewing orders.`,
      },
    ],
  },
  {
    id: 'products',
    title: '2. Products & Categories',
    content: [
      {
        heading: 'Managing Products',
        text: `Navigate to Products from the sidebar. You'll see a searchable, filterable list of all your products with stock status indicators. Click "Add Product" to create a new item — fill in the name, description, price, cost price, SKU, stock quantity, and assign a category. Every product can be toggled active/inactive and featured/unfeatured. Click any product row to edit its details.`,
      },
      {
        heading: 'Categories',
        text: `Go to Categories in the sidebar. Here you can create, edit, and delete product categories. Categories help organise your catalog and make it easier for customers to browse. You can also add categories inline when creating a new product by clicking the "+" button next to the category dropdown. Deleting a category that has products assigned is blocked with a warning.`,
      },
      {
        heading: 'Inventory Alerts',
        text: `Each product has a "Low Stock Threshold" field. When stock drops to or below this number, the product will appear in your dashboard alerts and in the notification bell. This helps you restock before running out.`,
      },
    ],
  },
  {
    id: 'orders',
    title: '3. Order Management',
    content: [
      {
        heading: 'Viewing Orders',
        text: `The Orders page shows all orders in a tabular format with order number, customer name, status, payment status, total amount, and date. Use the search bar and status filter to narrow results. Click any order to view its full details.`,
      },
      {
        heading: 'Order Lifecycle',
        text: `Orders move through these stages: Pending → Confirmed → Processing → Ready for Pickup / Out for Delivery → Delivered → Completed. You can also Cancel or Refund orders. From the order detail page, use the status dropdown to advance an order through each stage. Each status change is timestamped for audit purposes.`,
      },
      {
        heading: 'Order Details',
        text: `The detail page shows the complete order: line items with quantities and prices, customer contact information, delivery address, payment status, and a timeline of status changes. You can update the status directly from this page.`,
      },
    ],
  },
  {
    id: 'customers',
    title: '4. Customer Relationship Management',
    content: [
      {
        heading: 'Customer List',
        text: `The Customers page displays all your customers with name, phone, email, total orders, and lifetime value. Click any customer to see their detailed profile.`,
      },
      {
        heading: 'Customer Profiles',
        text: `Each customer detail page shows their contact information, business metrics (total orders, average order value, lifetime value), assigned tags, and an activity timeline showing all their interactions — orders placed, conversations, and tag changes.`,
      },
      {
        heading: 'Tags & Segmentation',
        text: `Add tags to customers (e.g., "VIP", "Wholesale", "New") to categorise them. The system also performs automatic RFM (Recency, Frequency, Monetary) segmentation to classify customers as VIP, Active, At Risk, New, or Dormant — helping you target the right groups with marketing campaigns.`,
      },
    ],
  },
  {
    id: 'payments',
    title: '5. Payments',
    content: [
      {
        heading: 'Payment Dashboard',
        text: `View all payment transactions with summary cards for total, successful, and pending payments. Filter by status and payment gateway (Paystack or Flutterwave).`,
      },
      {
        heading: 'Payment Gateways',
        text: `SHOPYSH supports Paystack and Flutterwave for accepting payments. Configure your API keys in the environment settings. The system handles payment initialization, verification, and webhook processing automatically. A demo mode is available when API keys are not configured.`,
      },
    ],
  },
  {
    id: 'conversations',
    title: '6. Conversations & AI Assistant',
    content: [
      {
        heading: 'Conversations',
        text: `The Conversations page shows all customer interactions via the chat widget. Each conversation displays the customer name, last message, status (active/closed), and intent detected by the AI. Escalated conversations are flagged for human attention.`,
      },
      {
        heading: 'AI Assistant',
        text: `Test your AI assistant from the AI Assistant page. Type messages to see how the AI responds to customer inquiries about products, pricing, and orders. The AI is context-aware — it knows your product catalog, pricing, and business information. It supports Nigerian English and Pidgin.`,
      },
      {
        heading: 'Chat Widget Setup',
        text: `Go to Chat Widget in the sidebar to get your embeddable chat widget code. Simply copy the script tag and paste it into your website. The widget connects customers directly to your AI assistant — no API keys or complex setup required.`,
      },
    ],
  },
  {
    id: 'campaigns',
    title: '7. Marketing Campaigns',
    content: [
      {
        heading: 'Creating Campaigns',
        text: `Navigate to Campaigns from the sidebar. Click "Create Campaign" to set up a new broadcast message. Enter a campaign name, the message template, and optionally target a specific customer segment (e.g., VIP, Active, New). Campaigns start in "Draft" status.`,
      },
      {
        heading: 'Sending Campaigns',
        text: `From the campaigns list, click the send button on a draft campaign to dispatch it. The system will send messages to targeted customers and track delivery stats (sent, delivered, failed counts).`,
      },
    ],
  },
  {
    id: 'analytics',
    title: '8. Analytics & Reports',
    content: [
      {
        heading: 'Analytics Dashboard',
        text: `The Analytics page provides a comprehensive view of your business performance. View revenue, orders, customer metrics, AI conversation metrics, and more. Filter by time period (7, 30, or 90 days). Charts visualise trends over time.`,
      },
      {
        heading: 'Reports & Export',
        text: `Go to Reports in the sidebar to download CSV exports of your business data. Available reports include: Orders Report (with customer details and line items), Product Inventory (pricing and stock levels), Customer Database (contact info and lifetime value), and Payment Transactions. Use the optional date range filter for time-bound exports.`,
      },
    ],
  },
  {
    id: 'team',
    title: '9. Team Management',
    content: [
      {
        heading: 'Adding Team Members',
        text: `As an Admin, go to Team in the sidebar. Click "Add Member" to invite colleagues. Enter their name, email, a temporary password, and assign a role: Staff (view/manage daily tasks) or Manager (full access except billing). Team members log in with the credentials you create for them.`,
      },
      {
        heading: 'Managing Roles',
        text: `From the team list, use the action menu (three dots) on any staff or manager to: promote/demote their role, activate/deactivate their account, or remove them entirely. Admins cannot be modified by other admins for security.`,
      },
    ],
  },
  {
    id: 'settings',
    title: '10. Settings',
    content: [
      {
        heading: 'Business Profile',
        text: `Update your business name, email, phone, description, address, city, and country. This information is used across the platform and in customer-facing communications.`,
      },
      {
        heading: 'AI Configuration',
        text: `Customise your AI assistant\'s welcome message, personality/tone, and toggle auto-reply on or off. The AI adapts to your preferences to match your brand voice.`,
      },
      {
        heading: 'Billing',
        text: `View your current subscription plan (Starter, Business, or Premium), usage statistics for the current month, and available plans for upgrade. Plans differ in AI conversation limits, product limits, user seats, and advanced features like API access.`,
      },
    ],
  },
  {
    id: 'admin',
    title: '11. Platform Administration (Super Admin Only)',
    content: [
      {
        heading: 'Admin Panel',
        text: `Super Admin users see an "Admin Panel" link in the sidebar. The panel shows platform-wide statistics: total companies, users, revenue, and active tenant rates. Below is a searchable table of all registered tenants/companies with the ability to activate or deactivate any business.`,
      },
      {
        heading: 'Tenant Management',
        text: `Search for any business by name. Use the toggle switches to activate or deactivate tenant accounts. Deactivated tenants cannot log in until reactivated.`,
      },
    ],
  },
  {
    id: 'technical',
    title: '12. Technical Reference',
    content: [
      {
        heading: 'Architecture',
        text: `SHOPYSH is a modern web application with a multi-tenant architecture. Each business gets isolated data storage while sharing the same application infrastructure. The platform uses server-side rendering for fast page loads, JWT-based authentication, and real-time notifications.`,
      },
      {
        heading: 'API Endpoints',
        text: `All data is accessed through RESTful API routes: /api/products, /api/orders, /api/customers, /api/payments, /api/campaigns, /api/analytics, /api/team, /api/reports/export, /api/notifications, /api/settings/*, /api/admin/*. All endpoints require authentication via session cookies. Admin endpoints require SUPER_ADMIN or TENANT_ADMIN roles.`,
      },
      {
        heading: 'Authentication',
        text: `The platform supports email/password login and Google Single Sign-On (SSO). Sessions are maintained via secure JWT tokens with 7-day expiry. Passwords are hashed with bcrypt. Multi-tenant isolation is enforced at the API layer — every query is scoped to the authenticated user's tenant.`,
      },
      {
        heading: 'Payment Webhooks',
        text: `Payment notifications are received at /api/payments/webhook/paystack and /api/payments/webhook/flutterwave. Both endpoints verify webhook signatures for security. Paystack uses HMAC-SHA512 signature verification, while Flutterwave uses a shared webhook hash.`,
      },
      {
        heading: 'Chat Widget Integration',
        text: `The embeddable chat widget is available at /api/widget/[tenantId]/config. Tenants can embed the widget on their website with a single script tag. Incoming messages are processed through the AI assistant, which uses the business's product catalog and settings to generate contextual responses.`,
      },
      {
        heading: 'Data Security',
        text: `All data is stored in a secure database with row-level tenant isolation. Sensitive fields (passwords, tokens) are encrypted. API routes enforce role-based access control. CSRF protection is built-in via NextAuth. Session cookies are HttpOnly and Secure in production.`,
      },
    ],
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div>
              <h1 className="font-bold text-lg">SHOPYSH</h1>
              <p className="text-xs text-muted-foreground">User Guide & Documentation</p>
            </div>
          </div>
          <a href="/login" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
            Go to App →
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* TOC */}
        <div className="mb-12 p-6 rounded-2xl bg-white dark:bg-gray-900 border shadow-sm">
          <h2 className="font-bold text-xl mb-4">Table of Contents</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {sections.map(s => (
              <a key={s.id} href={`#${s.id}`} className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map(section => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="font-bold text-2xl mb-6 text-emerald-800 dark:text-emerald-300 border-b pb-3">{section.title}</h2>
              <div className="space-y-6">
                {section.content.map((item, i) => (
                  <div key={i} className="pl-4 border-l-2 border-emerald-200 dark:border-emerald-800">
                    <h3 className="font-semibold text-lg mb-2">{item.heading}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>SHOPYSH User Guide • Last updated: May 2026</p>
          <p className="mt-1">For support, contact your platform administrator.</p>
        </div>
      </div>
    </div>
  );
}
