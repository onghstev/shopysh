#!/bin/bash
# ============================================
# Shopysh - Initial Server Setup for Contabo VPS
# Run this ONCE on a fresh Ubuntu 22.04+ VPS
# Minimum: 4GB RAM, 2 CPU cores, 20GB disk
# ============================================
set -e

DOMAIN="www.shopysh.com"
EMAIL="admin@shopysh.com"  # For Let's Encrypt notifications

echo "🚀 Setting up Shopysh server..."

# 1. System updates
echo "📦 Updating system..."
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 3. Install Docker Compose
echo "📋 Installing Docker Compose..."
sudo apt install -y docker-compose-plugin curl

# 4. Create app directory
echo "📁 Creating app directory..."
mkdir -p /opt/shopysh
cd /opt/shopysh

# 5. Clone the repository (if not already done)
if [ ! -d ".git" ]; then
  echo "📥 Clone the repository first:"
  echo "  git clone https://github.com/onghstev/shopysh.git /opt/shopysh"
  echo "  cd /opt/shopysh"
  echo "  cp .env.example .env"
  echo "  nano .env  # Edit with your secrets"
  exit 1
fi

# 6. Download the LLM model
echo "🧠 Downloading AI model (Qwen2.5 3B Instruct Q4)..."
echo "   This is ~1.93 GB."
bash deploy/download-model.sh

# 7. Set up SSL with Let's Encrypt
echo "🔒 Setting up SSL..."

# Use initial nginx config (HTTP only) first
cp deploy/nginx-initial.conf deploy/nginx.conf.bak
cp deploy/nginx-initial.conf deploy/nginx.conf

# Start services without SSL
echo "🚀 Starting services (DB + LLM + App + Nginx)..."
docker compose up -d db llm app nginx

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 15

# Get SSL certificate
echo "🔐 Requesting SSL certificate..."
docker compose run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos --no-eff-email \
  -d $DOMAIN -d shopysh.com

# Restore full SSL nginx config
cp deploy/nginx.conf.bak deploy/nginx.conf || true
rm -f deploy/nginx.conf.bak

# Reload nginx with SSL config
docker compose restart nginx

echo ""
echo "✅ Shopysh is deployed!"
echo "🌐 Visit: https://$DOMAIN"
echo "🧠 AI:    Qwen2.5 3B running locally (CPU) — no API costs!"
echo ""
echo "📝 Useful commands:"
echo "  docker compose logs -f app    # View app logs"
echo "  docker compose logs -f llm    # View LLM server logs"
echo "  docker compose logs -f db     # View DB logs"
echo "  docker compose restart app    # Restart app"
echo "  docker compose restart llm    # Restart LLM server"
echo "  docker compose down            # Stop all"
echo "  docker compose up -d           # Start all"
echo ""
echo "💡 LLM Performance Tips:"
echo "  - Set LLM_THREADS in .env to match your CPU cores (default: 4)"
echo "  - Monitor: docker compose logs -f llm"
echo "  - Health: curl http://localhost:8080/health"
