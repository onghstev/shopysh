import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'User Guide | SHOPYSH',
  description: 'Complete user guide for SHOPYSH — AI-powered commerce platform for African SMEs',
};

interface ContentItem {
  heading: string;
  text: string;
  image?: string;
  imageCaption?: string;
}

interface Section {
  id: string;
  title: string;
  content: ContentItem[];
}

const S = '/guide/screenshots'; // base path shorthand

const sections: Section[] = [
  {
    id: 'getting-started',
    title: '1. Getting Started',
    content: [
      {
        heading: 'The Login Page',
        text: 'When you visit Shopysh you land on the login page. On the left side is a branded panel highlighting the platform\'s key features. On the right side is the sign-in form. You can sign in with email and password, or use "Continue with Google" for one-click access. New businesses without an account can click "Create one" or "Sign up with secure code" if they received an Access Code from the Shopysh team.',
        image: `${S}/01-login.jpg`,
        imageCaption: 'The Shopysh login page — email/password or Google SSO',
      },
      {
        heading: 'Onboarding Flow',
        text: 'After signing up you are taken through a short setup: (1) Business Info — enter your business name, industry, phone, email, and address. (2) Choose Plan — select Starter, Business, or Premium (monthly or yearly). If you used a secure code this step shows your pre-activated plan. (3) Payment Method — choose Pay Online (Paystack/Flutterwave) or Bank Transfer; skipped entirely when using a secure code. (4) Confirm — review your selections and complete setup. You are then redirected to your dashboard.',
      },
      {
        heading: 'Your Dashboard',
        text: 'After logging in you land on the main Dashboard. The top shows five summary cards: Total Orders, Today\'s Revenue, Monthly Revenue, Products count, and Customers count. Below is a 7-day Revenue Trend chart and recent orders. The left sidebar is your main navigation — collapsed into groups: MAIN (Dashboard, Products, Orders, Customers, Payments), MARKETING (Campaigns, Analytics), COMMUNICATION (AI Assistant, Conversations, Chat Widget), FINANCE, and RESOURCES (User Guide).',
        image: `${S}/02-dashboard.jpg`,
        imageCaption: 'Main dashboard — KPI cards, revenue chart, and sidebar navigation',
      },
      {
        heading: 'Finding Your Store URL',
        text: 'Every Shopysh business gets a unique public storefront. To find your store URL, go to Settings (bottom of the left sidebar) → open the Business Profile tab. At the very top of the profile card you will see a highlighted green box showing your full Store URL (e.g. https://www.shopysh.com/store/yourbusiness). Use the Copy button to copy it to the clipboard, or the Open button to preview your live store in a new tab.',
        image: `${S}/29-settings.jpg`,
        imageCaption: 'Settings → Business Profile showing your Store URL with copy and open buttons',
      },
    ],
  },
  {
    id: 'storefront',
    title: '2. Your Online Storefront',
    content: [
      {
        heading: 'Public Storefront URL',
        text: 'Every Shopysh business gets a public storefront at shopysh.com/store/your-subdomain. This page is SEO-optimised — product names, descriptions, and categories are indexed by Google and AI search engines, making your products discoverable to people searching online.',
      },
      {
        heading: 'Storefront Features',
        text: 'The storefront displays your logo, store description, product catalog with categories, prices, and images. Customers can browse products, filter by category, and view individual product pages. Each product page shows the full description, price, stock availability, and category.',
      },
      {
        heading: 'Customer Accounts on Storefront',
        text: 'Customers can create accounts on your storefront using phone/password or Google Sign-In. Once logged in they can view their order history and track order statuses. Customer logins on your storefront are separate from your business login. When a storefront customer\'s phone number matches an existing CRM customer record, the accounts are automatically merged — no duplicate is created.',
      },
    ],
  },
  {
    id: 'products',
    title: '3. Products & Categories',
    content: [
      {
        heading: 'Product List',
        text: 'The Products page shows all items in your inventory. Each row displays the product name, SKU, price, stock quantity, category, and active/featured status. Use the Search bar to find products by name or SKU, and the Category filter to narrow the list. Click any product row to open its detail page.',
        image: `${S}/03-products.jpg`,
        imageCaption: 'Products list — searchable inventory with stock status indicators',
      },
      {
        heading: 'Adding a Product',
        text: 'Click "Add Product" to open the product creation form. Fill in the Product Name (required), Description, Price, Cost Price, SKU, Stock Quantity, Low Stock Threshold (triggers an alert when stock drops to this level), and assign a Category. Toggle Active to make it visible on your storefront, and Featured to highlight it. Click Save Product when done.',
        image: `${S}/04-product-new.jpg`,
        imageCaption: 'Add Product form — name, pricing, stock, and category fields',
      },
      {
        heading: 'Product Images — Up to 4 Photos',
        text: 'Each product supports up to 4 images. After saving a product, the Product Images card appears on the detail page. Click the dashed "Add Image" tile to select a file. Accepted formats: JPEG, PNG, WebP, GIF (max 5 MB each). Images upload instantly and are saved directly to your store — no external cloud storage account needed. The first image uploaded becomes the primary display image, marked with a gold "Primary" badge. Hover over any image to reveal a star button (set as primary) or X button (remove). Once 4 images are uploaded the Add Image tile disappears.',
      },
      {
        heading: 'Categories',
        text: 'Go to Categories in the sidebar to create, edit, and delete product categories. Categories organise your catalog and appear as filter tabs on your storefront. You can also create a new category on the fly when adding a product by clicking the "+" button next to the Category dropdown.',
      },
    ],
  },
  {
    id: 'orders',
    title: '4. Order Management',
    content: [
      {
        heading: 'Orders List',
        text: 'The Orders page shows all customer orders sorted by date. Each row displays the order number, customer name, fulfilment status, payment status, total amount, and date. Use the Search bar and Status filter (All, Pending, Processing, Shipped, Delivered, Cancelled) to narrow results. Click any order row to open its full detail.',
        image: `${S}/05-orders.jpg`,
        imageCaption: 'Orders list with status filters and search',
      },
      {
        heading: 'Order Lifecycle',
        text: 'Orders move through these stages: Pending → Confirmed → Processing → Ready for Pickup / Out for Delivery → Delivered → Completed. You can also Cancel or Refund orders. From the order detail page, use the Status dropdown to advance an order. Each status change is timestamped in the order timeline.',
      },
      {
        heading: 'Order Details',
        text: 'The detail page shows the complete order: line items with quantities and prices, customer contact information and delivery address, payment status, and a full timeline of status changes with timestamps.',
      },
    ],
  },
  {
    id: 'customers',
    title: '5. Customer Management',
    content: [
      {
        heading: 'Customer List with Customer IDs',
        text: 'The Customers page shows all your customers. The first column is the Customer ID — a unique auto-generated code in the format CUST-0001, CUST-0002, and so on. This ID makes it easy to identify specific customers even when two people share the same name. You can search by Customer ID, name, phone number, or email. Columns include Customer ID, Name, Phone, Segment badge, Orders count, Lifetime Value, and Last Active date.',
        image: `${S}/06-customers.jpg`,
        imageCaption: 'Customers list — unique CUST-XXXX IDs, segmentation, and lifetime value',
      },
      {
        heading: 'Adding a Customer',
        text: 'Click "Add Customer". Phone number is required (used as the unique identifier per tenant). Fill in Name, Email, Location, and Segment (New / Regular / VIP) as needed. Click Add Customer — a Customer ID is assigned automatically. The customer list refreshes in the background without clearing the existing records.',
      },
      {
        heading: 'AI-Powered Segmentation',
        text: 'The system automatically segments customers using RFM analysis (Recency, Frequency, Monetary value): VIP, Active, At Risk, New, or Dormant. This helps you identify your best customers, recover at-risk ones, and target the right group with campaigns. You can manually override the segment at any time.',
      },
    ],
  },
  {
    id: 'payments',
    title: '6. Payments',
    content: [
      {
        heading: 'Payment Dashboard',
        text: 'The Payments page lists all payment transactions with summary cards at the top showing total collected, successful, and pending amounts. Each row shows the payment reference, customer, amount, gateway (Paystack or Flutterwave), status, and date. Filter by status (All, Completed, Pending, Failed, Refunded) or by payment method.',
        image: `${S}/07-payments.jpg`,
        imageCaption: 'Payments list with gateway, status, and amount tracking',
      },
      {
        heading: 'Payment Gateways',
        text: 'Shopysh supports Paystack and Flutterwave for online payments. Configure your API keys in Settings → Payment Config. The system handles payment initialisation, verification, and webhook processing automatically.',
      },
    ],
  },
  {
    id: 'finance',
    title: '7. Finance Module',
    content: [
      {
        heading: 'Finance Command Center (Overview)',
        text: 'Click "Finance" in the sidebar to open the Finance module. The overview page shows six KPI cards at the top: Revenue (YTD), Expenses (YTD), Net Profit (with margin %), Cash Balance, Receivables, and Payables. Below is a 6-month Revenue vs Expenses bar chart on the left and a Recent Journals panel on the right. Scroll down to see the Finance Modules quick-access grid with clickable shortcuts to every sub-section.',
        image: `${S}/08-finance-overview.jpg`,
        imageCaption: 'Finance Command Center — 6 KPI cards, revenue chart, recent journals, and module shortcuts',
      },
      {
        heading: 'Chart of Accounts',
        text: 'The Chart of Accounts (CoA) is the master list of all your bookkeeping accounts, organised by type: ASSET, LIABILITY, EQUITY, INCOME, EXPENSE. Each row shows the account Code, Name, Type badge, and current Balance. Accounts are displayed in a hierarchy — parent accounts at the top level with child accounts indented below. Use the Type filter buttons and Search bar to locate specific accounts quickly.',
        image: `${S}/09-finance-accounts.jpg`,
        imageCaption: 'Chart of Accounts — hierarchical account list with type badges and balances',
      },
      {
        heading: 'Setting Up Accounts with a Template',
        text: 'New businesses should start with a pre-built template. Click "Choose Template" to open the template picker. Three options are available: Nigerian Standard (65 accounts, follows standard Nigerian accounting practice), Simple (25 accounts, for very small businesses), and Retail (65 accounts, optimised for retail). Click "Use This" on your chosen template. If your CoA already has entries, a confirmation dialog will ask if you want to replace them — click OK to proceed or Cancel to keep your current accounts.',
        image: `${S}/10-finance-accounts-template.jpg`,
        imageCaption: 'CoA Template picker — choose Nigerian Standard, Simple, or Retail',
      },
      {
        heading: 'Journal Entries',
        text: 'Journal Entries are the foundation of double-entry bookkeeping. Every financial event is recorded here with at least one debit and one equal credit line. The list shows Entry #, Date, Description, Entry Type, Status badge (Draft = amber, Posted = green, Reversed = red), and Debit total. Use the Status filter chips (All / Draft / Posted / Reversed) and Search bar to find entries.',
        image: `${S}/11-finance-journal.jpg`,
        imageCaption: 'Journal Entries list with status badges — Draft, Posted, and Reversed entries',
      },
      {
        heading: 'Creating a New Journal Entry',
        text: 'Click "New Journal" to open the entry form. Fill in the Description (required), Date, Entry Type (14 types: General Journal, Sales Invoice, Purchase Invoice, Sales Receipt, Purchase Payment, Expense, Payroll, Depreciation, Opening Balance, Closing Entry, Bank Deposit, Bank Withdrawal, Credit Note, Debit Note), optional Reference and Notes. In the Lines table, add at least two lines — each line needs an Account, a Description, and either a Debit or Credit amount. Watch the balance indicator at the bottom: it must show equal Debit and Credit totals. Click "Save as Draft" to save without posting, or "Post Entry" to finalise.',
        image: `${S}/12-finance-journal-new.jpg`,
        imageCaption: 'New Journal Entry modal — lines table with debit/credit balance indicator',
      },
      {
        heading: 'Cash Book',
        text: 'The Cash Book records all physical cash transactions. Four summary cards at the top show the Opening Balance, Total Receipts (green), Total Payments (red), and Closing Balance for the selected period. The transaction table shows Date, Entry #, Description, Receipts column, Payments column, and Running Balance. Click "Record Transaction" to log a new cash receipt or payment — you\'ll need to choose a Contra Account (the other side of the entry, e.g. your Sales account for a cash sale).',
        image: `${S}/13-finance-cash-book.jpg`,
        imageCaption: 'Cash Book — running balance with receipt/payment columns and date range filter',
      },
      {
        heading: 'Bank Book',
        text: 'The Bank Book works identically to the Cash Book but records transactions through your bank account(s). If you have multiple bank accounts in your Chart of Accounts, a dropdown at the top lets you switch between them. All features — summary cards, date filters, transaction table, recording transactions, and CSV export — mirror the Cash Book.',
        image: `${S}/14-finance-bank-book.jpg`,
        imageCaption: 'Bank Book — same layout as Cash Book, filtered to bank account transactions',
      },
      {
        heading: 'Sales Book',
        text: 'The Sales Book is a chronological log of all sales: invoices raised (credit sales), cash receipts collected, and credit notes issued. Three summary cards show Total AR/Debit, Total Sales/Credit, and entry count. Transaction type badges are colour-coded — Invoice (green), Receipt (blue), Credit Note (amber). Use the From/To date pickers to filter the period.',
        image: `${S}/15-finance-sales-book.jpg`,
        imageCaption: 'Sales Book — invoices, receipts, and credit notes with type colour-coding',
      },
      {
        heading: 'Recording a Sale',
        text: 'Click "Record Sale" to open the sale form. Fill in Date, optional Customer (the lookup shows the Customer ID badge [CUST-XXXX] beside the name), optional Invoice Reference, Description (required), Amount excl. VAT, and optional VAT Amount. Then choose the Payment Method: Invoice/AR (credit sale — debits Accounts Receivable), Cash (debits Cash on Hand), or Bank Transfer (debits Bank Account). A subtotal box confirms the total including VAT.',
        image: `${S}/16-finance-sales-book-modal.jpg`,
        imageCaption: 'Record Sale form — customer lookup with CUST-XXXX badge and payment method selector',
      },
      {
        heading: 'Purchase Book',
        text: 'The Purchase Book records supplier purchases: invoices received, payments made, and debit notes issued. Type badges: Purchase Invoice (orange), Payment (blue), Debit Note (violet). Scroll to the right to see full columns. Use the From/To date pickers to filter.',
        image: `${S}/17-finance-purchase-book.jpg`,
        imageCaption: 'Purchase Book — supplier invoices, payments, and debit notes',
      },
      {
        heading: 'Recording a Purchase',
        text: 'Click "Record Purchase". Fill in Date, optional Vendor (the lookup shows the Vendor Code badge [VND-XXXX] beside the name), optional Reference (e.g. supplier\'s invoice number), Description (required), Amount excl. VAT, optional VAT Amount, and the required Expense Account (only Expense-type GL accounts are listed). Choose the Payment Method: On Credit/AP (creates an AP liability), Cash, or Bank Transfer.',
        image: `${S}/18-finance-purchase-book-modal.jpg`,
        imageCaption: 'Record Purchase form — vendor lookup with VND-XXXX badge and expense account selector',
      },
      {
        heading: 'Receivables — AR Aging Report',
        text: 'The Receivables page shows all outstanding customer debts and how overdue they are. Five summary cards at the top break the total into age buckets: Total AR, Current (0–30 days), 31–60 Days (amber), 61–90 Days (orange), and 90+ Days (red). The table shows one row per customer with their balance split across the same buckets. A Totals row at the bottom sums everything. Click Export CSV to download.',
        image: `${S}/19-finance-receivables.jpg`,
        imageCaption: 'Receivables (AR Aging) — outstanding balances colour-coded by overdue days',
      },
      {
        heading: 'Payables — AP Aging Report',
        text: 'The Payables page shows what you owe to suppliers, using the same five-bucket aging structure as Receivables. One row per vendor, a Totals row at the bottom, and CSV export. Amounts overdue 31–90 days show in amber/orange; 90+ days in red.',
        image: `${S}/20-finance-payables.jpg`,
        imageCaption: 'Payables (AP Aging) — what you owe suppliers, colour-coded by overdue days',
      },
      {
        heading: 'Vendors & Suppliers',
        text: 'The Vendors page manages your supplier contacts. Each vendor is auto-assigned a Vendor Code in the format VND-0001, VND-0002, etc. Vendors display as cards in a grid showing the name, Vendor Code badge, email, phone, city, country, payment terms, and invoice count. Hover over a card to reveal Edit and Delete buttons.',
        image: `${S}/21-finance-vendors.jpg`,
        imageCaption: 'Vendors grid — VND-XXXX codes, contact details, and payment terms per vendor',
      },
      {
        heading: 'Adding a Vendor',
        text: 'Click "Add Vendor". Fill in Vendor Name (required), Email, Phone, City, Country (defaults to Nigeria), Tax ID (TIN) for VAT compliance, Bank Name, Account Number, Payment Terms (days, e.g. 30 = Net 30), Credit Limit, Address, and Notes. A Vendor Code is assigned automatically on save.',
        image: `${S}/22-finance-vendors-modal.jpg`,
        imageCaption: 'Add Vendor form — all supplier details including bank info and payment terms',
      },
      {
        heading: 'Financial Statements',
        text: 'The Statements page provides a comprehensive P&L summary. Toggle between Monthly (pick month + year), Yearly, or Custom (pick From/To dates), then click Generate. Four KPI cards show Total Income, Total Expenses, Net Profit/Loss, and Profit Margin. Two side-by-side cards show income and expense breakdowns as horizontal bar charts by category. Below them is a full P&L statement table.',
        image: `${S}/23-finance-statements.jpg`,
        imageCaption: 'Financial Statements — period selector, KPI cards, and P&L breakdown charts',
      },
      {
        heading: 'Reports — Accessing the Submenu',
        text: 'In the Finance sidebar, click "Reports" to expand a collapsible submenu containing three report pages: Trial Balance, Income Statement, and Balance Sheet. The submenu auto-expands whenever you are on any of these report pages, and a left-border line visually connects the child items.',
      },
      {
        heading: 'Trial Balance',
        text: 'The Trial Balance verifies that total debits equal total credits across all accounts. Set a From/To date range (defaults to 1 Jan of current year to today) and click Generate. A banner at the top shows whether your books are balanced (green tick) or out of balance (red alert with the difference). The table shows every GL account with Period Debit, Period Credit, DR Balance, and CR Balance columns. Run this at the end of every month before preparing financial statements.',
        image: `${S}/24b-finance-trial-balance-result.jpg`,
        imageCaption: 'Trial Balance report — balance confirmation banner and account-by-account breakdown',
      },
      {
        heading: 'Income Statement (Profit & Loss)',
        text: 'The Income Statement summarises business performance over a period. Set From/To dates and click Generate. Four KPI cards show Total Revenue, Gross Profit (with margin %), Operating Expenses, and Net Profit (green = profit, red = loss). The full statement is laid out in sections: Revenue, Cost of Sales (if applicable), Operating Expenses, and a bold Net Profit/(Loss) row at the bottom with the margin percentage.',
        image: `${S}/25b-finance-income-statement-result.jpg`,
        imageCaption: 'Income Statement — KPI cards plus full P&L layout with margin percentages',
      },
      {
        heading: 'Balance Sheet',
        text: 'The Balance Sheet shows what your business owns (assets) and owes (liabilities + equity) at a specific date — the equation Assets = Liabilities + Equity must always hold. Set the "As of Date" and click Generate. A banner confirms whether the sheet balances. Three sections: Assets (blue), Liabilities (red), Equity (violet, including Current Year Net Income). The final TOTAL LIABILITIES + EQUITY row must equal Total Assets.',
        image: `${S}/26b-finance-balance-sheet-result.jpg`,
        imageCaption: 'Balance Sheet — Assets, Liabilities, and Equity sections with balance confirmation',
      },
      {
        heading: 'VAT Summary Report',
        text: 'The VAT Summary report shows all Output VAT collected on sales versus Input VAT paid on purchases for a period. The net amount payable to FIRS (Federal Inland Revenue Service) is calculated automatically. Set a date range and click Generate. Use this report to prepare your VAT returns. Accessible from Finance → Reports → VAT Summary.',
      },
      {
        heading: 'Expense Report (Printable)',
        text: 'The Expense Report at Finance → Reports → Expense Report lists all recorded expenses for a selected period, grouped by category with subtotals and a grand total. Set From / To dates and click Generate. Click Print (top-right) to open the browser print dialog — filters and controls are hidden automatically, leaving a clean professional printout.',
      },
      {
        heading: 'Fixed Assets Register (Printable)',
        text: 'The Fixed Assets Register at Finance → Reports → Fixed Assets Register shows every fixed asset with its acquisition date, cost price, accumulated depreciation to date, and current book (net) value. Assets are grouped by category (Equipment, Vehicles, Furniture, etc.). The register loads automatically when you open the page. Click Print to produce a printable version — use this for asset audits and insurance valuations.',
      },
      {
        heading: 'Inventory Report (Printable)',
        text: 'The Inventory Report at Finance → Reports → Inventory Report shows current stock levels and cost valuations for all active products. Each row shows product name, SKU, category, quantity on hand, cost price, and total stock value. Products at or below the Low Stock Threshold are highlighted in amber. The total inventory valuation is shown at the bottom. Click Print for a clean printed version.',
      },
      {
        heading: 'Cash Book Report (Printable)',
        text: 'The Cash Book Report at Finance → Reports → Cash Book is a printable period cash statement. Set From / To dates and click Generate. Summary cards show Opening Balance, Total Receipts (green), and Total Payments (red). The table shows each transaction with Date, Description, Reference, Receipts (DR), Payments (CR), and a Running Balance column. An Opening Balance row frames the top and a Totals row closes the bottom. A closing summary box (jade background) confirms: Opening + Receipts − Payments = Closing Balance. Draft entries appear in a lighter shade. Click Print for a clean printout without the filter controls.',
      },
      {
        heading: 'Budget vs Actuals Report (Printable)',
        text: 'The Budget vs Actuals report at Finance → Reports → Budget vs Actuals compares planned budgets against year-to-date actual spending. Select a Fiscal Year from the dropdown. Summary cards show Grand Total Budgeted, Grand Total Actual (YTD), and Total Variance. Each budget displays a per-account breakdown with Budgeted, Actual, Variance, and % Used columns — a mini progress bar turns red when spending exceeds the budget. A Grand Total box at the bottom gives the overall position. Click Print for a clean printout.',
      },
      {
        heading: 'Bank Reconciliation Report (Printable)',
        text: 'The Bank Reconciliation Report at Finance → Reports → Bank Reconciliation shows a printable view of any imported bank statement reconciliation. Select a statement from the Statement dropdown (statements are imported in Finance → Bank Reconciliation). Summary cards show Opening Balance, Closing Balance, Matched Lines count, and Unmatched Lines count. The Reconciliation Proof panel shows two columns: Bank Statement arithmetic (opening + debits − credits = closing) and Reconciliation Status (matched vs unmatched receipts and payments). A status badge shows "Fully Reconciled" (green) or the number of unmatched items (amber). The Statement Lines table shows every line with Matched / Unmatched / Ignored badges. Unmatched items are also listed in a separate card at the bottom for follow-up. Click Print to produce a clean printed reconciliation statement.',
      },
    ],
  },
  {
    id: 'campaigns',
    title: '8. Marketing Campaigns',
    content: [
      {
        heading: 'Campaigns List',
        text: 'The Campaigns page shows all your marketing broadcasts. Each campaign card or row shows the name, channel (SMS or Email), target segment, status (Draft, Scheduled, Sent, Failed), and delivery statistics (sent count, delivered, failed). Click "Create Campaign" to start a new one.',
        image: `${S}/27-campaigns.jpg`,
        imageCaption: 'Campaigns list — SMS/email campaigns with delivery stats per broadcast',
      },
      {
        heading: 'Creating a Campaign',
        text: 'Click "Create Campaign". Fill in a Campaign Name, select the Channel (SMS or Email), choose a Target Segment (All Customers, VIP, Active, At Risk, New, Dormant), write your Message or email content, and optionally schedule a send time. Click Save to create as a Draft, or Send to dispatch immediately.',
      },
      {
        heading: 'Segmented Targeting',
        text: 'Combine AI segmentation with campaigns to reach the right customers. For example: send a re-engagement offer to "At Risk" customers, or a loyalty reward to "VIP" customers only. The segment customer count is shown as you select it so you know exactly how many people will receive the message.',
      },
    ],
  },
  {
    id: 'ai-assistant',
    title: '9. AI Assistant',
    content: [
      {
        heading: 'AI Assistant Chat',
        text: 'The AI Assistant answers questions about your business data and helps you draft content. Click "AI Assistant" in the sidebar. Type your question and press Enter or click Send. The assistant uses your actual business data to give accurate, contextual answers. All processing happens on your server using the local Qwen2.5 AI model — your data never leaves your server unless you configure an external API.',
        image: `${S}/28-ai-assistant.jpg`,
        imageCaption: 'AI Assistant — chat interface powered by local Qwen2.5 model',
      },
      {
        heading: 'Example Queries',
        text: 'Try asking: "What were my top 5 selling products last month?", "How much did I spend on expenses in Q1?", "Write a promotional message for my VIP customers", "Which customers haven\'t ordered in the last 60 days?", or "What is my current cash balance?" The AI has access to all your business data within your workspace.',
      },
    ],
  },
  {
    id: 'analytics',
    title: '10. Analytics',
    content: [
      {
        heading: 'Analytics Dashboard',
        text: 'The Analytics page provides a comprehensive view of business performance: revenue trends, order volumes, customer growth, AI conversation metrics, and campaign performance. Filter by time period (7, 30, or 90 days). Charts visualise trends over time. Use the Reports section to download CSV exports of Orders, Products, Customers, or Payments.',
        image: `${S}/30-analytics.jpg`,
        imageCaption: 'Analytics — revenue trends, order volumes, and customer growth charts',
      },
    ],
  },
  {
    id: 'team',
    title: '11. Team Management',
    content: [
      {
        heading: 'Team Members',
        text: 'The Team page lists all users in your workspace with their name, email, role, and active status. You can add team members, change their roles, activate/deactivate accounts, or remove them.',
        image: `${S}/31-team.jpg`,
        imageCaption: 'Team management — member list with roles and status controls',
      },
      {
        heading: 'Adding a Team Member',
        text: 'Click "Add Member". Enter their name, email, a temporary password, and assign a role: Staff (manages daily tasks — products, orders, customers, payments) or Manager (full access except billing). The member can change their password after their first login.',
      },
      {
        heading: 'Roles',
        text: 'Three role levels exist: Owner (full access including billing and settings), Manager (full access except billing), Staff (products, orders, customers, and payments only). Owners cannot be modified by other users for security reasons.',
      },
    ],
  },
  {
    id: 'settings',
    title: '12. Settings',
    content: [
      {
        heading: 'Business Profile & Store URL',
        text: 'Settings → Business Profile lets you update your business name, phone, email, website, description, address, city, country, and default currency. At the very top of the profile card is a highlighted box showing your Store URL. Use the Copy button to copy it, or Open to preview your live storefront. The default currency (NGN or USD) applies to all financial records, invoices, and reports.',
        image: `${S}/29-settings.jpg`,
        imageCaption: 'Settings — Business Profile tab with Store URL, business details, and currency selector',
      },
      {
        heading: 'AI Configuration',
        text: 'Settings → AI Configuration lets you set the AI provider (Local Qwen2.5 or an external OpenAI-compatible API), configure an API key if using an external provider, choose the model, and customise the assistant\'s welcome message shown to store visitors.',
      },
      {
        heading: 'Billing & Subscription',
        text: 'Settings → Billing shows your current plan (Starter, Business, or Premium), storage usage in MB, and usage stats for the current month. You can view available plans for upgrade here. Storage limits are shown in megabytes — for reference, 1,024 MB = 1 GB.',
      },
      {
        heading: 'Finance Tab — GL Posting Mode',
        text: 'Settings → Finance → GL Posting Mode controls how the system auto-posts accounting entries when orders are completed. Three options are available: Auto-Post (journal entries are created and posted immediately when an order is marked Completed), Draft (entries are created as Drafts for your review before posting), and Disabled (no automatic journal entries — you post all entries manually from the Journal Entries page). Most businesses should use Auto-Post.',
      },
      {
        heading: 'Finance Tab — Transaction Journal Mappings',
        text: 'The Transaction Journal Mappings table (Settings → Finance) shows the debit and credit accounts used for every type of financial transaction the system auto-posts. The table has three columns: Transaction Type (what event triggers the entry), Debit (DR) account, and Credit (CR) account. Each cell shows a dropdown — the first option is the system default with its GL code (e.g., "Default: [1110] Cash on Hand"), and below it are all your own GL accounts for override. Seven transaction types are listed across five groups: Sales & Receipts (Cash Sale, Bank Transfer / Mobile Money, Invoice / Credit Sale, Output VAT), Purchases & Payables (Purchase on Credit), Expenses (Expense Recording — CR shows separate Cash and Bank selectors), and Inventory & Cost of Sales (COGS), and Fixed Assets (Fixed Asset Acquisition — CR has separate Cash/Bank selectors; Asset Depreciation — DR and CR are fixed system accounts shown in a grey "fixed" badge). Click Save Finance Settings to apply any changes.',
      },
      {
        heading: 'Finance Tab — Fixed Asset Category GL Accounts',
        text: 'Below the Transaction Journal Mappings table, the Fixed Asset Category GL Accounts section lets you assign a specific asset account to each fixed asset category. For example, you can map "Vehicles" to account [1620] Motor Vehicles and "Computer Equipment" to account [1630] Computer Equipment, rather than using the single catch-all Fixed Asset account. Any category left unmapped will fall back to the FIXED_ASSET mapping in the Transaction Journal table above. This gives you a more granular balance sheet breakdown by asset type.',
      },
    ],
  },
  {
    id: 'audit-trail',
    title: '13. Audit Trail',
    content: [
      {
        heading: 'What the Audit Trail Records',
        text: 'The Audit Trail (sidebar → Audit Trail) is a chronological log of every significant action taken in your workspace. Every time a user creates, updates, or deletes a record — customers, products, orders, payments, journal entries, settings changes, and more — a timestamped entry is added. The log is append-only and cannot be edited or deleted, making it a reliable record for internal compliance and dispute resolution.',
      },
      {
        heading: 'Reading the Audit Trail',
        text: 'The Audit Trail page shows a table with columns: Timestamp (date and time of the action), User (the team member who performed it), Action badge (colour-coded — green for creates, blue for updates, red for deletes, amber for status changes), Entity (which type of record was affected, e.g. Order, Customer, Product), and Summary (a plain-English description of what changed). Use the Search bar to filter by user name or action keyword. Use the Action Type and Entity filters at the top to narrow the list to a specific category of change.',
      },
      {
        heading: 'Actions Logged',
        text: 'The following actions are captured automatically: Customer Created / Updated / Deleted; Product Created / Updated / Deleted; Order Created and Order Status Changed (each transition logged separately, e.g. PENDING → CONFIRMED); Payment Recorded; Journal Entry Created / Posted / Reversed; Fixed Asset Created / Updated / Depreciated / Disposed; Settings Updated; Team Member Added / Role Changed. New actions are added to the log in real time — there is no need to refresh the page.',
      },
    ],
  },
  {
    id: 'admin',
    title: '14. Admin Portal (Super Admin Only)',
    content: [
      {
        heading: 'Admin Portal Overview',
        text: 'Super Admin users are redirected to the Admin Portal after login. The Overview tab shows platform-wide statistics: Total Companies, Active Companies, Total Users, Total Products, Total Orders, Total Customers, Platform Revenue, and Active Rate. Below the cards is a Recent Companies table listing the latest registered businesses with their plan, user count, product count, order count, status, and join date. The sidebar shows a PLATFORM group with the Admin Portal link.',
        image: `${S}/33-admin-tenants.jpg`,
        imageCaption: 'Admin Portal Overview — platform-wide stats and recently registered companies',
      },
      {
        heading: 'Companies Tab',
        text: 'Click the "Companies" tab to see the full list of all business workspaces on the platform. Each row shows the business name, email, subscription plan badge, status (Active/Inactive), user count, product count, and subdomain. The subdomain is a clickable link — click it to open that tenant\'s live storefront in a new tab. Use the Search bar (by name, email, or subdomain) and the Status filter to find specific businesses.',
      },
      {
        heading: 'Plans Tab',
        text: 'The Plans tab lets you create and edit subscription plans. Each plan card shows the name, price (monthly/yearly), storage limit in MB, and feature list. Click Edit to adjust plan details. Storage is always shown in megabytes — 1,024 MB = 1 GB.',
        image: `${S}/34-admin-plans.jpg`,
        imageCaption: 'Admin Plans tab — subscription tiers with MB storage limits and feature lists',
      },
      {
        heading: 'Access Codes',
        text: 'The Access Codes tab lets you generate single-use onboarding codes for tenants who paid by cash or bank transfer. Each code (format: SHP-XXXX-XXXX-XXXX) is tied to a specific plan and billing cycle. The table shows all codes with their status (Active, Used, or Expired) and a copy button for active ones.',
        image: `${S}/35-admin-access-codes.jpg`,
        imageCaption: 'Access Codes tab — list of all codes with Active, Used, and Expired statuses',
      },
      {
        heading: 'Generating an Access Code',
        text: 'Click "Generate Code". Select the Plan, Billing Cycle (monthly or yearly), optional Expiry (number of days), and add a Note (e.g. the tenant\'s business name for your own reference). Click Generate. The code is created immediately and shown in the table. Copy it and share it with the tenant. Once they use it to complete onboarding the code is marked as Used.',
        image: `${S}/36-admin-access-code-modal.jpg`,
        imageCaption: 'Generate Access Code modal — plan selection, billing cycle, and optional expiry',
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
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
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
            Everything you need to run your business with Shopysh — step-by-step instructions with screenshots of every screen.
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
        <div className="space-y-16">
          {sections.map(section => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="font-bold text-xl mb-8 border-b pb-3" style={{ color: 'hsl(168,84%,22%)' }}>{section.title}</h2>
              <div className="space-y-10">
                {section.content.map((item, i) => (
                  <div key={i}>
                    <div className="pl-4 border-l-2 mb-4" style={{ borderColor: 'hsl(40,78%,47%)' }}>
                      <h3 className="font-semibold text-base mb-1.5">{item.heading}</h3>
                      <p className="text-gray-600 leading-relaxed text-sm">{item.text}</p>
                    </div>
                    {item.image && (
                      <div className="ml-4 rounded-xl overflow-hidden border border-gray-200 shadow-md">
                        <div className="relative w-full" style={{ aspectRatio: '1440/820' }}>
                          <Image
                            src={item.image}
                            alt={item.imageCaption ?? item.heading}
                            fill
                            className="object-cover object-top"
                            sizes="(max-width: 768px) 100vw, 900px"
                          />
                        </div>
                        {item.imageCaption && (
                          <p className="text-xs text-gray-500 bg-gray-50 px-4 py-2 border-t border-gray-200 text-center">
                            {item.imageCaption}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t text-center text-sm text-gray-400">
          <p>Shopysh User Guide • Last updated: July 2026</p>
          <p className="mt-1">For support, contact your platform administrator.</p>
        </div>
      </div>
    </div>
  );
}
