# CHANGELOG

## 2026-06-05 — Caseworker dashboard enrichment

### Features

- Reworked the caseworker dashboard into an operational-first workspace: a personal "My work" strip (assigned to me, my cases awaiting info), a team "Needs attention" zone (unassigned, more info needed, high/critical open, aging over 30 days), an overview row, and a "Trends" section.
- Made every "My work" and "Needs attention" card deep-link into the triage queue with pre-applied filters; `QueuePage` now seeds its initial filters from URL query params (`status`, `severity`, `ground`, `search`, `fromDate`, `toDate`, `assignee=me`, `unassigned`, `openOnly`, `sort`, `dir`), so queue views are shareable.
- Added status and severity donut charts (badge-matched colours, with `sr-only` tables) and a combined "Lodged vs Resolved by month" chart.
- Added an `OpenOnly` queue filter (Submitted/UnderReview/MoreInfoNeeded) to the API and queue query.

### Backend

- Extended `DashboardSummaryDto` with `BySeverity`, `Unassigned`, `AssignedToMeOpen`, `MyAwaitingInfo`, `AgingOpen`, and `HighSeverityOpen` (personal counts computed from `ICurrentUser`).
- Extended `AnalyticsDto` with `BySeverity` and added a per-month `Resolved` count (distinct complaints with a Resolved transition that month, from `StatusHistory`), renaming the monthly `Count` to `Lodged`.

### Verification

- Passed `dotnet test -c Release` (44 tests, including new dashboard-count, open-only, and resolved-per-month coverage).
- Passed `npm run build` and `npm run test:validation`.

## 2026-06-05 — Caseworker workspace

### Features

- Added complaint assignment: caseworkers can claim, reassign, or unassign a complaint, with a new `AssignedToUserId`/`AssignedToName` on the complaint, a `ComplaintAssigned` audit event, and `POST /caseworker/complaints/{id}/assign` plus `GET /caseworker/caseworkers` endpoints.
- Added an "Assigned caseworker" card to the caseworker complaint detail page (claim to me, reassign dropdown, unassign).
- Added an "Assignee" column and an "Assigned to me / Unassigned" filter to the triage queue.
- Added sort-by (lodged date / severity / status) and direction controls plus a "Lodged from / to" date range to the triage queue, exposing existing backend query support.
- Added an "Evidence files" section to the caseworker complaint detail page so caseworkers can download attachments.

### Improvements

- Caseworker complaint detail action errors (status, severity, note, assignment) now show inline and dismissibly instead of replacing the whole page; only load failures gate the view.
- Added dismissible success banners for caseworker status, severity, note, and assignment actions.
- Memoised the static grounds reference list in the frontend API client so the wizard, queue, and detail pages no longer refetch it.
- Added concise `ShortLabel`s to the ground catalogue and surfaced them via analytics (`CategoryCountDto.ShortCategory`) so the dashboard "Complaints by category" chart shows full, non-overlapping category names with the full label in the tooltip.

### Verification

- Passed `dotnet test` (41 tests, including new caseworker assignment and queue-filter coverage).
- Passed `npm run build`.
- Passed `npm run test:validation`.

## 2026-06-05

### Features

- Added a demo disclaimer gate that blocks entry until the user accepts the demo notice.
- Added a custom Google Translate language menu with broader language coverage.
- Added searchable and grouped grounds filtering in the complaint wizard.
- Added complaint-summary content to the confirmation page so `Print / save summary` includes complaint details.
- Added a frontend SVG favicon.

### Improvements

- Made the site header sticky with a stable background.
- Improved suburb search ranking and postcode autofill.
- Improved the anonymous complaint flow with clearer contact guidance.
- Improved the review step with section-level `Edit` actions.
- Improved the mobile step indicator so the current step label is visible.
- Improved translation isolation for reference codes, dates, and custom language controls.

### Fixes

- Fixed Chinese translation behaviour by correcting the effective source-language setup.
- Fixed local CORS issues when the frontend runs on `127.0.0.1` instead of `localhost`.
- Fixed silent empty grounds behaviour by adding explicit loading failure messaging and retry.
- Fixed complaint date handling that could shift review dates by one day.
- Fixed confirmation-page copy behaviour so `Copy code` copies only the reference code.
- Fixed confirmation-page time display so lodged timestamps render in `Australia/Sydney` local time.
- Fixed post-submit navigation so users land at the top of the confirmation page instead of near the bottom.
- Fixed missing favicon requests in frontend development.

### Verification

- Passed `npm run test:validation`
- Passed `npm run build`
- Passed `dotnet test --no-restore`
- Browser smoke verified:
  - wizard flow on `localhost`
  - wizard flow on `127.0.0.1`
  - confirmation summary rendering
  - copy-code behaviour
  - Sydney local lodged-time display
  - confirmation-page top-of-page landing after submit

### Known Issues

- Frontend production build still reports a large chunk-size warning from Vite.
- React Router future-flag warnings still appear in development.
- Local tool-state directory `.cursor/` is currently untracked and should remain outside product commits.

### Architecture Notes

- The frontend remains a React + Vite + TypeScript app with Tailwind styling.
- Complaint wizard validation continues to be centralised in `sentinel-web/src/validation/schemas.ts`.
- Confirmation-page print summary data is generated from submitted complaint payloads in `sentinel-web/src/pages/wizard/confirmationActions.ts`.
- API CORS configuration now explicitly supports both `localhost` and `127.0.0.1` local frontend origins.
