# Shopysh — User Guide

**Version:** June 2026  
**Platform:** [www.shopysh.com](https://www.shopysh.com)

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Products](#3-products)
4. [Orders](#4-orders)
5. [Customers](#5-customers)
6. [Payments](#6-payments)
7. [Finance Module](#7-finance-module)
   - 7.1 [Finance Overview](#71-finance-overview)
   - 7.2 [Chart of Accounts](#72-chart-of-accounts)
   - 7.3 [Journal Entries](#73-journal-entries)
   - 7.4 [Cash Book](#74-cash-book)
   - 7.5 [Bank Book](#75-bank-book)
   - 7.6 [Sales Book](#76-sales-book)
   - 7.7 [Purchase Book](#77-purchase-book)
   - 7.8 [Receivables (Accounts Receivable)](#78-receivables-accounts-receivable)
   - 7.9 [Payables (Accounts Payable)](#79-payables-accounts-payable)
   - 7.10 [Finance Customers](#710-finance-customers)
   - 7.11 [Vendors & Suppliers](#711-vendors--suppliers)
   - 7.12 [Financial Statements](#712-financial-statements)
   - 7.13 [Reports — Trial Balance](#713-reports--trial-balance)
   - 7.14 [Reports — Income Statement](#714-reports--income-statement)
   - 7.15 [Reports — Balance Sheet](#715-reports--balance-sheet)
8. [Campaigns](#8-campaigns)
9. [AI Assistant](#9-ai-assistant)
10. [Settings](#10-settings)
11. [Team Management](#11-team-management)
12. [Admin Portal (Super Admin)](#12-admin-portal-super-admin)

---

## 1. Getting Started

### Onboarding with an Access Code

Shopysh is an invite-only platform. To create your business account you need an **Access Code** provided by your Shopysh administrator.

1. Go to the Shopysh website and click **Get Started**.
2. Enter your Access Code (format: `SHP-XXXX-XXXX-XXXX`).
3. The system validates the code and shows the subscription plan attached to it.
4. Fill in your business details:
   - Business name
   - Your name and email address
   - Password
5. Click **Create Account**. Your business workspace is created immediately.

Your business is assigned a unique **store subdomain** (e.g., `mybusiness`) which determines your public storefront URL.

### Logging In

1. Go to the Shopysh login page.
2. Enter your email and password.
3. Click **Sign In**.

You can also sign in with **Google** if your administrator has enabled Google SSO.

> **Demo credentials:** `john@doe.com` / `johndoe123`

### Finding Your Store URL

After logging in, go to **Settings → Business Profile**. At the top of the profile card you will see a highlighted box showing your **Store URL** (e.g., `https://www.shopysh.com/store/mybusiness`). Use the **Copy** button to copy it to your clipboard, or click the **Open** button to view your live storefront.

---

## 2. Dashboard

The main dashboard gives you a real-time snapshot of your business.

### Key Metrics Cards

| Card | What It Shows |
|------|---------------|
| Revenue | Total sales collected today / this period |
| Orders | New and pending orders |
| Customers | Total registered customers |
| Products | Active products in your inventory |

### Charts

- **Revenue trend** — line or bar chart showing sales over time.
- **Recent activity** — latest orders, payments, and customer actions.

Use the **date range selector** at the top right to change the reporting period.

---

## 3. Products

### Product List

The Products page shows all items in your inventory with their SKU, price, stock level, category, and status.

- Use the **Search** bar to find products by name or SKU.
- Use the **Category** filter to narrow the list.
- Click any row to open the product detail.

### Adding a Product

1. Click **Add Product**.
2. Fill in the required fields:
   - **Product Name** (required)
   - **SKU** — unique stock-keeping unit code
   - **Price** — selling price in your default currency
   - **Stock Quantity**
   - **Category**
   - **Description**
3. Click **Save Product**.

### Product Images

Each product can have up to **4 photos**. Images are uploaded directly to your store — no external storage account is needed.

**To upload images:**
1. Open the product detail page (click the product in the list, or after saving a new product).
2. In the **Product Images** card, click the dashed **Add Image** tile.
3. Select a JPEG, PNG, WebP, or GIF file (maximum 5 MB per image).
4. The image uploads immediately and appears in the grid.

**Rules:**
- Maximum **4 images** per product. The upload tile disappears once 4 images are added.
- The **first image uploaded** is automatically set as the primary (main display) image. A gold "Primary" badge marks it.
- Hover over any image to reveal action buttons: **Set as Primary** (star icon) or **Remove** (X icon).
- To remove an image, click the X button in the image overlay. This cannot be undone.

### Product Variants

If a product comes in multiple sizes, colours, or configurations, use the **Variants** section on the product detail page.

---

## 4. Orders

### Order List

The Orders page shows all customer orders sorted by date. Each row shows the order number, customer name, total amount, payment status, and fulfilment status.

- **Filter** by status: All, Pending, Processing, Shipped, Delivered, Cancelled.
- **Search** by order number or customer name.

### Order Detail

Click any order to open the full detail view:
- Customer information and delivery address
- Line items with quantities and prices
- Payment status (Paid / Unpaid / Partial)
- Fulfilment status and tracking notes
- Timeline of status changes

### Updating an Order

Change the order status using the **Status** dropdown on the detail page. Add notes in the **Notes** field and click **Save**.

---

## 5. Customers

### Customer List

The Customers page shows all your customers with their unique **Customer ID**, name, phone number, segment, order count, lifetime value, and last active date.

**Customer IDs** are auto-generated codes in the format `CUST-0001`, `CUST-0002`, etc. Each customer gets a unique ID across your tenant so you can always identify them precisely — especially helpful when two customers share the same name.

- **Search** by Customer ID, name, phone number, or email.
- **Click any row** to open the customer detail page.

### Adding a Customer

1. Click **Add Customer**.
2. Fill in the form:
   - **Phone** (required) — used as the unique identifier per tenant
   - **Name** (optional)
   - **Email** (optional)
   - **Location** (optional)
   - **Segment** — New / Regular / VIP
3. Click **Add Customer**.

A Customer ID (`CUST-NNNN`) is automatically assigned. The customer list refreshes in the background while keeping existing records visible.

> **Note:** If the same phone number is later used to register on your online storefront, the records are merged — the customer's storefront account is linked to their existing CRM profile. No duplicate is created.

### Customer Detail

The customer detail page shows:
- Contact information and segment
- Full order history
- Payment history
- Communication log
- Lifetime value and average order value

---

## 6. Payments

The Payments page tracks all money received from customers.

- Filter by status: All, Completed, Pending, Failed, Refunded.
- Filter by payment method: Cash, Bank Transfer, Card, etc.
- Use the date range picker to view payments for a specific period.

Each payment row shows the reference number, customer, amount, method, and date. Click a payment to view its full detail.

---

## 7. Finance Module

The Finance module is a full **double-entry bookkeeping system** built for African SMEs. It covers the General Ledger, journals, cash and bank management, accounts receivable/payable, and financial reporting.

> **Important:** Every transaction in the Finance module is recorded using **double-entry accounting** — every debit must be matched by an equal credit. This keeps your books in balance at all times.

To access Finance, click **Finance** in the left sidebar. The Finance section has its own navigation with the following subsections: Overview, Chart of Accounts, Journal Entries, Cash Book, Bank Book, Sales Book, Purchase Book, Debtors/AR, Creditors/AP, Customers, Vendors, Statements, and Reports.

---

### 7.1 Finance Overview

**Finance → Overview** (Finance Command Center)

The Finance dashboard shows you the big picture at a glance.

**KPI Cards:**
| Card | Description |
|------|-------------|
| Revenue (YTD) | Total income posted to income accounts year-to-date |
| Expenses (YTD) | Total expenses posted year-to-date |
| Net Profit | Revenue minus Expenses, with profit margin % |
| Cash Balance | Current balance in your Cash on Hand account |
| Receivables | Total outstanding amounts owed by customers |
| Payables | Total outstanding amounts owed to vendors |

**Charts & Lists:**
- **Revenue vs Expenses** — 6-month bar chart comparing income against spending.
- **Recent Journals** — the 4 most recent journal entries with status badges (Draft / Posted / Reversed). Click **View all** to go to the full journal list.

**Quick Access Grid:** Clickable shortcuts to every major section of the Finance module.

**Bottom Stats:** Count of GL Accounts, Vendors, and Draft entries — each is a clickable link.

---

### 7.2 Chart of Accounts

**Finance → Chart of Accounts**

The Chart of Accounts (CoA) is the master list of every account in your bookkeeping system. Every financial transaction is recorded against one or more of these accounts.

#### Account Types

| Type | Description | Normal Balance |
|------|-------------|----------------|
| ASSET | Things your business owns (cash, stock, receivables) | Debit |
| LIABILITY | Amounts your business owes (AP, loans) | Credit |
| EQUITY | Owner's capital and retained earnings | Credit |
| INCOME | Revenue from sales and services | Credit |
| EXPENSE | Costs incurred to run the business | Debit |

#### Viewing Accounts

Accounts are displayed in a hierarchy — parent accounts appear at the top level and child accounts are indented below them. Each row shows:
- **Code** — the account number (e.g., 1000, 1100, 1110)
- **Name** — the account description
- **Type** badge
- **Balance** — current running balance

Use the **Type filter** buttons (All / Asset / Liability / Equity / Income / Expense) and the **Search** bar to locate specific accounts.

#### Setting Up Your Chart of Accounts

**Option 1 — Use a Template (Recommended for new businesses)**

1. Click **Choose Template**.
2. Three pre-built templates appear:
   - **Nigerian Standard** (65 accounts) — follows standard Nigerian accounting practice
   - **Simple** (25 accounts) — minimal chart for very small businesses
   - **Retail** (65 accounts) — optimised for product-based retail businesses
3. Click **Use This** on the template you want.
4. If your CoA already has entries, you are asked to confirm replacement. Click **OK** to wipe the existing accounts and load the template, or **Cancel** to keep your current accounts.

> **Warning:** Replacing a CoA with a template permanently deletes all existing accounts and their balances. Only do this before you have started recording real transactions.

**Option 2 — Add Accounts Manually**

1. Click **Add Account**.
2. Fill in the form:
   - **Account Code** (required) — a unique number (e.g., 1210)
   - **Account Type** (required) — select Asset, Liability, Equity, Income, or Expense
   - **Account Name** (required)
   - **Parent Account** (optional) — select a parent to nest this account under it
   - **Opening Balance** (optional) — enter the starting balance if migrating from another system
   - **Description** (optional)
3. Click **Save**.

> Account Code and Account Type **cannot be changed** after saving. Plan your numbering scheme before you begin (e.g., 1xxx = Assets, 2xxx = Liabilities, 3xxx = Equity, 4xxx = Income, 5xxx = Expenses).

#### Editing and Deleting Accounts

Hover over any account row to reveal the **Edit** (pencil) and **Delete** (bin) buttons. System accounts — those critical to the module's operation — cannot be edited or deleted and show no action buttons.

---

### 7.3 Journal Entries

**Finance → Journal Entries**

Journal Entries are the fundamental building block of your accounting records. Every financial event (sale, purchase, expense payment, etc.) is recorded as a journal entry with at least two lines — a debit and a credit.

#### Viewing Entries

The journal list shows:
- **Entry #** — auto-generated sequential number
- **Date** — the accounting date
- **Description** — what the entry is for
- **Type** — the category of entry (General Journal, Sales Invoice, Purchase Invoice, etc.)
- **Status** badge — Draft (amber), Posted (green), or Reversed (red)
- **Total Debit** amount

Use the **Status filter** (All / Draft / Posted / Reversed) and the **Search** bar to find specific entries.

#### Entry Statuses

| Status | Meaning |
|--------|---------|
| **Draft** | Entry saved but not yet confirmed. Can be edited or deleted. Does not affect account balances. |
| **Posted** | Entry confirmed and final. Affects account balances. Cannot be edited (can be reversed). |
| **Reversed** | A reversal entry has been created to undo this entry. |

#### Creating a Journal Entry

1. Click **New Journal**.
2. Fill in the header:
   - **Description** (required)
   - **Date** (required)
   - **Entry Type** — select from: General Journal, Sales Invoice, Purchase Invoice, Sales Receipt, Purchase Payment, Expense, Payroll, Depreciation, Opening Balance, Closing Entry, Bank Deposit, Bank Withdrawal, Credit Note, Debit Note
   - **Reference** (optional) — e.g., invoice number, cheque number
   - **Notes** (optional)
3. Add journal lines in the **Lines** table:
   - **Account** — select the GL account from the dropdown
   - **Description** — brief note for this line
   - **Debit** — enter an amount if this account is being debited
   - **Credit** — enter an amount if this account is being credited
   - Click **Add Line** to add more lines (minimum 2 lines required)
4. Watch the **balance indicator** at the bottom of the lines table. It must show equal Debit and Credit totals before you can post. If they don't match, a red "Unbalanced" warning appears.
5. Click:
   - **Save as Draft** — saves without posting (does not affect balances)
   - **Post Entry** — posts immediately and locks the entry

#### Importing Journals from CSV

1. Click **Import CSV**.
2. Click **Download Template** to get a CSV file with the correct column headers.
3. Fill in the template with your journal data.
4. Upload the completed file.

#### Reversing a Posted Entry

Posted entries cannot be edited. To correct a mistake:
1. Open the posted entry.
2. Click **Reverse** — the system creates a new journal entry with all debits and credits swapped, effectively cancelling the original.

---

### 7.4 Cash Book

**Finance → Cash Book**

The Cash Book records all cash receipts and payments — physical cash transactions through your Cash on Hand account.

#### Summary Cards

At the top of the page, four cards show:
- **Opening Balance** — balance at the start of the selected period
- **Total Receipts** — total cash received (shown in green)
- **Total Payments** — total cash paid out (shown in red)
- **Closing Balance** — balance at the end of the selected period

#### Filtering by Date

Use the **From** and **To** date pickers to select a period. The page defaults to the current calendar month.

#### Reading the Cash Book

The table shows every cash transaction in date order:
- **Date**
- **Entry #** — links to the full journal entry
- **Description** — what the transaction was for (with optional reference as subtext)
- **Receipts (Dr)** — cash coming in (shown in green)
- **Payments (Cr)** — cash going out (shown in red)
- **Running Balance** — cumulative balance after each transaction

The first row is the **Opening Balance** and the last row is the **Closing Balance** — both are highlighted.

#### Recording a Cash Transaction

1. Click **Record Transaction**.
2. Select the type:
   - **Receipt** — money coming in (e.g., cash sale, cash collected from debtor)
   - **Payment** — money going out (e.g., paying an expense, paying a supplier in cash)
3. Fill in the form:
   - **Date** (required)
   - **Amount** (required)
   - **Description** (required)
   - **Link to Customer** (optional, for receipts) — select a customer from the lookup
   - **Link to Vendor** (optional, for payments) — select a vendor from the lookup
   - **Contra Account** (required) — the other side of the entry (e.g., for a cash sale, select your Sales account; for a cash expense, select the Expense account)
4. Click **Save**. The transaction is posted immediately and appears in the cash book table.

#### Exporting

Click **Export CSV** to download the current view as a spreadsheet.

---

### 7.5 Bank Book

**Finance → Bank Book**

The Bank Book works exactly like the Cash Book but records transactions through your **bank account(s)** instead of cash.

If you have multiple bank accounts in your Chart of Accounts, use the **Bank Account** dropdown at the top to switch between them.

All other features — summary cards, date filters, transaction table, recording transactions, and CSV export — work identically to the Cash Book. The only difference is the **Contra Account** field: for bank deposits (receipts) you would typically select Sales or a customer payment account; for bank payments you would select the relevant expense or supplier account.

---

### 7.6 Sales Book

**Finance → Sales Book**

The Sales Book is a chronological record of all your sales transactions — invoices raised, cash receipts collected, and credit notes issued.

#### Summary Cards

- **Total AR / Debit** — total amounts debited (invoiced) in the period
- **Total Sales / Credit** — total sales income credited in the period
- **Entries count** — number of transactions

#### Transaction Types

| Badge | Meaning |
|-------|---------|
| Invoice (green) | Credit sale — customer owes you |
| Receipt (blue) | Cash or bank payment received |
| Credit Note (amber) | Reduction issued to a customer |

#### Recording a Sale

1. Click **Record Sale**.
2. Fill in the form:
   - **Date** (required)
   - **Customer** (optional) — type to search customers by ID, name, or phone. The customer lookup shows the Customer ID badge `[CUST-XXXX]` beside the name.
   - **Invoice Reference** (optional) — e.g., INV-001
   - **Description** (required)
   - **Amount excl. VAT** (required)
   - **VAT Amount** (optional) — leave 0 if not VAT-registered
   - **Payment Method** (required):
     - **Invoice (AR)** — credit sale; debits Accounts Receivable
     - **Cash** — immediate cash payment; debits Cash on Hand
     - **Bank Transfer** — immediate bank payment; debits Bank Account
3. A subtotal box shows the full amount including VAT before you save.
4. Click **Save**. The entry is posted immediately.

#### Filtering and Exporting

Use the **From / To** date pickers to narrow the view. Click **Export CSV** to download the data.

---

### 7.7 Purchase Book

**Finance → Purchase Book**

The Purchase Book records all your business purchases — supplier invoices received, payments made, and debit notes issued.

#### Transaction Types

| Badge | Meaning |
|-------|---------|
| Purchase Invoice (orange) | Supplier sends you an invoice — you owe them |
| Payment (blue) | You pay a supplier |
| Debit Note (violet) | Reduction on a supplier invoice |

#### Recording a Purchase

1. Click **Record Purchase**.
2. Fill in the form:
   - **Date** (required)
   - **Vendor** (optional) — search by vendor name or code. The vendor lookup shows the Vendor Code badge `[VND-XXXX]` beside the name.
   - **Reference** (optional) — e.g., the supplier's invoice number
   - **Description** (required)
   - **Amount excl. VAT** (required)
   - **VAT Amount** (optional)
   - **Expense Account** (required) — select the GL account this cost belongs to (only Expense-type accounts are shown)
   - **Payment Method** (required):
     - **On Credit (AP)** — credit purchase; credits Accounts Payable
     - **Cash** — paid immediately in cash
     - **Bank Transfer** — paid immediately by bank
3. Click **Save**. The entry is posted immediately.

---

### 7.8 Receivables (Accounts Receivable)

**Finance → Debtors/AR**

The Receivables page shows you exactly who owes you money and how overdue each debt is. This is your **AR Aging Report**.

#### Summary Cards

Five cards at the top show the total outstanding and how it is split by age:
- **Total AR** — all outstanding customer debts
- **Current (0–30 days)** — not yet overdue
- **31–60 Days** — slightly overdue (amber)
- **61–90 Days** — overdue (orange)
- **90+ Days** — seriously overdue (red)

#### Reading the Aging Table

Each row represents one customer with an outstanding balance:
- **Customer** — name and phone, with a "View Customer" link
- **Outstanding** — total amount owed (green)
- **Current / 31–60 / 61–90 / 90+** — breakdown by age bucket (orange or red if overdue)

A **Totals row** at the bottom sums each column.

Click **Export CSV** to download the aging report.

---

### 7.9 Payables (Accounts Payable)

**Finance → Creditors/AP**

The Payables page shows what your business owes to suppliers — your **AP Aging Report**. The layout mirrors the Receivables page:

- Five summary cards: Total AP, Current, 31–60, 61–90, 90+ days.
- One row per vendor with outstanding balance and aging breakdown.
- **Totals row** at the bottom.
- **Export CSV** button.

---

### 7.10 Finance Customers

**Finance → Customers**

This is a redirect to the main **Customers** page (see [Section 5](#5-customers)). Finance and ecommerce customers share the same records — adding a customer here also adds them to your CRM, and vice versa.

---

### 7.11 Vendors & Suppliers

**Finance → Vendors**

The Vendors page manages your suppliers and service providers.

#### Vendor Codes

Each vendor is automatically assigned a unique **Vendor Code** in the format `VND-0001`, `VND-0002`, etc. This code appears in a badge on the vendor card and in the vendor lookup dropdown throughout the Finance module.

#### Vendor Cards

Vendors are displayed as cards in a grid (3 columns on desktop). Each card shows:
- Vendor name and **Vendor Code** badge
- Email and phone
- City and country
- Payment terms (days)
- Number of invoices on record

#### Adding a Vendor

1. Click **Add Vendor**.
2. Fill in the form:
   - **Vendor Name** (required)
   - **Email** (optional)
   - **Phone** (optional)
   - **City**, **Country** (optional, defaults to Nigeria)
   - **Tax ID (TIN)** (optional) — for VAT compliance
   - **Bank Name**, **Account Number** (optional) — for payment processing
   - **Payment Terms** (days) — e.g., 30 = Net 30
   - **Credit Limit** — maximum credit you extend to this vendor
   - **Address**, **Notes** (optional)
3. Click **Save**. A Vendor Code is automatically assigned.

#### Editing and Deleting

Hover over a vendor card to reveal the **Edit** and **Delete** buttons. Deleting a vendor is permanent — their transaction history remains in the journal but the vendor record is removed.

---

### 7.12 Financial Statements

**Finance → Statements**

The Statements page gives you a comprehensive Profit & Loss summary with flexible period selection.

#### Selecting a Period

Three period modes are available using the toggle buttons:
- **Monthly** — pick a specific month and year
- **Yearly** — pick a year for the full 12 months
- **Custom** — pick any From and To dates

Click **Generate** after selecting your period.

#### Summary KPI Cards

| Card | Description |
|------|-------------|
| Total Income | All revenue in the period |
| Total Expenses | All expenses in the period |
| Net Profit / Loss | Income minus Expenses (green = profit, red = loss) |
| Profit Margin | Net profit as a % of income |

**Additional metrics** below the cards: Order Revenue, Cash Sales, and Bank Deposits.

#### Income & Expense Breakdown

Two side-by-side cards show horizontal bar charts breaking down income and expenses by category, so you can see at a glance where your money comes from and where it goes.

#### P&L Statement Table

A full Profit & Loss statement is shown in table format:
- **Revenue section** — each income account with its total, and a TOTAL REVENUE row
- **Expenses section** — each expense account with its total, and a TOTAL EXPENSES row
- **Net Profit / (Loss)** row in bold at the bottom

---

### 7.13 Reports — Trial Balance

**Finance → Reports → Trial Balance**

The Trial Balance verifies that your books are in balance — total debits must equal total credits across all accounts.

#### Generating the Report

1. Set the **From** and **To** dates (defaults to 1 January of the current year to today).
2. Click **Generate**.

#### Reading the Report

A banner at the top of the results confirms whether your books are **balanced** (green tick) or **out of balance** (red alert showing the difference amount).

The table shows every GL account with:
- **Code** and **Account Name** (indented to show hierarchy)
- **Type** badge
- **Period Debit** — total debits posted in the period
- **Period Credit** — total credits posted in the period
- **DR Balance** — net debit balance
- **CR Balance** — net credit balance

A **Totals row** at the bottom sums all columns.

Click **Export CSV** to download the trial balance.

> **Tip:** Run the Trial Balance at the end of each month before preparing financial statements. If it is out of balance, locate and correct the discrepancy in Journal Entries before proceeding.

---

### 7.14 Reports — Income Statement

**Finance → Reports → Income Statement**

The Income Statement (also called Profit & Loss Statement) summarises your business performance over a period — how much you earned, what it cost, and whether you made a profit.

#### Generating the Report

1. Set the **From** and **To** dates.
2. Click **Generate**.

#### Summary KPI Cards

| Card | Description |
|------|-------------|
| Total Revenue | All income earned in the period |
| Gross Profit | Revenue minus Cost of Sales (with gross margin %) |
| Operating Expenses | All operating costs (excluding COGS) |
| Net Profit | Final bottom line (with net margin %) |

Cards appear in green when positive and red when negative (loss).

#### Statement Sections

The full statement is laid out in three sections:

1. **Revenue** — lists every income account and its total. The TOTAL REVENUE line sums them.
2. **Cost of Sales** (only appears if you have COGS accounts) — lists cost-of-goods accounts. A GROSS PROFIT line is calculated.
3. **Operating Expenses** — lists all expense accounts. A TOTAL OPERATING EXPENSES line sums them.

The final **NET PROFIT / (LOSS)** row appears in bold at the bottom with a coloured background — green for profit, red for loss — and shows the profit margin percentage.

Click **Export CSV** to download.

---

### 7.15 Reports — Balance Sheet

**Finance → Reports → Balance Sheet**

The Balance Sheet (Statement of Financial Position) shows what your business **owns** (assets) and what it **owes** (liabilities and equity) at a specific point in time.

The fundamental accounting equation must hold: **Assets = Liabilities + Equity**

#### Generating the Report

1. Set the **As of Date** (defaults to today).
2. Click **Generate**.

#### Balance Indicator

A banner shows whether the balance sheet **balances** (green, Assets = Liabilities + Equity) or is **out of balance** (red, with the difference amount).

#### Statement Sections

1. **Assets** (blue header) — all Asset-type accounts with their balances. TOTAL ASSETS at the bottom.
2. **Liabilities** (red header) — all Liability-type accounts. TOTAL LIABILITIES at the bottom.
3. **Equity** (violet header) — Equity accounts plus Current Year Net Income (pulled from the Income Statement). TOTAL EQUITY at the bottom.
4. **TOTAL LIABILITIES + EQUITY** — final check figure; must equal Total Assets.

Each section shows account Code, Description, and Amount (₦).

Click **Export CSV** to download.

---

## 8. Campaigns

The Campaigns module lets you send marketing messages to your customers via SMS or email.

1. Click **Campaigns** in the sidebar.
2. Click **New Campaign**.
3. Fill in:
   - **Campaign Name**
   - **Channel** — SMS or Email
   - **Target Segment** — All Customers, VIP, Regular, or New
   - **Message / Content**
   - **Schedule** — Send now or set a future date/time
4. Click **Save & Send** (or **Schedule**).

The campaign list shows each campaign's status (Draft, Scheduled, Sent, Failed), the channel, target count, and sent/opened metrics.

---

## 9. AI Assistant

The AI Assistant answers questions about your business data and helps you draft content.

Click **AI Assistant** in the sidebar to open the chat interface. Type your question and press Enter or click Send.

**Example queries:**
- "What were my top 5 selling products last month?"
- "How much did I spend on expenses in Q1?"
- "Write a promotional message for my VIP customers"
- "Which customers haven't ordered in the last 60 days?"

The assistant uses your actual business data to give accurate, contextual answers. All processing happens on your server — your data is never sent to a third-party AI service unless you have configured an external API key.

---

## 10. Settings

Click **Settings** in the sidebar to manage your business configuration.

### Business Profile

- **Store URL** — displayed at the top of the Profile tab. Shows your full public store link (e.g., `https://www.shopysh.com/store/yourslug`). Use the **Copy** button to copy it, or **Open** to preview your store.
- **Business Name** — the name shown to customers on your storefront and invoices.
- **Phone**, **Email**, **Website** — public contact details.
- **Description** — a short paragraph about your business.
- **Address**, **City**, **Country** — your business location.
- **Default Currency** — Nigerian Naira (NGN) or US Dollar (USD). This applies across all financial records, invoices, and reports.

Click **Save Profile** after making changes.

### AI Configuration

Configure your AI assistant:
- **Provider** — Local (Qwen2.5, no cost) or an external OpenAI-compatible API.
- **API Key** — required only for external providers.
- **Model** — the AI model to use.
- **Welcome Message** — the greeting message shown to store visitors in the chat widget.

### Billing

View your current subscription plan, storage usage, and billing history.

### Notifications & Other Tabs

Additional settings tabs cover notification preferences, email/SMTP configuration, SMS configuration, and payment gateway settings.

---

## 11. Team Management

**Settings → Team** (or **Team** in the sidebar)

Add team members and control what they can access.

### User Roles

| Role | Access Level |
|------|-------------|
| **Owner** | Full access to everything, including billing and settings |
| **Admin** | Full access except billing and subscription |
| **Staff** | Access to Products, Orders, Customers, and Payments only |

### Inviting a Team Member

1. Click **Invite Member**.
2. Enter their **email address** and select their **role**.
3. Click **Send Invite**. They receive an email with a login link.

### Managing Members

Click the three-dot menu on any team member row to change their role or remove them from the workspace.

---

## 12. Admin Portal (Super Admin)

The Admin Portal is only accessible to **Super Admins** — the Shopysh platform administrators. Regular business owners do not see this section.

### Tenants Tab

Shows a list of all business workspaces (tenants) on the platform:
- **Business name**, email, and subscription plan badge
- **Subdomain** — shown as a clickable link that opens the tenant's live storefront in a new tab
- **User count**, **Product count**, and other metrics
- **Status badge** — Active or Inactive

Use the **Search** bar to find tenants by name, email, or subdomain. Use the **Status filter** to show Active, Inactive, or All tenants.

### Plans Tab

Manage subscription plans offered on the platform.

Each plan card shows:
- Plan name and price (monthly/yearly)
- **Storage limit in MB** (e.g., 1,024 MB for the Starter plan)
- Feature list
- Number of active subscribers

**To edit a plan:**
1. Click **Edit** on the plan card.
2. Adjust the plan name, price, features, or **Storage (MB)** limit.
3. Click **Save**.

> Storage limits are measured in **megabytes (MB)**. For reference: 1,024 MB = 1 GB.

### Access Codes Tab

Access Codes are one-time invite tokens that allow new businesses to register on the platform.

**To generate an Access Code:**
1. Click **Generate Code**.
2. Select the **Plan** the code grants access to.
3. Select the **Billing Cycle** (monthly or yearly).
4. Optionally set an **Expiry** (number of days until the code expires).
5. Add a **Note** (e.g., "For John's bakery").
6. Click **Generate**.

The code (format: `SHP-XXXX-XXXX-XXXX`) is displayed immediately. Copy and share it with the intended business owner. Each code can only be used **once**.

---

## Appendix A — Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open AI Assistant | Click the AI icon in the sidebar |
| Close a modal | `Escape` key |

---

## Appendix B — Currency & Number Formatting

- All monetary values are displayed in your **Default Currency** (set in Settings → Business Profile).
- Large numbers use comma separators: `1,024,500.00`
- Negative amounts (losses, payments out) appear in **red**.
- Positive amounts (income, receipts) appear in **green**.

---

## Appendix C — Data Export

Most list pages and reports include an **Export CSV** button. The downloaded file opens in Microsoft Excel, Google Sheets, or any spreadsheet application. Exported data reflects the current filter selection (date range, status, etc.).

---

*Last updated: June 2026*  
*For technical support, contact your Shopysh administrator.*
