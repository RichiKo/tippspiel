# Design: Ukrainian Localization with German Fallback (Frontend)

Date: 2026-02-14
Status: approved
Scope: Angular frontend runtime translations

## Goal

Migrate the app UI to Ukrainian (`uk`) while keeping German (`de`) as fallback during migration.  
The app should run with `uk` as active language by default and remain stable when Ukrainian keys are missing.

## Decisions

1. Use runtime i18n with `@ngx-translate/core` and `@ngx-translate/http-loader`.
2. Default language is `uk`.
3. Fallback language is `de`.
4. No language switch UI for now, but architecture must allow adding it later without refactor.

## Why This Approach

- The current frontend has many hardcoded UI texts and no active i18n module in app runtime.
- Runtime translation enables incremental migration per feature instead of big-bang locale builds.
- Fallback to German reduces risk while Ukrainian coverage grows.

## Architecture

### Runtime setup

- Configure `TranslateModule.forRoot(...)` in application providers.
- Load translations from:
  - `src/assets/i18n/uk.json`
  - `src/assets/i18n/de.json`
- App startup behavior:
  - `setDefaultLang('de')`
  - `use('uk')`

### Key naming convention

- Use stable dot-separated keys: `feature.section.key`
- Examples:
  - `header.logout`
  - `auth.login.title`
  - `teams.errors.loadFailed`

## Components and Data Flow

### Template migration

- Replace literal strings with translation keys and `translate` pipe.
- Example: `{{ 'header.logout' | translate }}`

### TypeScript migration

- Replace inline UI/error strings in component code with translation lookups via `TranslateService`.
- Use keys in dialogs, snackbars, error messages, and action labels.

### Optional wrapper service

- Add a minimal shared i18n service to centralize language access:
  - `setLanguage(lang)`
  - `getCurrentLanguage()`
- Keep it lightweight to avoid additional abstraction overhead.

## Migration Strategy

Migrate in this order to reduce UI inconsistency and risk:

1. Shared/UI components (`header`, page header, dialog/button labels)
2. Auth and dashboard
3. Championship/teams/bonus features

## Error Handling

- If a key is missing in `uk`, fallback to `de`.
- If missing in both files, key string remains visible in UI (useful for detecting gaps in development).
- Translation-file loading errors should not crash the app.

## Testing Strategy

- Update unit tests that currently assert hardcoded German text.
- Add/adjust tests for:
  - Translation rendering in key shared components
  - Fallback behavior (`uk` key missing -> `de` value used)

## Acceptance Criteria

1. App starts with `uk` as active runtime language.
2. Migrated UI sections display Ukrainian text.
3. Missing Ukrainian keys resolve to German fallback.
4. No behavioral regression in critical flows:
   - login
   - navigation
   - tip submission

## Out of Scope (for this design)

- User-visible language switch in UI
- Backend-driven per-user language persistence
- Additional languages beyond `uk` and `de`
