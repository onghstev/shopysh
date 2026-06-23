# 🛍️ SHOPYSH

**AI-Powered Business Management Platform for African SMEs**

Shopysh helps small and medium businesses in Africa manage their products, orders, customers, finances, and marketing campaigns — all powered by AI.

## ✨ Features

- **Dashboard** — Real-time business analytics and KPIs
- **Products** — Inventory management with variants and categories
- **Orders** — Order processing, tracking, and fulfillment
- **Customers** — CRM with segmentation and communication history
- **Payments** — Payment tracking with NGN/USD support
- **Campaigns** — SMS & email marketing campaigns
- **Finance** — Revenue tracking, expenses, and financial reports
- **Team** — Multi-user roles and permissions
- **AI Assistant** — Powered by DeepSeek (or any OpenAI-compatible API)
- **Storefront** — Public-facing online store per tenant
- **WhatsApp** — Webhook integration for customer messaging

## 🏗️ Architecture

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (Credentials + Google SSO)
- **Styling**: Tailwind CSS + shadcn/ui
- **AI**: Local Qwen2.5 3B via llama.cpp (CPU) — or any OpenAI-compatible API
- **Multi-tenant**: Row-level isolation with tenant subdomain routing

## 🧪 Local Development

To run the full 5-container stack (db · llm · app · nginx · certbot) on your
laptop before pushing to production, see **[LOCAL_DEV.md](./LOCAL_DEV.md)**.

Quick version:
```bash
cp .env.local.example .env.local
docker compose -p shopysh -f docker-compose.local.yml up -d --build
# then open http://localhost:8088
```

## 🚀 Self-Hosted Deployment (Docker)

> ⚠️ **Security note:** earlier exports of this project committed a real `.env`
> with live credentials (database URL, `NEXTAUTH_SECRET`, Google OAuth client
> secret, API keys). Those are now removed and `.env` is git-ignored. **Rotate
> every one of those secrets** if the old file ever reached a remote/GitHub.

### Prerequisites
- Docker & Docker Compose
- A domain name (e.g., `www.shopysh.com`)
- A VPS with **at least 4GB RAM** and 2+ CPU cores (for local AI inference)
- ~2GB disk space for the AI model + ~10GB for the app

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/onghstev/shopysh.git
cd shopysh

# 2. Configure environment
cp .env.example .env
nano .env  # Fill in your secrets

# 3. Start everything
docker compose up -d

# 4. Set up SSL (first time only)
bash deploy/setup-server.sh
```

### Environment Variables

See `.env.example` for all available configuration options.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Random secret for session encryption |
| `NEXTAUTH_URL` | ✅ | Your app's public URL |
| `LLM_API_KEY` | ❌ | Only if using external API (local Qwen2.5 needs no key) |
| `SMTP_HOST` | 📧 | SMTP server for campaign emails |
| `GOOGLE_CLIENT_ID` | ❌ | For Google SSO login |

### Docker Commands

```bash
docker compose up -d          # Start all services
docker compose down            # Stop all services
docker compose logs -f app     # View app logs
docker compose restart app     # Restart app only
docker compose pull app        # Pull latest image
```

## 🔧 Development

```bash
# Install dependencies
yarn install

# Generate Prisma client
yarn prisma generate

# Push schema to database
yarn prisma db push

# Run development server
yarn dev
```

## 🧠 Local AI (Qwen2.5 3B)

Shopysh ships with a **self-hosted AI assistant** — no API keys or subscriptions needed.

- **Model**: Qwen2.5 3B Instruct (Q4_K_M quantized, ~1.93GB)
- **Runtime**: llama.cpp server with OpenAI-compatible API
- **Inference**: CPU-only — works on any VPS, no GPU required
- **Performance**: ~10-25 tokens/sec on 4-core VPS (fast for chat)

The model is downloaded automatically during setup. To adjust performance:

```bash
# Set CPU threads in .env (match your VPS core count)
LLM_THREADS=4

# Monitor LLM server
docker compose logs -f llm

# Check health
curl http://localhost:8080/health
```

To switch to an external API instead (e.g., DeepSeek), set in `.env`:
```bash
LLM_API_KEY=your-api-key
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat
```

## 📦 CI/CD

GitHub Actions automatically builds and deploys on push to `main`.

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | Your server IP address |
| `VPS_USER` | SSH username (e.g., `root`) |
| `VPS_SSH_KEY` | Private SSH key for server access |

## 📄 License

Proprietary — © 2026 Shopysh. All rights reserved.
