# Deploy Sentinel on AWS (free tier)

This guide targets a **cost-conscious demo deployment** using AWS Free Tier resources.

## Recommended architecture

| Component | AWS service | Why |
|-----------|-------------|-----|
| React SPA | **Amplify Hosting** | Free tier build minutes, HTTPS, CDN, Git deploys |
| ASP.NET API | **EC2 t3.micro** + Docker | Persistent EBS for SQLite DB + evidence files |
| Secrets | **SSM Parameter Store** (optional) | Free tier; store `Jwt__SigningKey` |

> **Why not Lambda / App Runner alone?** Sentinel stores SQLite and evidence files on disk. Stateless serverless hosts lose data on redeploy unless you add RDS + S3 (more setup, often not free).

Alternative: run **both** frontend and API on one EC2 instance using `docker-compose.yml` (skip Amplify).

---

## Cost estimate (demo)

| Service | Free tier (approx.) |
|---------|---------------------|
| EC2 t3.micro | 750 hours/month (12 months) |
| EBS 30 GB | 30 GB-month (12 months) |
| Amplify Hosting | 1000 build min + 15 GB served/month |
| Data transfer | First 100 GB/month outbound |

Stay within one region (e.g. `ap-southeast-2` Sydney) to minimise latency for Australian demo users.

---

## Part 1 — API on EC2

### 1. Launch EC2

1. AMI: **Amazon Linux 2023** or **Ubuntu 22.04**
2. Instance: **t3.micro** (free tier eligible)
3. Storage: **20–30 GB gp3** EBS (same volume holds DB + uploads)
4. Security group inbound:
   - **22** — SSH (your IP only)
   - **8080** — API (temporary; lock down after adding HTTPS reverse proxy)
   - **80 / 443** — if serving frontend from same host

### 2. Install Docker on the instance

Amazon Linux example:

```bash
sudo yum update -y
sudo yum install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
# log out and back in
```

### 3. Clone and configure

```bash
git clone <your-repo-url> sentinel
cd sentinel/deploy/aws
cp .env.example .env
nano .env   # set JWT_SIGNING_KEY, FRONTEND_ORIGIN, VITE_API_BASE_URL, bootstrap caseworker
mkdir -p data
chmod 700 data
```

Generate a signing key:

```bash
openssl rand -base64 64
```

Set in `.env`:

```env
JWT_SIGNING_KEY=<paste-generated-key>
FRONTEND_ORIGIN=http://3.104.237.26
VITE_API_BASE_URL=/api
VITE_SITE_URL=http://3.104.237.26
SEED_BOOTSTRAP_CASEWORKER_EMAIL=admin@example.com
SEED_BOOTSTRAP_CASEWORKER_PASSWORD=<strong-password>
SEED_BOOTSTRAP_CASEWORKER_FULL_NAME=Sentinel Admin
```

Use your **Elastic IP** (or public IP) for `FRONTEND_ORIGIN` and `VITE_SITE_URL`. Use `http://` unless you terminate HTTPS on the instance. These must match what users type in the browser. `VITE_SITE_URL` is baked into SEO meta tags, `robots.txt`, and `sitemap.xml` when the `web` image builds.

The API creates the bootstrap caseworker **once** on first startup if that email does not exist. Demo sample complaints are **not** seeded in Production.

### 4. Start API only (Amplify frontend)

```bash
docker compose up -d --build api
docker compose logs -f api
```

Verify:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/health/ready
```

Point Amplify `VITE_API_BASE_URL` at `http://<EC2_PUBLIC_IP>:8080/api` for first test, then move to HTTPS (see below).

### 5. Start API + web on same EC2 (optional)

```bash
docker compose up -d --build
```

Open `http://<EC2_PUBLIC_IP>/` for the SPA and port 8080 for API.

---

## Part 2 — Frontend on Amplify

1. AWS Console → **Amplify** → Create app → Connect GitHub repo
2. App root: `sentinel-web`
3. Build settings (amplify.yml or console):

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

4. Environment variable:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://<your-api-host>/api` |

5. Deploy → copy Amplify URL → update EC2 `.env` `FRONTEND_ORIGIN` → restart API:

```bash
docker compose up -d --force-recreate api
```

---

## HTTPS (recommended before submission)

Browsers block mixed content if Amplify (HTTPS) calls HTTP API.

Options:

1. **Application Load Balancer** + ACM certificate (not free tier; production)
2. **Caddy / nginx** on EC2 with Let's Encrypt (free; good for demo)
3. **Cloudflare Tunnel** to EC2:8080 (free tier friendly)

Minimal Caddy on EC2 (install Caddy, `Caddyfile`):

```
api.demo.example.com {
    reverse_proxy localhost:8080
}
```

Update `VITE_API_BASE_URL` to `https://api.demo.example.com/api` and rebuild Amplify.

---

## Health checks

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Liveness — process is up |
| `GET /health/ready` | Readiness — database reachable |

Use `/health/ready` for load balancer or Docker health checks.

---

## Environment variable reference

| Variable | Required | Description |
|----------|----------|-------------|
| `Jwt__SigningKey` | Yes (Production) | JWT signing secret; API refuses to start without it |
| `Cors__AllowedOrigins__0` | Yes | Exact Amplify / frontend origin (scheme + host, no path) |
| `ConnectionStrings__Sqlite` | Yes | `Data Source=/data/sentinel.db` in Docker |
| `FileStorage__Root` | Yes | `/data/uploaded-evidence` in Docker |
| `ASPNETCORE_ENVIRONMENT` | Yes | `Production` |
| `VITE_API_BASE_URL` | Build-time | Baked into SPA at `npm run build` |

---

## Smoke test after deploy

1. Open Amplify URL → accept demo disclaimer
2. Register or sign in as complainant → lodge complaint
3. Track by reference code (public)
4. Sign in as caseworker → dashboard → queue → open case → assign / status
5. Account menu → change password
6. Upload evidence on a draft → confirm file persists after API restart

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| API won't start | Logs: missing `Jwt__SigningKey` |
| CORS errors in browser | `FRONTEND_ORIGIN` must exactly match browser URL |
| 401 after deploy | Token in sessionStorage; sign in again |
| Data lost after restart | EBS volume not mounted to `./data`; verify `deploy/aws/data/` |
| Mixed content blocked | API must be HTTPS when frontend is HTTPS |
| Resources page blank | nginx missing `/api/` proxy, or `VITE_API_BASE_URL=/api` without proxy — rebuild `web` after updating `deploy/aws/nginx.conf` |
| `docker compose` fails on EC2 | Use `docker-compose` (hyphen) on Amazon Linux unless Compose V2 plugin is installed |
| `/api/*` returns HTML | Same as Resources blank — verify `curl http://<ip>/api/health` returns JSON not `<!doctype html>` |

---

## SEO and link previews (no custom domain)

If you use an **Elastic IP** (e.g. `http://3.104.237.26`) without a domain:

1. Set `VITE_SITE_URL=http://<your-elastic-ip>` in `deploy/aws/.env` (same host as `FRONTEND_ORIGIN`).
2. Rebuild the **web** container so meta tags, `robots.txt`, and `sitemap.xml` pick up the URL:
   ```bash
   docker-compose up -d --build web
   ```
3. After deploy, verify:
   - `http://<ip>/robots.txt`
   - `http://<ip>/sitemap.xml`
   - View page source on `/` — `og:url` and `canonical` should use your IP.

**Search indexing:** Submit `http://<ip>/sitemap.xml` in [Google Search Console](https://search.google.com/search-console) (URL prefix property). Use the **HTML file** verification method — file lives in `sentinel-web/public/google*.html` and is served at the site root. Indexing IP-only sites can be slower than domains; allow a few days. Check with `site:<ip>` on Google.

**Social previews:** Slack, LinkedIn, and Twitter read `og:title`, `og:description`, and `og:image` (`/og-image.png`). Refresh cached previews with [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) after deploy. LinkedIn may label Type as "Article" in the inspector even when `og:type` is `website` — title, description, and image are what matter.

---

## Manual deploy (GitHub Actions)

Deploy is **manual only**. Pushing to `main` runs **CI** (tests + build) but does **not** redeploy EC2. When you are ready to update production:

1. GitHub → **Actions** → **Deploy EC2** → **Run workflow** → **Run workflow**
2. Or SSH to EC2 and run `bash ~/sentinel/deploy/aws/deploy.sh`

On a `t3.micro` (1 GB RAM), avoid surprise full `docker-compose up -d --build` runs — they can OOM the instance. Deploy when you can monitor the box (add 2 GB swap if you have not already).

### One-time setup

1. **EC2 security group — SSH:** GitHub Actions runners use changing public IPs. Open port **22** to **0.0.0.0/0** only while using Actions deploy (rely on your `.pem` / deploy key), or SSH from your IP and skip Actions entirely.

2. **GitHub repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Example | Required |
|--------|---------|----------|
| `EC2_HOST` | `15.134.86.18` | Yes |
| `EC2_USER` | `ec2-user` (Amazon Linux) or `ubuntu` | Yes |
| `EC2_SSH_KEY` | Full contents of your `.pem` private key | Yes |
| `EC2_GIT_PAT` | Fine-grained PAT with **Contents: Read** on this repo | Yes for **private** repos |
| `EC2_SSH_PORT` | `22` | Optional |

To copy `.pem` into the secret (PowerShell):

```powershell
Get-Content "C:\Users\You\.ssh\sentinel.pem" -Raw
```

Paste the entire output (including `-----BEGIN` / `-----END` lines) into `EC2_SSH_KEY`.

3. **First deploy on the server** must already be done manually (`git clone`, `.env`, `data/`). The workflow only **updates** an existing install.

### What runs on deploy

`deploy/aws/deploy.sh` on the EC2 host:

- `git fetch` + `git reset --hard origin/main`
- `docker-compose up -d --build`
- waits for `GET /health/ready`

Manual equivalent on EC2:

```bash
bash ~/sentinel/deploy/aws/deploy.sh
```

### Workflows

| Workflow | When |
|----------|------|
| `CI` | Every push/PR to `main` — tests + frontend build |
| `Deploy EC2` | Manual **Run workflow** only |

---

## CI

GitHub Actions workflow `.github/workflows/ci.yml` runs backend tests and frontend build on push.
