# Ukrainian Runtime i18n (with German Fallback) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Introduce `ngx-translate` runtime localization with `uk` as active language and `de` fallback, then migrate high-impact UI text paths incrementally.

**Architecture:** Use `@ngx-translate/core` + HTTP loader for JSON translation files in `src/assets/i18n`. Configure language bootstrap centrally in app configuration, add a thin i18n service wrapper, and migrate shared/UI-first so downstream features inherit translated primitives.

**Tech Stack:** Angular 19 standalone APIs, `@ngx-translate/core`, `@ngx-translate/http-loader`, Jasmine/Karma.

---

## Execution Notes

- Run this in a dedicated worktree before implementation (`@using-git-worktrees`).
- Execute each task in strict TDD cycles (`@test-driven-development`).
- Before claiming completion, run full verification (`@verification-before-completion`).

### Task 1: Add i18n Dependencies and Runtime Provider Setup

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Modify: `frontend/src/app/app.config.ts`
- Create: `frontend/src/assets/i18n/uk.json`
- Create: `frontend/src/assets/i18n/de.json`
- Test: `frontend/src/app/ui-lib/components/page-header/ui-page-header.component.spec.ts`

**Step 1: Write the failing test**

Update page-header spec to expect translated default back label key resolution (will fail before i18n provider setup).

```typescript
fixture.componentRef.setInput('showBack', true);
fixture.detectChanges();
expect(backButton.textContent).toContain('Повернутися');
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- --watch=false --include src/app/ui-lib/components/page-header/ui-page-header.component.spec.ts`  
Expected: FAIL due to missing translation setup / untranslated default label.

**Step 3: Write minimal implementation**

- Add dependencies:
  - `@ngx-translate/core`
  - `@ngx-translate/http-loader`
- Configure `TranslateModule.forRoot` in `app.config.ts` using `TranslateHttpLoader`.
- Ensure startup config sets fallback `de` and current language `uk`.
- Seed `uk.json` and `de.json` with keys required by page-header default label.

```typescript
provide: APP_INITIALIZER,
useFactory: (translate: TranslateService) => () => {
  translate.setDefaultLang('de');
  return firstValueFrom(translate.use('uk'));
},
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test -- --watch=false --include src/app/ui-lib/components/page-header/ui-page-header.component.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/app/app.config.ts frontend/src/assets/i18n/uk.json frontend/src/assets/i18n/de.json frontend/src/app/ui-lib/components/page-header/ui-page-header.component.spec.ts
git commit -m "feat(i18n): add ngx-translate runtime foundation with uk/de locales"
```

### Task 2: Add Thin i18n Service Wrapper

**Files:**
- Create: `frontend/src/app/shared/services/i18n.service.ts`
- Create: `frontend/src/app/shared/services/i18n.service.spec.ts`

**Step 1: Write the failing test**

Create service tests for startup defaults and language switching behavior.

```typescript
it('uses uk as active language and de as fallback', () => {
  expect(service.currentLanguage()).toBe('uk');
  expect(service.fallbackLanguage()).toBe('de');
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- --watch=false --include src/app/shared/services/i18n.service.spec.ts`  
Expected: FAIL because service does not exist.

**Step 3: Write minimal implementation**

Create wrapper over `TranslateService`:
- `currentLanguage(): string`
- `fallbackLanguage(): string`
- `setLanguage(lang: 'uk' | 'de'): Observable<unknown>`

```typescript
currentLanguage(): string {
  return this.translate.currentLang || 'uk';
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test -- --watch=false --include src/app/shared/services/i18n.service.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/app/shared/services/i18n.service.ts frontend/src/app/shared/services/i18n.service.spec.ts
git commit -m "feat(i18n): add shared i18n service wrapper"
```

### Task 3: Migrate Shared Header to Translation Keys

**Files:**
- Modify: `frontend/src/app/shared/components/header/header.component.html`
- Create: `frontend/src/app/shared/components/header/header.component.spec.ts`
- Modify: `frontend/src/assets/i18n/uk.json`
- Modify: `frontend/src/assets/i18n/de.json`

**Step 1: Write the failing test**

Add header component test asserting translated labels are rendered.

```typescript
expect(fixture.nativeElement.textContent).toContain('Вийти');
expect(settingsButton.getAttribute('aria-label')).toBe('Налаштування');
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- --watch=false --include src/app/shared/components/header/header.component.spec.ts`  
Expected: FAIL because literals are still hardcoded.

**Step 3: Write minimal implementation**

- Replace literals in header template with keys:
  - `header.settings`
  - `header.logout`
  - `header.menu.open`
  - `header.menu.close`
  - `header.logoutDialog.title/message/confirm/cancel`
- Add keys in `uk.json` and `de.json`.

```html
{{ 'header.logout' | translate }}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test -- --watch=false --include src/app/shared/components/header/header.component.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/app/shared/components/header/header.component.html frontend/src/app/shared/components/header/header.component.spec.ts frontend/src/assets/i18n/uk.json frontend/src/assets/i18n/de.json
git commit -m "feat(i18n): translate shared header and logout dialog copy"
```

### Task 4: Migrate UI Page Header Default Labels

**Files:**
- Modify: `frontend/src/app/ui-lib/components/page-header/ui-page-header.component.ts`
- Modify: `frontend/src/app/ui-lib/components/page-header/ui-page-header.component.html`
- Modify: `frontend/src/app/ui-lib/components/page-header/ui-page-header.component.spec.ts`
- Modify: `frontend/src/assets/i18n/uk.json`
- Modify: `frontend/src/assets/i18n/de.json`

**Step 1: Write the failing test**

Adjust existing spec to assert fallback/default text is translated when no explicit `backLabel` input is passed.

```typescript
fixture.componentRef.setInput('showBack', true);
expect(backButton.textContent).toContain('Повернутися');
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- --watch=false --include src/app/ui-lib/components/page-header/ui-page-header.component.spec.ts`  
Expected: FAIL until component default is key-based.

**Step 3: Write minimal implementation**

- Change default `backLabel` from literal to key.
- Resolve in template via `translate` pipe.

```typescript
backLabel = input('common.back');
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test -- --watch=false --include src/app/ui-lib/components/page-header/ui-page-header.component.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/app/ui-lib/components/page-header/ui-page-header.component.ts frontend/src/app/ui-lib/components/page-header/ui-page-header.component.html frontend/src/app/ui-lib/components/page-header/ui-page-header.component.spec.ts frontend/src/assets/i18n/uk.json frontend/src/assets/i18n/de.json
git commit -m "feat(i18n): translate page-header defaults"
```

### Task 5: Migrate Login Screen Strings and Auth Errors

**Files:**
- Modify: `frontend/src/app/auth/components/login/login.component.html`
- Modify: `frontend/src/app/auth/components/login/login.component.ts`
- Create: `frontend/src/app/auth/components/login/login.component.spec.ts`
- Modify: `frontend/src/assets/i18n/uk.json`
- Modify: `frontend/src/assets/i18n/de.json`

**Step 1: Write the failing test**

Create login component spec for translated submit label and server error mapping.

```typescript
expect(submitButton.textContent).toContain('Увійти');
expect(component.authError).toBe('Неправильна електронна пошта або пароль.');
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- --watch=false --include src/app/auth/components/login/login.component.spec.ts`  
Expected: FAIL because literals are still hardcoded and no translation service in component.

**Step 3: Write minimal implementation**

- Replace template literals with i18n keys.
- Inject `TranslateService` into component.
- Map backend error states to translation keys, then resolve to message.

```typescript
this.authError = this.translate.instant('auth.login.errors.invalidCredentials');
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test -- --watch=false --include src/app/auth/components/login/login.component.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/app/auth/components/login/login.component.html frontend/src/app/auth/components/login/login.component.ts frontend/src/app/auth/components/login/login.component.spec.ts frontend/src/assets/i18n/uk.json frontend/src/assets/i18n/de.json
git commit -m "feat(i18n): localize login form and auth error handling"
```

### Task 6: Migrate Teams View High-Value Strings with Fallback Coverage

**Files:**
- Modify: `frontend/src/app/teams/teams.component.html`
- Modify: `frontend/src/app/teams/teams.component.ts`
- Modify: `frontend/src/app/teams/teams.component.spec.ts`
- Modify: `frontend/src/assets/i18n/uk.json`
- Modify: `frontend/src/assets/i18n/de.json`

**Step 1: Write the failing test**

Extend teams spec with expectations for translated heading/action labels and one explicit fallback case (`uk` key intentionally omitted in test fixture).

```typescript
expect(fixture.nativeElement.textContent).toContain('Команди');
expect(fixture.nativeElement.textContent).toContain('Додати команду');
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test -- --watch=false --include src/app/teams/teams.component.spec.ts`  
Expected: FAIL because texts remain literal and fallback case not configured.

**Step 3: Write minimal implementation**

- Replace visible literals in teams HTML with keys.
- Replace TS error strings with translated messages:
  - `teams.errors.loadFailed`
  - `teams.errors.createFailed`
  - `teams.errors.updateFailed`
  - `teams.errors.deleteFailed`

```typescript
this.errorMessage.set(this.translate.instant('teams.errors.loadFailed'));
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test -- --watch=false --include src/app/teams/teams.component.spec.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/app/teams/teams.component.html frontend/src/app/teams/teams.component.ts frontend/src/app/teams/teams.component.spec.ts frontend/src/assets/i18n/uk.json frontend/src/assets/i18n/de.json
git commit -m "feat(i18n): translate teams page and error messages"
```

### Task 7: Verify, Regressions, and Missing-Key Sweep

**Files:**
- Modify (if needed): `frontend/src/assets/i18n/uk.json`
- Modify (if needed): `frontend/src/assets/i18n/de.json`
- Modify (if needed): affected specs

**Step 1: Write the failing check**

Run a hardcoded-string scan for user-facing German literals in migrated areas; treat findings as failing quality gate.

```bash
rg -n "\"[A-ZÄÖÜa-zäöüß].*\"" frontend/src/app/shared/components/header frontend/src/app/ui-lib/components/page-header frontend/src/app/auth/components/login frontend/src/app/teams
```

**Step 2: Run verification to confirm failures (if any)**

Run: `cd frontend && npm run test -- --watch=false`  
Expected: either FAIL from regressions or PASS with no migrated-area regressions.

**Step 3: Write minimal fixes**

- Add missing keys in locale files.
- Fix components/specs for any remaining hardcoded user-facing strings in migrated scope.

**Step 4: Run verification to verify pass**

Run:
- `cd frontend && npm run test -- --watch=false`
- `cd /Users/allgemeinerbenutzer/myProjects/tippspiel && git status --short`

Expected:
- Tests PASS
- Only intended files changed.

**Step 5: Commit**

```bash
git add frontend/src/assets/i18n/uk.json frontend/src/assets/i18n/de.json
git add frontend/src/app/shared/components/header frontend/src/app/ui-lib/components/page-header frontend/src/app/auth/components/login frontend/src/app/teams
git commit -m "test(i18n): finalize uk translation coverage with de fallback safeguards"
```

