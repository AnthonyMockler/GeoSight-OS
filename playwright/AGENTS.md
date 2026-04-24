# Playwright E2E Tests

Playwright E2E tests: ci-test (CI role-based) and staging-tests (local validation)

## Structure
- `ci-test/`: CI-focused TypeScript tests with role-based projects
- `staging-tests/`: Local validation tests with multi-browser support

## Where to Look
- **CI config**: `ci-test/playwright.config.ts` (TypeScript, project matrix with dependencies)
- **Staging config**: `staging-tests/playwright.config.js` (multi-browser Chromium/Firefox/WebKit)
- **Test suites**: `ci-test/tests/{admin,contributor,creator}/` (role-based organization)
- **Utilities**: `ci-test/tests/utils/` (helpers: permission.jsx, delay, loginAs)
- **Auth states**: `ci-test/states/.auth/` (JSON storageState files per role)
- **README**: `staging-tests/README.md` (local setup and recording instructions)

## Conventions
- **Role-based organization**: Tests grouped by user role (admin, contributor, creator)
- **Setup files**: `*.setup.ts` for authentication and preconditions
- **Playwright projects**: Matrix with dependencies (setup → test execution)
- **Storage state**: Auth persisted after login (`admin.json`, `contributor.json`, etc.)
- **Timeouts**: `TIMEOUT` constant = 2000ms in utils for consistent waits

## Anti-Patterns
- Never commit `staging-tests/auth.json` (credentials) - gitignored per README
- Don't hardcode credentials (use environment variables)
- Avoid `page.waitForTimeout()` (use `expect().toBeVisible()` with timeout)

## Unique Styles
- **Project-based isolation**: Each role gets separate storageState
- **Setup dependencies**: `admin-setup` runs before `admin-chromium`/`admin-firefox`
- **Permission testing**: `editPermission()` helper in `utils/permission.jsx`
- **Test data**: Uses demo data loaded by `dev-initialize`
- **CI integration**: `tests.yaml` runs `npx playwright test` with specific projects

## Commands
- `cd playwright/ci-test && npx playwright test`
- `npx playwright test --project=admin-chromium`
- `npx playwright test --grep "Dashboard creation"`

## Gotchas
- Requires dev server running (`make dev-runserver`)
- Auth state files must be generated first (run setup projects)
- CI uses headless mode; local can use headed via config