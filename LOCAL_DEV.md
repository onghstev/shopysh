# 🧪 Running Shopysh locally (mirrors the 5 production containers)

This runs the same five services you have in production —
**db · llm · app · nginx · certbot** — on your laptop, with the app built from
your local source and served over plain HTTP (no SSL needed locally).

> Requires Docker Desktop (or Docker Engine + Compose v2) and ~6 GB free RAM
> while the LLM is loaded. The app build needs ~2 GB.

---

## 1. One-time setup

```bash
# from the project root (the folder containing docker-compose.local.yml)
cp .env.local.example .env.local
# optional: edit .env.local (set LLM_THREADS to your CPU core count, etc.)
```

### Download the AI model (~1.93 GB, one time)

The `llm` container needs the Qwen2.5 3B model in the `shopysh_llm_models`
Docker volume. Easiest path:

```bash
# Create the volume, then download straight into it
docker volume create shopysh_llm_models
docker run --rm -v shopysh_llm_models:/models curlimages/curl:latest \
  -L --retry 3 -C - \
  -o /models/qwen2.5-3b-instruct-q4_k_m.gguf \
  https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf
```

(On Linux you can instead run `bash deploy/download-model.sh`.)

---

## 2. Start the stack

```bash
docker compose -p shopysh -f docker-compose.local.yml up -d --build
```

The `-p shopysh` keeps the volume name matching `shopysh_llm_models`.

First run builds the app image (a few minutes) and the LLM takes ~1–2 min to
load the model. Watch progress:

```bash
docker compose -p shopysh -f docker-compose.local.yml logs -f app
docker compose -p shopysh -f docker-compose.local.yml logs -f llm
```

---

## 3. Open it

- **Through nginx (prod-like):** http://localhost:8088
- **Directly to the app:** http://localhost:3000

The database schema is applied automatically on app startup
(`prisma db push` runs in the container entrypoint).

### Create your first admin user

The DB starts empty. Seed a tenant + admin (run inside the app container):

```bash
docker compose -p shopysh -f docker-compose.local.yml exec app \
  node ./node_modules/prisma/build/index.js db seed
```

> Note: the seed script lives at `scripts/safe-seed.ts`. If you prefer to run it
> against the DB from your host, see "Fast loop" below.

---

## 4. Everyday commands

```bash
# stop everything
docker compose -p shopysh -f docker-compose.local.yml down

# rebuild after code changes
docker compose -p shopysh -f docker-compose.local.yml up -d --build app

# tail logs
docker compose -p shopysh -f docker-compose.local.yml logs -f app

# reset the database (wipes local data)
docker compose -p shopysh -f docker-compose.local.yml down -v
```

---

## Fast loop (optional, no Docker rebuilds)

For quick UI/iteration work you can run just the supporting containers in Docker
and the app with hot-reload on your host:

```bash
# start only db + llm in Docker
docker compose -p shopysh -f docker-compose.local.yml up -d db llm

# in another terminal, run the app natively
npm install --legacy-peer-deps
npx prisma generate
# point the app at the dockerized db + llm
export DATABASE_URL="postgresql://shopysh:shopysh_local@localhost:5432/shopysh?schema=public"
export NEXTAUTH_SECRET="local_dev_secret_change_me"
export NEXTAUTH_URL="http://localhost:3000"
export LLM_BASE_URL="http://localhost:8080/v1"
export LLM_MODEL="qwen2.5-3b-instruct"
npx prisma db push
npm run dev
```

Then open http://localhost:3000. This gives you Next.js hot-reload while still
using the real Postgres and the real local LLM.

---

## When you're happy → production

1. Commit and push to `main`.
2. GitHub Actions builds the image, pushes it to `ghcr.io/onghstev/shopysh`,
   and redeploys to your VPS (`docker compose pull app && up -d app`).

Nothing about the local files needs to change for production — production uses
`docker-compose.yml`, local uses `docker-compose.local.yml`.
