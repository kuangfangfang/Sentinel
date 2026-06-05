# CHANGELOG

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
