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

## Current State

The current working branch includes:
- caseworker complaint assignment (claim / reassign / unassign) with an audited `ComplaintAssigned` event
- caseworker detail page evidence-file download and inline (non-fatal) action error handling
- caseworker success feedback banners for status, severity, note, and assignment actions
- triage queue sorting controls, lodged-date range filter, and an assignee column with an "assigned to me / unassigned" filter
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

## Most Relevant Files

- `sentinel-web/src/pages/caseworker/QueuePage.tsx`
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
