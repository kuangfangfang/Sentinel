# Sentinel

Demo complaint portal for the Australian human rights community (ITEC 634 AT3).  
Public complaint wizard, anonymous lodgement, reference-code tracking, complainant dashboard, and caseworker triage tools.

**This is a demonstration project.** It is not affiliated with the Australian Human Rights Commission and does not provide legal advice.

## Live demo (production)

| | |
|--|--|
| **URL** | http://3.104.237.26 |
| **Stack** | Docker on AWS EC2 `t3.micro` (SPA + API + SQLite on EBS) |
| **Health** | http://3.104.237.26/api/health |

Hosted on AWS Free Tier with an Elastic IP. HTTP only (no custom domain). Open Graph and sitemap configured for search and link previews.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind |
| Backend | ASP.NET Core 10, Identity + JWT |
| Database | SQLite (local / EC2) or SQL Server (optional) |
| Tests | xUnit, FluentAssertions, frontend validation suites |

## Local development

### Prerequisites

- .NET 10 SDK
- Node.js 20+

### Backend

```powershell
dotnet run --project Sentinel.Api/Sentinel.Api.csproj
```

API: `http://localhost:5187`  
Health: `http://localhost:5187/health` and `/health/ready`

### Frontend

```powershell
cd sentinel-web
npm install
npm run dev
```

App: `http://localhost:5174` (see `vite.config.ts` for the port)

### Local demo accounts

Demo users and sample complaints are seeded **only in Development** via `Sentinel.Api/appsettings.Development.json` (`Seed:EnableDemoData`). They are **not** shown on the login page and are **not** used in Production.

| Role | Email | Password (Development only) |
|------|-------|----------------------------|
| Caseworker | `caseworker@sentinel.local` | see `appsettings.Development.json` |
| Complainant | `complainant@sentinel.local` | see `appsettings.Development.json` |

Complainants can also self-register at `/register`. Caseworkers cannot self-register.

## Tests

```powershell
dotnet test -c Release
cd sentinel-web
npm run test:validation
npm run build
```

## Production configuration

Copy templates and set secrets **before** deploying:

| File | Purpose |
|------|---------|
| `Sentinel.Api/appsettings.Production.json.example` | API settings template |
| `sentinel-web/.env.production.example` | Frontend API URL for `npm run build` |
| `deploy/aws/.env.example` | Docker Compose secrets on EC2 |

Required environment variables (Production):

| Variable | Example |
|----------|---------|
| `Jwt__SigningKey` | 64+ character random secret |
| `Cors__AllowedOrigins__0` / `FRONTEND_ORIGIN` | `http://3.104.237.26` (must match browser URL) |
| `VITE_API_BASE_URL` | `/api` (same-origin via nginx on EC2) |
| `VITE_SITE_URL` | `http://3.104.237.26` (build-time SEO / Open Graph) |
| `ConnectionStrings__Sqlite` | `Data Source=/data/sentinel.db` |
| `FileStorage__Root` | `/data/uploaded-evidence` |
| `Seed__BootstrapCaseworkerEmail` | Admin caseworker email (created once) |
| `Seed__BootstrapCaseworkerPassword` | Strong password for bootstrap caseworker |
| `Seed__BootstrapCaseworkerFullName` | Display name (optional) |

## AWS deployment (free tier)

See **[deploy/aws/README.md](deploy/aws/README.md)** for step-by-step instructions:

- **Current setup:** single EC2 instance (nginx SPA + API via Docker Compose, Elastic IP, no custom domain)
- **Alternative:** AWS Amplify (frontend) + EC2 Docker (API + persistent EBS)
- **Manual updates:** GitHub Actions → **Deploy EC2** → **Run workflow**, or SSH + `deploy/aws/deploy.sh`. CI runs on push but does not auto-redeploy (avoids OOM on `t3.micro`).
- **On EC2 use** `docker-compose` (hyphen), not `docker compose`, on Amazon Linux unless the Compose plugin is installed.
- Health checks: `/health`, `/health/ready`
- SQLite and uploaded evidence live on an EBS volume under `deploy/aws/data/`
- SEO / LinkedIn previews: set `VITE_SITE_URL` before building the `web` image; see deploy guide § SEO and link previews

## Project docs

- `AI_CONTEXT.md` — architecture and conventions for contributors
- `CHANGELOG.md` — feature history
