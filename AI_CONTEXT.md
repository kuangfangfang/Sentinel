# AI_CONTEXT.md

## Project Overview

Sentinel is a demo complaint portal for the Australian human rights community. It provides a public-facing complaint wizard, anonymous lodgement, complaint tracking by reference code, authenticated complainant access, and a caseworker dashboard.

The repository is a full-stack monorepo with:
- `sentinel-web`: React + TypeScript + Vite frontend
- `Sentinel.Api`: ASP.NET Core Web API
- `Sentinel.Core`: domain entities, enums, and core services
- `Sentinel.Data`: EF Core DbContext, migrations, Identity user model, and demo seeding
- `Sentinel.Tests`: backend tests

User-facing copy should use Australian English.

## Rules

### AI Working Rules

Before major changes:

1. Read `AI_CONTEXT.md`.
2. Read `CHANGELOG.md`.
3. Summarize understanding.
4. Reuse existing components.
5. Do not rewrite working modules.
6. Ask before breaking API contracts.

### Repository Rules

- Prefer existing local patterns over introducing a new architecture style.
- Keep edits scoped to the feature or bug being changed.
- Do not commit generated output, local databases, or local tool state.
- Treat `.cursor/`, build artefacts, and local runtime files as non-product files unless explicitly requested.
- Preserve Australian English in all user-facing content.

## Current Architecture

### Frontend

- Framework: React 18 with TypeScript and Vite
- Styling: Tailwind CSS with shared utility/component classes in `sentinel-web/src/index.css`
- Routing: `react-router-dom`
- Forms: `react-hook-form` + `zod`

Key frontend areas:
- Global layout and sticky header in `sentinel-web/src/components/Layout.tsx`
- Complaint wizard in `sentinel-web/src/pages/wizard`
- Translation widget in `sentinel-web/src/components/GoogleTranslate.tsx`
- Disclaimer gate in `sentinel-web/src/components/DemoDisclaimerGate.tsx`
- Quick exit support in `sentinel-web/src/components/QuickExitButton.tsx` and `sentinel-web/src/hooks/useQuickExit.ts`

### Backend

- Framework: ASP.NET Core on `.NET 10`
- Auth: ASP.NET Identity + JWT bearer auth
- Persistence: EF Core with SQLite locally
- Startup wiring: `Sentinel.Api/Program.cs`

Key backend services:
- Complaint flow: `Sentinel.Api/Services/ComplaintService.cs`
- Tracking: `Sentinel.Api/Services/TrackingService.cs`
- Caseworker workflows: `Sentinel.Api/Services/CaseworkerService.cs`

## Important Domain Behaviour

### Complaint Wizard

The complaint wizard is a five-step flow:
1. About you
2. Who it is about
3. What happened
4. Supporting information
5. Review and lodge

Validation source of truth:
- `sentinel-web/src/validation/schemas.ts`

Wizard orchestration:
- `sentinel-web/src/pages/wizard/WizardPage.tsx`

Submission and draft data mapping:
- `sentinel-web/src/pages/wizard/wizardTypes.ts`

### Anonymous Complaints

Anonymous users can lodge without creating an account. Their reference code is the only way to track the complaint later.

### Translation

The site uses a custom Google Translate menu instead of the default widget UI. The frontend manages the `googtrans` cookie directly and hides injected Google UI elements.

### Demo Disclaimer

All users are gated by a session-scoped demo disclaimer before using the site.

### Seeding and accounts

- **Development:** `appsettings.Development.json` enables fictional demo users and sample complaints (`Seed:EnableDemoData`). Credentials are not shown on the login page.
- **Production:** No demo users or sample complaints. Set `Seed__BootstrapCaseworkerEmail` and `Seed__BootstrapCaseworkerPassword` (env var or `deploy/aws/.env`) to create the first caseworker once. Complainants self-register via `/register`.

## Local Development

### Frontend

Run from `sentinel-web`:
- `npm run dev`
- `npm run build`
- `npm run test:validation`

### Backend

Run from the repo root:
- `dotnet test --no-restore`
- `dotnet run --project Sentinel.Api/Sentinel.Api.csproj`

Common local URLs:
- Frontend: `http://localhost:5174`
- API: `http://localhost:5187`

The API CORS allow-list should support both `localhost` and `127.0.0.1` frontend origins.

## Deployment (AWS free tier)

Recommended split for a hosted demo:

- **Frontend:** AWS Amplify Hosting (`sentinel-web/amplify.yml`, env `VITE_API_BASE_URL`)
- **API:** EC2 `t3.micro` + Docker (`deploy/aws/Dockerfile.api`, persistent `./data` volume for SQLite + evidence)

Key files:

- `README.md` — quick start and env reference
- `deploy/aws/README.md` — full AWS walkthrough, HTTPS notes, smoke test
- `deploy/aws/docker-compose.yml` — API (+ optional nginx web) on EC2
- `Sentinel.Api/appsettings.Production.json.example` — copy to `appsettings.Production.json` or use env vars

Production **requires** `Jwt__SigningKey` and `Cors__AllowedOrigins` matching the hosted frontend URL.

Health checks: `/health`, `/health/ready` (used by Docker healthcheck and load balancers).

CI: `.github/workflows/ci.yml` on push/PR to `main`.

Manual EC2 deploy: `.github/workflows/deploy-ec2.yml` — **workflow_dispatch** only (Actions → Deploy EC2 → Run workflow). SSH runs `deploy/aws/deploy.sh`. Requires GitHub secrets `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, and `EC2_GIT_PAT` for private repos. CI on push does not trigger deploy.

## Testing Conventions

### Frontend

Validation and lightweight behaviour checks use:
- `sentinel-web/test/schema-validation.test.ts`
- `sentinel-web/test/wizard-ux.test.ts`
- `sentinel-web/test/translation-widget.test.ts`
- `sentinel-web/test/demo-disclaimer.test.ts`
- `sentinel-web/test/quick-exit.test.ts`

Validation runner:
- `sentinel-web/test/run-validation-tests.cjs`

### Backend

Primary backend tests live in:
- `Sentinel.Tests`

Important coverage includes:
- complaint service behaviour
- status transitions
- reference code generation
- CORS configuration
- auth change-password
- health endpoints
- caseworker dashboard/queue parity

## Current State

The current working branch includes:
- an operational-first caseworker dashboard: personal "My work" and team "Needs attention" signal cards that deep-link into a pre-filtered queue, plus status/severity donuts and a Lodged-vs-Resolved monthly chart
- queue deep-linking via URL query params (including `page`) and an `OpenOnly` queue filter; returning from complaint detail restores page, filters, and scroll position to the opened row
- caseworker complaint assignment (claim / reassign / unassign) with an audited `ComplaintAssigned` event
- caseworker detail page evidence-file download and inline (non-fatal) action error handling
- caseworker success feedback banners for status, severity, note, and assignment actions
- triage queue sorting controls, lodged-date range filter, an "open cases only" checkbox, and an assignee column with an "assigned to me / unassigned" filter
- memoised grounds reference list in the frontend API client
- complaint wizard UX improvements
- local CORS support for both `localhost` and `127.0.0.1`
- grounds loading retry and error handling
- suburb ranking and postcode autofill
- optional respondent email/mobile when unknown
- searchable grouped grounds selection
- fixed local date handling for complaint dates
- review-page edit links
- confirmation-page complaint summary for printing
- `Copy code` copying only the reference code
- confirmation timestamps rendered in `Australia/Sydney`
- post-submission confirmation scroll reset to top
- stronger `notranslate` handling
- mobile step label improvements
- favicon support and cleanup of broken punctuation in `index.html`
- account page (profile + change password) and header user menu
- collapsible caseworker status history (disclosure pattern)
- AWS deployment pack and CI workflow

## Caseworker UX notes

### Page navigation (breadcrumbs)

Caseworker in-page navigation uses a single **breadcrumb** pattern via `Breadcrumb` and `CaseworkerPageHeader`:

- **Dashboard** (root): title only, no breadcrumb; queue entry via top nav or signal cards (not a header `btn-primary`).
- **Queue:** `Dashboard / Triage queue`
- **Complaint detail:** `Dashboard / Triage queue / {reference or title}` — the queue segment preserves queue URL query params when returning to the list.

`btn-primary` / `btn-secondary` on caseworker pages are reserved for **form actions** (search, status change, assignment), not page-to-page navigation. Row-level **Open** links and dashboard **SignalCard** deep-links remain separate patterns.

### Open-only queue filter (`openOnly`)

`OpenOnly` is a backend/URL filter that limits the triage queue to **open** complaints only:

- **Included:** `Submitted`, `UnderReview`, `MoreInfoNeeded`
- **Excluded:** `Resolved`, `Closed`, `Withdrawn`

It is implemented in `CaseworkerService.GetQueueAsync` and exposed as the query param `openOnly=1`. Dashboard signal cards (e.g. "Assigned to me (open)", "High / Critical open") deep-link into the queue with this param pre-applied. `QueuePage` also exposes an **Open cases only** checkbox (synced to the URL) alongside sort and assignment controls.

### Mobile / responsive (caseworker)

The **complainant/public** flow is mobile-first. The **caseworker** area is **desktop-primary** with basic responsive fallbacks:

- Queue: table on `lg+`, card list below `lg`; filter form uses responsive grid
- Dashboard: responsive card grids and `ResponsiveContainer` charts (stack on narrow viewports)
- Detail: `lg:grid-cols-3` collapses to a single column on small screens

This is sufficient for demo and office use but is **not** full mobile adaptation (e.g. collapsible queue filters, compact chart legends, sticky triage actions on detail). **Planned follow-up:** dedicated caseworker mobile polish if phone triage becomes a requirement.

## Most Relevant Files

- `sentinel-web/src/components/Breadcrumb.tsx`
- `sentinel-web/src/components/CaseworkerPageHeader.tsx`
- `sentinel-web/src/pages/caseworker/QueuePage.tsx`
- `sentinel-web/src/pages/caseworker/queueNavigation.ts`
- `sentinel-web/src/pages/caseworker/CaseworkerComplaintDetailPage.tsx`
- `sentinel-web/src/api/caseworker.ts`
- `Sentinel.Api/Services/CaseworkerService.cs`
- `Sentinel.Api/Controllers/CaseworkerController.cs`
- `Sentinel.Api/Dtos/CaseworkerDtos.cs`
- `sentinel-web/src/pages/wizard/WizardPage.tsx`
- `sentinel-web/src/pages/wizard/ConfirmationPage.tsx`
- `sentinel-web/src/pages/wizard/confirmationActions.ts`
- `sentinel-web/src/pages/wizard/steps/StepAboutYou.tsx`
- `sentinel-web/src/pages/wizard/steps/StepRespondents.tsx`
- `sentinel-web/src/pages/wizard/steps/StepWhatHappened.tsx`
- `sentinel-web/src/pages/wizard/steps/StepReview.tsx`
- `sentinel-web/src/validation/schemas.ts`
- `sentinel-web/src/utils/format.ts`
- `sentinel-web/src/components/GoogleTranslate.tsx`
- `Sentinel.Api/appsettings.json`
- `Sentinel.Api/Program.cs`
- `Sentinel.Tests/CorsConfigurationTests.cs`
