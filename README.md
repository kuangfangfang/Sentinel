# Sentinel

Demo complaint portal for the Australian human rights community (ITEC 634 AT3).  
Public complaint wizard, anonymous lodgement, reference-code tracking, complainant dashboard, and caseworker triage tools.

**This is a demonstration project.** It is not affiliated with the Australian Human Rights Commission and does not provide legal advice.

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
| `Cors__AllowedOrigins__0` | `https://your-frontend.example.com` |
| `VITE_API_BASE_URL` | `https://api.example.com/api` (build-time) |
| `ConnectionStrings__Sqlite` | `Data Source=/data/sentinel.db` |
| `FileStorage__Root` | `/data/uploaded-evidence` |
| `Seed__BootstrapCaseworkerEmail` | Admin caseworker email (created once) |
| `Seed__BootstrapCaseworkerPassword` | Strong password for bootstrap caseworker |
| `Seed__BootstrapCaseworkerFullName` | Display name (optional) |

## AWS deployment (free tier)

See **[deploy/aws/README.md](deploy/aws/README.md)** for step-by-step instructions:

- **Recommended:** AWS Amplify (frontend) + EC2 `t3.micro` Docker (API + persistent EBS)
- **Manual updates:** configure GitHub Actions secrets → Actions → **Deploy EC2** → **Run workflow** (see deploy guide § Manual deploy). CI still runs on push but does not redeploy EC2.
- Health checks: `/health`, `/health/ready`
- SQLite and uploaded evidence live on an EBS volume under `deploy/aws/data/`

## Project docs

- `AI_CONTEXT.md` — architecture and conventions for contributors
- `CHANGELOG.md` — feature history
