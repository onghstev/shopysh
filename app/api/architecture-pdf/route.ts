export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #fff; color: #1a1a2e; }
  
  .page { page-break-after: always; padding: 48px; min-height: 100vh; }
  .page:last-child { page-break-after: avoid; }

  /* ===== COVER PAGE ===== */
  .cover { background: linear-gradient(135deg, #0d3320 0%, #145a38 40%, #1a7a4c 100%); color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
  .cover-badge { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); padding: 8px 24px; border-radius: 100px; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 32px; }
  .cover h1 { font-size: 52px; font-weight: 800; line-height: 1.1; margin-bottom: 16px; }
  .cover h1 span { color: #6ee7b7; }
  .cover p { font-size: 18px; opacity: 0.7; max-width: 500px; line-height: 1.6; }
  .cover-footer { position: absolute; bottom: 48px; font-size: 13px; opacity: 0.4; }

  /* ===== SECTION HEADERS ===== */
  .section-header { text-align: center; margin-bottom: 40px; }
  .section-num { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; width: 36px; height: 36px; border-radius: 50%; line-height: 36px; font-size: 14px; font-weight: 700; margin-bottom: 12px; }
  .section-header h2 { font-size: 28px; font-weight: 800; color: #0d3320; margin-bottom: 6px; }
  .section-header p { font-size: 14px; color: #6b7280; }

  /* ===== FLOW CHART STYLES ===== */
  .flow-container { display: flex; flex-direction: column; align-items: center; gap: 0; }
  .flow-row { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
  .flow-box { padding: 14px 20px; border-radius: 12px; font-size: 13px; font-weight: 600; text-align: center; min-width: 140px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .flow-arrow { font-size: 24px; color: #10b981; font-weight: 800; }
  .flow-arrow-down { text-align: center; font-size: 24px; color: #10b981; font-weight: 800; padding: 4px 0; }

  .fb-green { background: #ecfdf5; border: 2px solid #10b981; color: #065f46; }
  .fb-blue { background: #eff6ff; border: 2px solid #3b82f6; color: #1e40af; }
  .fb-purple { background: #faf5ff; border: 2px solid #8b5cf6; color: #5b21b6; }
  .fb-orange { background: #fff7ed; border: 2px solid #f97316; color: #9a3412; }
  .fb-red { background: #fef2f2; border: 2px solid #ef4444; color: #991b1b; }
  .fb-teal { background: #f0fdfa; border: 2px solid #14b8a6; color: #134e4a; }
  .fb-pink { background: #fdf2f8; border: 2px solid #ec4899; color: #9d174d; }
  .fb-yellow { background: #fefce8; border: 2px solid #eab308; color: #854d0e; }
  .fb-gray { background: #f9fafb; border: 2px solid #9ca3af; color: #374151; }
  .fb-indigo { background: #eef2ff; border: 2px solid #6366f1; color: #3730a3; }

  /* ===== ARCHITECTURE BOXES ===== */
  .arch-layer { background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 16px; padding: 24px; margin-bottom: 16px; }
  .arch-layer-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #6b7280; margin-bottom: 14px; }
  .arch-grid { display: flex; gap: 12px; flex-wrap: wrap; }
  .arch-item { flex: 1; min-width: 120px; max-width: 200px; background: white; border-radius: 10px; padding: 14px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }
  .arch-item .icon { font-size: 24px; margin-bottom: 6px; }
  .arch-item .label { font-size: 12px; font-weight: 600; color: #1f2937; }
  .arch-item .sub { font-size: 10px; color: #9ca3af; margin-top: 2px; }

  /* ===== TABLE STYLES ===== */
  .desc-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  .desc-table th { background: #0d3320; color: white; padding: 10px 14px; font-size: 12px; font-weight: 600; text-align: left; }
  .desc-table td { padding: 10px 14px; font-size: 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  .desc-table tr:nth-child(even) { background: #f9fafb; }
  .desc-table .module-badge { display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 10px; font-weight: 600; }

  /* ===== DATA FLOW ===== */
  .data-flow-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .df-card { background: white; border: 2px solid #e5e7eb; border-radius: 14px; padding: 20px; }
  .df-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .df-card-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .df-card h4 { font-size: 14px; font-weight: 700; }
  .df-step { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
  .df-step-num { width: 22px; height: 22px; border-radius: 50%; background: #10b981; color: white; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .df-step-text { font-size: 12px; color: #4b5563; line-height: 1.5; }

  /* ===== SECURITY ===== */
  .security-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .sec-card { background: white; border-radius: 12px; padding: 18px; border: 1px solid #e5e7eb; text-align: center; }
  .sec-card .sec-icon { font-size: 28px; margin-bottom: 8px; }
  .sec-card h4 { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
  .sec-card p { font-size: 11px; color: #6b7280; line-height: 1.4; }
</style>
</head>
<body>

<!-- ==================== PAGE 1: COVER ==================== -->
<div class="page cover">
  <div class="cover-badge">Technical Architecture Document</div>
  <h1>SHOPYSH</h1>
  <p>AI-Powered Business Management Assistant for African SMEs — Complete System Architecture & Data Flow Documentation</p>
  <div class="cover-footer">Version 1.0 &bull; June 2026 &bull; Confidential</div>
</div>

<!-- ==================== PAGE 2: HIGH-LEVEL ARCHITECTURE ==================== -->
<div class="page">
  <div class="section-header">
    <div class="section-num">1</div>
    <h2>High-Level System Architecture</h2>
    <p>Complete technology stack and infrastructure overview</p>
  </div>

  <!-- Presentation Layer -->
  <div class="arch-layer" style="border-color: #3b82f6;">
    <div class="arch-layer-title" style="color: #3b82f6;">&#x1F310; Presentation Layer (Frontend)</div>
    <div class="arch-grid">
      <div class="arch-item"><div class="icon">&#x1F3A8;</div><div class="label">Dashboard UI</div><div class="sub">React + Tailwind CSS</div></div>
      <div class="arch-item"><div class="icon">&#x1F4CA;</div><div class="label">Analytics Views</div><div class="sub">Charts & Reports</div></div>
      <div class="arch-item"><div class="icon">&#x1F4AC;</div><div class="label">Conversations</div><div class="sub">Real-time Chat UI</div></div>
      <div class="arch-item"><div class="icon">&#x1F4E6;</div><div class="label">Product Mgmt</div><div class="sub">CRUD Interface</div></div>
      <div class="arch-item"><div class="icon">&#x1F465;</div><div class="label">Customer CRM</div><div class="sub">Profiles & Tags</div></div>
      <div class="arch-item"><div class="icon">&#x2699;</div><div class="label">Settings</div><div class="sub">Configuration UI</div></div>
    </div>
  </div>

  <!-- Application Layer -->
  <div class="arch-layer" style="border-color: #10b981;">
    <div class="arch-layer-title" style="color: #10b981;">&#x2699; Application Layer (Backend API)</div>
    <div class="arch-grid">
      <div class="arch-item"><div class="icon">&#x1F512;</div><div class="label">Auth System</div><div class="sub">NextAuth + Google SSO</div></div>
      <div class="arch-item"><div class="icon">&#x1F4AC;</div><div class="label">Chat Widget</div><div class="sub">Embeddable Web Chat</div></div>
      <div class="arch-item"><div class="icon">&#x1F9E0;</div><div class="label">AI Engine</div><div class="sub">LLM Chat Assistant</div></div>
      <div class="arch-item"><div class="icon">&#x1F4B3;</div><div class="label">Payments</div><div class="sub">Paystack + Flutterwave</div></div>
      <div class="arch-item"><div class="icon">&#x1F4E3;</div><div class="label">Campaigns</div><div class="sub">Broadcast Engine</div></div>
      <div class="arch-item"><div class="icon">&#x1F4C8;</div><div class="label">Analytics</div><div class="sub">Metrics & Events</div></div>
    </div>
  </div>

  <!-- Data Layer -->
  <div class="arch-layer" style="border-color: #8b5cf6;">
    <div class="arch-layer-title" style="color: #8b5cf6;">&#x1F4BE; Data Layer (Storage & Persistence)</div>
    <div class="arch-grid">
      <div class="arch-item"><div class="icon">&#x1F5C4;</div><div class="label">PostgreSQL</div><div class="sub">Primary Database</div></div>
      <div class="arch-item"><div class="icon">&#x1F504;</div><div class="label">Prisma ORM</div><div class="sub">Data Access Layer</div></div>
      <div class="arch-item"><div class="icon">&#x1F465;</div><div class="label">Multi-Tenancy</div><div class="sub">Tenant Isolation</div></div>
      <div class="arch-item"><div class="icon">&#x1F6E1;</div><div class="label">Soft Deletes</div><div class="sub">Data Safety</div></div>
    </div>
  </div>

  <!-- External Services -->
  <div class="arch-layer" style="border-color: #f97316;">
    <div class="arch-layer-title" style="color: #f97316;">&#x1F517; External Integrations</div>
    <div class="arch-grid">
      <div class="arch-item"><div class="icon">&#x1F4F1;</div><div class="label">Chat Widget</div><div class="sub">Embeddable Web Chat</div></div>
      <div class="arch-item"><div class="icon">&#x1F4B0;</div><div class="label">Paystack</div><div class="sub">Nigerian Payments</div></div>
      <div class="arch-item"><div class="icon">&#x1F4B8;</div><div class="label">Flutterwave</div><div class="sub">African Payments</div></div>
      <div class="arch-item"><div class="icon">&#x1F310;</div><div class="label">Google SSO</div><div class="sub">OAuth 2.0</div></div>
      <div class="arch-item"><div class="icon">&#x1F4CA;</div><div class="label">Google Analytics</div><div class="sub">GA4 Tracking</div></div>
    </div>
  </div>
</div>

<!-- ==================== PAGE 3: USER AUTHENTICATION FLOW ==================== -->
<div class="page">
  <div class="section-header">
    <div class="section-num">2</div>
    <h2>User Authentication Flow</h2>
    <p>How users sign up, log in, and access the platform</p>
  </div>

  <div class="flow-container">
    <div class="flow-row">
      <div class="flow-box fb-blue">&#x1F464; User visits app</div>
    </div>
    <div class="flow-arrow-down">&#x25BC;</div>
    <div class="flow-row">
      <div class="flow-box fb-green">&#x1F512; Login Page</div>
    </div>
    <div class="flow-arrow-down">&#x25BC;</div>
    <div class="flow-row">
      <div class="flow-box fb-purple">&#x2709; Email + Password</div>
      <span style="font-size:14px;color:#6b7280;font-weight:600;">OR</span>
      <div class="flow-box fb-orange">&#x1F310; Google SSO</div>
    </div>
    <div class="flow-arrow-down">&#x25BC;</div>
    <div class="flow-row">
      <div class="flow-box fb-teal">&#x1F50D; NextAuth Validates</div>
    </div>
    <div class="flow-arrow-down">&#x25BC;</div>
    <div class="flow-row">
      <div class="flow-box fb-green">&#x1F3E2; Tenant Resolved</div>
      <span class="flow-arrow">&#x25B6;</span>
      <div class="flow-box fb-blue">&#x1F4CB; JWT Token Issued</div>
    </div>
    <div class="flow-arrow-down">&#x25BC;</div>
    <div class="flow-row">
      <div class="flow-box fb-green" style="border-width:3px;">&#x2705; Dashboard Access Granted</div>
    </div>
  </div>

  <table class="desc-table" style="margin-top: 30px;">
    <tr><th>Step</th><th>Component</th><th>Description</th></tr>
    <tr><td>1</td><td>Login Page</td><td>User selects credentials login or Google SSO. Split-layout with branding.</td></tr>
    <tr><td>2</td><td>NextAuth.js</td><td>Handles authentication via CredentialsProvider or GoogleProvider with bcrypt password verification.</td></tr>
    <tr><td>3</td><td>Tenant Resolution</td><td>User's tenantId is loaded from the database. For new Google SSO users, a tenant is auto-created.</td></tr>
    <tr><td>4</td><td>JWT Session</td><td>JWT token stores userId, tenantId, role, and tenant settings. Session persists across requests.</td></tr>
    <tr><td>5</td><td>Role-Based Routing</td><td>SUPER_ADMIN goes to /admin, TENANT_ADMIN and STAFF go to /dashboard.</td></tr>
  </table>
</div>

<!-- ==================== PAGE 4: CHAT WIDGET INTEGRATION FLOW ==================== -->
<div class="page">
  <div class="section-header">
    <div class="section-num">3</div>
    <h2>Chat Widget Integration</h2>
    <p>Inbound message processing and outbound campaign broadcasting</p>
  </div>

  <h3 style="font-size:16px;font-weight:700;color:#0d3320;margin-bottom:16px;">&#x1F4E9; Inbound Message Flow</h3>
  <div class="flow-container" style="margin-bottom:30px;">
    <div class="flow-row">
      <div class="flow-box fb-green">&#x1F4F1; Customer sends chat message</div>
    </div>
    <div class="flow-arrow-down">&#x25BC;</div>
    <div class="flow-row">
      <div class="flow-box fb-blue">&#x1F310; Meta Cloud API</div>
      <span class="flow-arrow">&#x25B6;</span>
      <div class="flow-box fb-purple">/api/widget/[tenantId]/messages (POST)</div>
    </div>
    <div class="flow-arrow-down">&#x25BC;</div>
    <div class="flow-row">
      <div class="flow-box fb-teal">&#x1F50D; Match Phone Number ID &#x2192; Tenant</div>
    </div>
    <div class="flow-arrow-down">&#x25BC;</div>
    <div class="flow-row">
      <div class="flow-box fb-orange">&#x1F464; Find/Create Customer</div>
      <span class="flow-arrow">&#x25B6;</span>
      <div class="flow-box fb-pink">&#x1F4AC; Find/Create Conversation</div>
      <span class="flow-arrow">&#x25B6;</span>
      <div class="flow-box fb-indigo">&#x1F4BE; Store Message</div>
    </div>
  </div>

  <h3 style="font-size:16px;font-weight:700;color:#0d3320;margin-bottom:16px;">&#x1F4E4; Campaign Broadcast Flow</h3>
  <div class="flow-container">
    <div class="flow-row">
      <div class="flow-box fb-blue">&#x1F4DD; Create Campaign (name, message, segment)</div>
    </div>
    <div class="flow-arrow-down">&#x25BC;</div>
    <div class="flow-row">
      <div class="flow-box fb-purple">&#x1F3AF; Filter Customers by Segment</div>
    </div>
    <div class="flow-arrow-down">&#x25BC;</div>
    <div class="flow-row">
      <div class="flow-box fb-green">&#x1F504; Loop: Send message to each customer</div>
    </div>
    <div class="flow-arrow-down">&#x25BC;</div>
    <div class="flow-row">
      <div class="flow-box fb-orange">&#x1F4F1; Chat Widget (Embedded on tenant website)</div>
    </div>
    <div class="flow-arrow-down">&#x25BC;</div>
    <div class="flow-row">
      <div class="flow-box fb-teal">&#x2705; Track: sent / failed per customer</div>
      <span class="flow-arrow">&#x25B6;</span>
      <div class="flow-box fb-indigo">&#x1F4CA; Update campaign stats</div>
    </div>
  </div>
</div>

<!-- ==================== PAGE 5: ORDER & PAYMENT FLOW ==================== -->
<div class="page">
  <div class="section-header">
    <div class="section-num">4</div>
    <h2>Order & Payment Processing</h2>
    <p>End-to-end order lifecycle and payment integration</p>
  </div>

  <div class="data-flow-grid">
    <div class="df-card" style="border-color: #3b82f6;">
      <div class="df-card-header">
        <div class="df-card-icon" style="background:#eff6ff;">&#x1F6D2;</div>
        <h4>Order Lifecycle</h4>
      </div>
      <div class="df-step"><div class="df-step-num">1</div><div class="df-step-text">Customer places order (via chat widget or dashboard)</div></div>
      <div class="df-step"><div class="df-step-num">2</div><div class="df-step-text">Order created with status <strong>PENDING</strong></div></div>
      <div class="df-step"><div class="df-step-num">3</div><div class="df-step-text">Business confirms &#x2192; <strong>CONFIRMED</strong></div></div>
      <div class="df-step"><div class="df-step-num">4</div><div class="df-step-text">Processing &#x2192; <strong>READY_FOR_PICKUP</strong></div></div>
      <div class="df-step"><div class="df-step-num">5</div><div class="df-step-text">Dispatch &#x2192; <strong>OUT_FOR_DELIVERY</strong></div></div>
      <div class="df-step"><div class="df-step-num">6</div><div class="df-step-text">Complete &#x2192; <strong>DELIVERED</strong></div></div>
      <div class="df-step"><div class="df-step-num">7</div><div class="df-step-text">Customer metrics updated (total orders, lifetime value)</div></div>
    </div>

    <div class="df-card" style="border-color: #10b981;">
      <div class="df-card-header">
        <div class="df-card-icon" style="background:#ecfdf5;">&#x1F4B3;</div>
        <h4>Payment Processing</h4>
      </div>
      <div class="df-step"><div class="df-step-num">1</div><div class="df-step-text">Payment initialized via <strong>/api/payments/initialize</strong></div></div>
      <div class="df-step"><div class="df-step-num">2</div><div class="df-step-text">Redirect to Paystack or Flutterwave checkout</div></div>
      <div class="df-step"><div class="df-step-num">3</div><div class="df-step-text">Customer completes payment on gateway</div></div>
      <div class="df-step"><div class="df-step-num">4</div><div class="df-step-text">Webhook received at <strong>/api/payments/webhook/*</strong></div></div>
      <div class="df-step"><div class="df-step-num">5</div><div class="df-step-text">Signature verified (HMAC-SHA512 for Paystack)</div></div>
      <div class="df-step"><div class="df-step-num">6</div><div class="df-step-text">Payment status updated to <strong>COMPLETED</strong></div></div>
      <div class="df-step"><div class="df-step-num">7</div><div class="df-step-text">Order linked and customer LTV recalculated</div></div>
    </div>
  </div>

  <h3 style="font-size:16px;font-weight:700;color:#0d3320;margin: 24px 0 12px;">&#x1F504; Order Status Transitions</h3>
  <div class="flow-container">
    <div class="flow-row">
      <div class="flow-box fb-gray">PENDING</div>
      <span class="flow-arrow">&#x25B6;</span>
      <div class="flow-box fb-blue">CONFIRMED</div>
      <span class="flow-arrow">&#x25B6;</span>
      <div class="flow-box fb-purple">PROCESSING</div>
      <span class="flow-arrow">&#x25B6;</span>
      <div class="flow-box fb-orange">READY</div>
      <span class="flow-arrow">&#x25B6;</span>
      <div class="flow-box fb-teal">DELIVERY</div>
      <span class="flow-arrow">&#x25B6;</span>
      <div class="flow-box fb-green" style="border-width:3px;">DELIVERED</div>
    </div>
  </div>
</div>

<!-- ==================== PAGE 6: DATA MODEL ==================== -->
<div class="page">
  <div class="section-header">
    <div class="section-num">5</div>
    <h2>Core Data Model</h2>
    <p>Database entities and their relationships</p>
  </div>

  <table class="desc-table">
    <tr><th>Entity</th><th>Key Fields</th><th>Relationships</th><th>Purpose</th></tr>
    <tr><td><span class="module-badge" style="background:#ecfdf5;color:#065f46;">Tenant</span></td><td>name, currency, plan</td><td>Has many: Users, Products, Customers, Orders</td><td>Multi-tenant business isolation</td></tr>
    <tr><td><span class="module-badge" style="background:#eff6ff;color:#1e40af;">User</span></td><td>email, role, tenantId</td><td>Belongs to Tenant; Has Accounts (SSO)</td><td>Authentication & authorization</td></tr>
    <tr><td><span class="module-badge" style="background:#faf5ff;color:#5b21b6;">Product</span></td><td>name, price, stock, SKU</td><td>Belongs to Tenant, Category</td><td>Product catalog management</td></tr>
    <tr><td><span class="module-badge" style="background:#fff7ed;color:#9a3412;">Customer</span></td><td>phone, name, segment, LTV</td><td>Belongs to Tenant; Has Orders, Conversations, Tags</td><td>CRM with RFM segmentation</td></tr>
    <tr><td><span class="module-badge" style="background:#fef2f2;color:#991b1b;">Order</span></td><td>status, total, items</td><td>Belongs to Tenant, Customer; Has Payments</td><td>Order lifecycle tracking</td></tr>
    <tr><td><span class="module-badge" style="background:#f0fdfa;color:#134e4a;">Payment</span></td><td>amount, gateway, status</td><td>Belongs to Order, Tenant</td><td>Payment transaction records</td></tr>
    <tr><td><span class="module-badge" style="background:#fdf2f8;color:#9d174d;">Conversation</span></td><td>channel, status, sessionId</td><td>Belongs to Customer, Tenant; Has Messages</td><td>Chat conversation threads</td></tr>
    <tr><td><span class="module-badge" style="background:#eef2ff;color:#3730a3;">Message</span></td><td>direction, type, text</td><td>Belongs to Conversation</td><td>Individual chat messages</td></tr>
    <tr><td><span class="module-badge" style="background:#fefce8;color:#854d0e;">Campaign</span></td><td>name, template, segment</td><td>Belongs to Tenant; Has CampaignMessages</td><td>Marketing broadcast campaigns</td></tr>
    <tr><td><span class="module-badge" style="background:#ecfdf5;color:#065f46;">AIConfig</span></td><td>personality, welcomeMessage</td><td>Belongs to Tenant (1:1)</td><td>AI assistant configuration per tenant</td></tr>
  </table>
</div>

<!-- ==================== PAGE 7: MODULES & SECURITY ==================== -->
<div class="page">
  <div class="section-header">
    <div class="section-num">6</div>
    <h2>Application Modules & Security</h2>
    <p>Feature modules and security architecture</p>
  </div>

  <table class="desc-table" style="margin-bottom:30px;">
    <tr><th>Module</th><th>Pages</th><th>API Routes</th><th>Features</th></tr>
    <tr><td><span class="module-badge" style="background:#ecfdf5;color:#065f46;">Dashboard</span></td><td>/dashboard</td><td>/api/dashboard/stats</td><td>Revenue, orders, customers, products overview with stat cards</td></tr>
    <tr><td><span class="module-badge" style="background:#eff6ff;color:#1e40af;">Products</span></td><td>/products, /products/new, /products/[id]</td><td>/api/products, /api/categories</td><td>Full CRUD, categories, stock tracking, low-stock alerts</td></tr>
    <tr><td><span class="module-badge" style="background:#fff7ed;color:#9a3412;">Orders</span></td><td>/orders, /orders/[id]</td><td>/api/orders, /api/orders/[id]/status</td><td>Order management, status updates, item tracking</td></tr>
    <tr><td><span class="module-badge" style="background:#faf5ff;color:#5b21b6;">Customers</span></td><td>/customers, /customers/[id]</td><td>/api/customers, /api/customers/[id]/tags</td><td>CRM, add/edit/delete, tags, timeline, RFM segmentation</td></tr>
    <tr><td><span class="module-badge" style="background:#fdf2f8;color:#9d174d;">Payments</span></td><td>/payments</td><td>/api/payments/*, webhook routes</td><td>Paystack & Flutterwave integration, webhook processing</td></tr>
    <tr><td><span class="module-badge" style="background:#eef2ff;color:#3730a3;">Campaigns</span></td><td>/campaigns</td><td>/api/campaigns/[id]/send</td><td>Broadcast campaigns, segment targeting, delivery tracking</td></tr>
    <tr><td><span class="module-badge" style="background:#f0fdfa;color:#134e4a;">Conversations</span></td><td>/conversations</td><td>/api/conversations, webhooks</td><td>Chat threads, message history</td></tr>
    <tr><td><span class="module-badge" style="background:#fefce8;color:#854d0e;">AI Assistant</span></td><td>/ai-assistant</td><td>/api/ai/chat</td><td>LLM-powered business assistant for queries</td></tr>
    <tr><td><span class="module-badge" style="background:#fef2f2;color:#991b1b;">Analytics</span></td><td>/analytics</td><td>/api/analytics</td><td>Revenue charts, customer growth, order trends</td></tr>
    <tr><td><span class="module-badge" style="background:#ecfdf5;color:#065f46;">Team</span></td><td>/team</td><td>/api/team</td><td>Invite/manage team members, role assignment</td></tr>
    <tr><td><span class="module-badge" style="background:#eff6ff;color:#1e40af;">Reports</span></td><td>/reports</td><td>/api/reports/export</td><td>CSV export for orders, products, customers, payments</td></tr>
    <tr><td><span class="module-badge" style="background:#faf5ff;color:#5b21b6;">Admin</span></td><td>/admin</td><td>/api/admin/*</td><td>Super admin panel: tenant management, platform overview</td></tr>
  </table>

  <h3 style="font-size:16px;font-weight:700;color:#0d3320;margin-bottom:14px;">&#x1F6E1; Security Architecture</h3>
  <div class="security-grid">
    <div class="sec-card"><div class="sec-icon">&#x1F512;</div><h4>Authentication</h4><p>NextAuth.js with JWT sessions, bcrypt password hashing, Google OAuth 2.0</p></div>
    <div class="sec-card"><div class="sec-icon">&#x1F3E2;</div><h4>Multi-Tenancy</h4><p>Every query filtered by tenantId. Complete data isolation between businesses</p></div>
    <div class="sec-card"><div class="sec-icon">&#x1F6E1;</div><h4>API Protection</h4><p>All API routes verify session. 401 for unauthenticated, role-based access control</p></div>
    <div class="sec-card"><div class="sec-icon">&#x1F4DD;</div><h4>Webhook Security</h4><p>HMAC-SHA512 signature verification for Paystack; Hash verification for Flutterwave</p></div>
    <div class="sec-card"><div class="sec-icon">&#x1F504;</div><h4>Soft Deletes</h4><p>Records are never hard-deleted. deletedAt timestamp preserves data integrity</p></div>
    <div class="sec-card"><div class="sec-icon">&#x1F510;</div><h4>Token Storage</h4><p>Sensitive tokens stored encrypted in DB, hidden in API responses</p></div>
  </div>
</div>

</body>
</html>
`;

async function generatePdfWithPuppeteer(): Promise<Buffer | null> {
  try {
    const puppeteerModule = await import(/* webpackIgnore: true */ 'puppeteer');
    const puppeteer = puppeteerModule.default || puppeteerModule;
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(HTML_CONTENT, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
    await browser.close();
    return Buffer.from(pdfBuffer);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // Generate PDF using puppeteer (available in Docker)
    const pdfBuffer = await generatePdfWithPuppeteer();

    if (!pdfBuffer) {
      return NextResponse.json(
        { error: 'PDF generation not available. Install puppeteer or configure platform API.' },
        { status: 500 }
      );
    }

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Shopysh_Architecture.pdf"',
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
