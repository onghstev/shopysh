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
      {
        heading: 'Your Store URL',
        text: `Every Shopysh business gets a unique public storefront URL. To find yours, go to Settings → Business Profile. At the top of the profile card you will see a highlighted box showing your Store URL (e.g. https://www.shopysh.com/store/yourbusiness). Click the Copy button to copy it to your clipboard, or click the Open button to preview your live store in a new tab. Share this URL with your customers so they can browse and order online.`,
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
        heading: 'Product Images',
        text: `Each product can have up to 4 photos. Images are uploaded directly to your store — no external storage account is needed. To upload: open the product detail page, then click the dashed "Add Image" tile in the Product Images card. Select a JPEG, PNG, WebP, or GIF file (maximum 5 MB per image). The image uploads immediately. The first image uploaded is automatically set as the primary (main display) image, marked with a gold "Primary" badge. Hover over any image to reveal a star button (set as primary) or an X button (remove). The upload tile disappears once 4 images have been added.`,
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
        heading: 'Customer IDs',
        text: `Every customer is automatically assigned a unique Customer ID in the format CUST-0001, CUST-0002, and so on. This ID appears in the first column of the customer list and is especially useful when two customers share the same name. You can search for a customer using their Customer ID, name, phone number, or email address.`,
      },
      {
        heading: 'Customer List',
        text: `The Customers page displays all customers with their Customer ID, name, phone, segment, total orders, lifetime value, and last active date. Click any row to open the customer detail page.`,
      },
      {
        heading: 'Adding a Customer',
        text: `Click "Add Customer" and fill in the form. Phone number is the only required field — it is used as the unique identifier per tenant. Name, email, location, and segment (New / Regular / VIP) are optional. A Customer ID is assigned automatically. After saving, the customer list refreshes in the background while keeping existing records visible — they never disappear during a save or refresh.`,
      },
      {
        heading: 'Customer Profiles',
        text: `Each customer detail page shows contact information, business metrics (total orders, average order value, lifetime value), assigned segment, and an activity timeline of all interactions — orders, conversations, and changes.`,
      },
      {
        heading: 'Storefront & Finance Customers Are Unified',
        text: `If a customer registers on your public storefront using the same phone number you already have in your CRM, the records are merged — no duplicate is created. Finance customers (added via the Finance module) and storefront customers share the same list.`,
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
    title: '7. Finance Module',
    content: [
      {
        heading: 'Overview',
        text: `The Finance module is a full double-entry bookkeeping system built for African SMEs. It covers the General Ledger (GL), journal entries, cash and bank management, accounts receivable/payable, vendor management, and financial reporting. Access it by clicking "Finance" in the left sidebar. The Finance section has its own sub-navigation: Overview, Chart of Accounts, Journal Entries, Cash Book, Bank Book, Sales Book, Purchase Book, Debtors/AR, Creditors/AP, Customers, Vendors, Statements, and a Reports submenu containing Trial Balance, Income Statement, and Balance Sheet.`,
      },
      {
        heading: 'Finance Command Center (Overview)',
        text: `The Finance dashboard shows six KPI cards: Revenue (YTD), Expenses (YTD), Net Profit (with margin %), Cash Balance, Receivables, and Payables. Below the cards is a 6-month Revenue vs Expenses bar chart and a list of the 4 most recent journal entries. A quick-access grid provides one-click shortcuts to every Finance sub-section. The bottom of the page shows counts for GL Accounts, Vendors, and Draft journal entries — each is a clickable link.`,
      },
      {
        heading: 'Chart of Accounts',
        text: `The Chart of Accounts (CoA) is the master list of every account in your bookkeeping system. Accounts are organised in five types: ASSET (things you own), LIABILITY (things you owe), EQUITY (owner's capital), INCOME (revenue), and EXPENSE (costs). Accounts are displayed in a hierarchy — parent accounts at the top level with child accounts indented below. Each row shows the account code, name, type badge, and current balance. Use the Type filter buttons and Search bar to locate accounts quickly.`,
      },
      {
        heading: 'Setting Up Your Chart of Accounts',
        text: `New businesses should start with a template. Click "Choose Template" to see three pre-built options: Nigerian Standard (65 accounts, follows standard Nigerian accounting practice), Simple (25 accounts, for very small businesses), and Retail (65 accounts, optimised for product-based retail). Click "Use This" on your preferred template. If your CoA already has entries, a confirmation dialog asks whether to replace them — click OK to proceed or Cancel to keep your current accounts. Warning: replacing a CoA deletes all existing accounts and balances; only do this before recording real transactions. To add individual accounts manually, click "Add Account", fill in the Account Code, Type, Name, optional Parent Account, optional Opening Balance, and optional Description, then click Save. Note: Account Code and Type cannot be changed after saving.`,
      },
      {
        heading: 'Journal Entries',
        text: `Journal entries are the foundation of double-entry accounting. Every financial event is recorded with at least one debit line and one equal credit line. The journal list shows Entry #, Date, Description, Type, Status badge (Draft = amber, Posted = green, Reversed = red), and total Debit amount. Use the Status filter and Search bar to find entries. Draft entries have not yet affected account balances and can be edited or deleted. Posted entries are final and locked — they affect balances and cannot be edited, only reversed. To create an entry: click "New Journal", fill in the Description, Date, Entry Type (14 types available including General Journal, Sales Invoice, Purchase Invoice, Expense, Payroll, etc.), optional Reference and Notes, then add at least two lines in the Lines table (Account, Description, Debit or Credit amount). The balance indicator at the bottom of the lines table must show equal Debit and Credit totals before you can post. Click "Save as Draft" to save without posting, or "Post Entry" to post immediately. To undo a posted entry, open it and click Reverse — the system creates a new entry with all debits and credits swapped.`,
      },
      {
        heading: 'Cash Book',
        text: `The Cash Book records all physical cash transactions through your Cash on Hand account. At the top, four summary cards show Opening Balance, Total Receipts (green), Total Payments (red), and Closing Balance for the selected period. Use the From and To date pickers to change the period (defaults to the current calendar month). The transaction table shows Date, Entry #, Description, Receipts column (green), Payments column (red), and Running Balance. The first and last rows are the Opening and Closing Balance rows (highlighted). To record a transaction, click "Record Transaction", choose Receipt (money in) or Payment (money out), fill in the Date, Amount, Description, optional Customer/Vendor link, and the required Contra Account (the other side of the double-entry — e.g. select your Sales account for a cash sale). Click Save. The transaction is posted immediately.`,
      },
      {
        heading: 'Bank Book',
        text: `The Bank Book works identically to the Cash Book but records transactions through your bank account(s). If you have multiple bank accounts in your Chart of Accounts, use the Bank Account dropdown at the top to switch between them. All features — summary cards, date filters, transaction table, recording transactions, and CSV export — are the same as the Cash Book.`,
      },
      {
        heading: 'Sales Book',
        text: `The Sales Book is a chronological record of all sales transactions: invoices raised (credit sales), cash receipts collected, and credit notes issued. Three summary cards show Total AR/Debit, Total Sales/Credit, and entry count. Transaction type badges are colour-coded: Invoice (green), Receipt (blue), Credit Note (amber). To record a sale, click "Record Sale", fill in Date, optional Customer (the customer lookup shows the Customer ID badge [CUST-XXXX] beside the name), optional Invoice Reference, Description, Amount excl. VAT, optional VAT Amount, and select a Payment Method: Invoice/AR (credit sale), Cash, or Bank Transfer. A subtotal box confirms the total including VAT before you save.`,
      },
      {
        heading: 'Purchase Book',
        text: `The Purchase Book records all purchases from suppliers: invoices received, payments made, and debit notes issued. Transaction type badges: Purchase Invoice (orange), Payment (blue), Debit Note (violet). To record a purchase, click "Record Purchase", fill in Date, optional Vendor (the vendor lookup shows the Vendor Code badge [VND-XXXX] beside the name), optional Reference (e.g. supplier's invoice number), Description, Amount excl. VAT, optional VAT Amount, required Expense Account (select the GL expense account this cost belongs to — only Expense-type accounts are listed), and Payment Method: On Credit/AP, Cash, or Bank Transfer.`,
      },
      {
        heading: 'Receivables (Accounts Receivable / Debtors)',
        text: `The Receivables page is your AR Aging Report — it shows who owes you money and how overdue each debt is. Five summary cards at the top break down the total outstanding by age: Total AR, Current (0–30 days), 31–60 Days (amber), 61–90 Days (orange), and 90+ Days (red). The table shows one row per customer with their outstanding balance split across the same age buckets. A Totals row sums each column. Click "Export CSV" to download the aging report.`,
      },
      {
        heading: 'Payables (Accounts Payable / Creditors)',
        text: `The Payables page is your AP Aging Report — it shows what you owe to suppliers. The layout mirrors Receivables: five age-bucket summary cards, one row per vendor, a Totals row, and a CSV export. Age buckets are colour-coded the same way: orange for 31–90 days, red for 90+ days.`,
      },
      {
        heading: 'Vendors & Suppliers',
        text: `The Vendors page manages your suppliers. Each vendor is automatically assigned a unique Vendor Code in the format VND-0001, VND-0002, etc. Vendors are displayed as cards in a grid showing the vendor name, Vendor Code badge, email, phone, city, country, payment terms (days), and invoice count. To add a vendor, click "Add Vendor" and fill in: Vendor Name (required), Email, Phone, City, Country (defaults to Nigeria), Tax ID (TIN), Bank Name, Account Number, Payment Terms (days), Credit Limit, Address, and Notes. A Vendor Code is assigned automatically. Hover over a card to reveal Edit and Delete buttons.`,
      },
      {
        heading: 'Financial Statements',
        text: `The Statements page gives a comprehensive Profit & Loss summary with flexible period selection. Toggle between Monthly (pick month + year), Yearly (pick year), or Custom (pick From and To dates), then click Generate. Four KPI cards show Total Income, Total Expenses, Net Profit/Loss, and Profit Margin. Additional metrics show Order Revenue, Cash Sales, and Bank Deposits. Two side-by-side cards show horizontal bar charts breaking down income and expenses by category. Below them is a full P&L statement table with Revenue section, Expenses section, and a bold Net Profit/(Loss) row at the bottom.`,
      },
      {
        heading: 'Reports — Accessing the Reports Submenu',
        text: `In the Finance sidebar, click "Reports" to expand a submenu containing three report pages: Trial Balance, Income Statement, and Balance Sheet. The submenu auto-expands whenever you are on any of these report pages.`,
      },
      {
        heading: 'Reports — Trial Balance',
        text: `The Trial Balance verifies that your books are in balance (total debits must equal total credits across all accounts). Set a From and To date range (defaults to 1 January of the current year to today) and click Generate. A banner at the top confirms whether your books are balanced (green tick) or out of balance (red alert with the difference amount). The table shows every GL account with Code, Account Name (indented to show hierarchy), Type badge, Period Debit, Period Credit, DR Balance, and CR Balance columns. A Totals row sums all columns. Run the Trial Balance at the end of every month before preparing financial statements — if it is out of balance, locate and correct the discrepancy in Journal Entries before proceeding. Click "Export CSV" to download.`,
      },
      {
        heading: 'Reports — Income Statement',
        text: `The Income Statement (Profit & Loss) summarises business performance over a period. Set From and To dates and click Generate. Four KPI cards show Total Revenue, Gross Profit (with gross margin %), Operating Expenses, and Net Profit (with net margin %). Cards are green when positive and red when negative. The full statement is presented in three sections: (1) Revenue — each income account and its total, with a TOTAL REVENUE row. (2) Cost of Sales — only appears if you have COGS accounts; shows a GROSS PROFIT line. (3) Operating Expenses — all expense accounts with a TOTAL OPERATING EXPENSES row. The final NET PROFIT/(LOSS) row appears in bold with a green or red background and the profit margin percentage. Click "Export CSV" to download.`,
      },
      {
        heading: 'Reports — Balance Sheet',
        text: `The Balance Sheet (Statement of Financial Position) shows what your business owns (assets) and owes (liabilities + equity) at a specific date. The fundamental equation must hold: Assets = Liabilities + Equity. Set the "As of Date" (defaults to today) and click Generate. A banner confirms whether the balance sheet balances (green) or is out of balance (red, with the difference). Three sections: (1) Assets (blue header) — all asset accounts and balances, TOTAL ASSETS at bottom. (2) Liabilities (red header) — all liability accounts, TOTAL LIABILITIES at bottom. (3) Equity (violet header) — equity accounts plus Current Year Net Income pulled from the Income Statement, TOTAL EQUITY at bottom. A final TOTAL LIABILITIES + EQUITY row must equal Total Assets. Click "Export CSV" to download.`,
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
        heading: 'Business Profile & Store URL',
        text: `Update your business name, email, phone, description, address, city, and country. At the top of the profile card you will see your Store URL in a highlighted box — use the Copy button to copy the link or the Open button to preview your live storefront. The default currency (Nigerian Naira NGN or US Dollar USD) is also set here and applies to all financial records, invoices, and reports.`,
      },
      {
        heading: 'AI Configuration',
        text: `Customise your AI assistant's name, welcome message, personality/tone, and toggle auto-reply on or off.`,
      },
      {
        heading: 'Billing & Subscription',
        text: `View your current subscription plan (Starter, Business, or Premium), usage statistics for the current month, and available plans for upgrade. Plans differ in AI conversation limits, product limits, user seats, storage allowance (measured in MB), and advanced features like API access.`,
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
        heading: 'Tenants & Store Links',
        text: `The Tenants tab lists every business workspace on the platform. Each tenant row shows business name, email, subscription plan badge, status (Active/Inactive), user count, product count, and their subdomain. The subdomain is a clickable link — click it to open that tenant's live storefront in a new tab. Use the Search bar (name, email, or subdomain) and Status filter to find specific tenants.`,
      },
      {
        heading: 'Subscription Plans',
        text: `The Plans tab lets you create and edit the subscription plans offered on the platform. Each plan card shows the plan name, monthly and yearly price, storage limit (in MB), and feature list. To edit: click Edit on the plan card, adjust the fields including the Storage (MB) limit, and click Save. Storage is measured in megabytes — for reference, 1,024 MB equals 1 GB.`,
      },
      {
        heading: 'Access Codes',
        text: `Go to Admin → Access Codes to generate secure onboarding codes for tenants who paid via cash or bank transfer. Click "Generate Code", select the subscription plan and billing cycle (monthly or yearly), optionally set an expiry period (days) and a note (e.g. the tenant's business name), then click Generate. The system produces a unique code in the format SHP-XXXX-XXXX-XXXX. Copy and share it with the tenant. Codes are single-use — once a tenant completes onboarding with the code it is automatically marked as used. The table shows all codes with their status (Active, Used, Expired) and a copy button for active codes.`,
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
