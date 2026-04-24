# GeoSight-OS Root Agents Guide

## OVERVIEW
GeoSight is UNICEF's open-source geospatial web-based data visualization/analysis platform (Django backend + React frontend, Docker deployment) using administrative reference datasets from GeoRepo.

## STRUCTURE
.
├── django_project/          # Django backend (settings, WSGI, apps)
│   ├── core/                # Main project (settings, wsgi, urls)
│   ├── frontend/            # React frontend assets (served by Django)
│   ├── geosight/            # Main application logic (data, permission, etc.)
│   └── ...                  # Other apps (azure_auth, docs, patch)
├── frontend/                # React source code (built into django_project/frontend/)
├── playwright/              # E2E tests (ci-test, staging-tests)
├── deployment/              # Docker compose files and configuration
├── load-test/               # Load testing scenarios
└── .github/                 # GitHub Actions workflows

## WHERE TO LOOK
- **Backend Settings**: django_project/core/settings/{base.py,dev.py,prod.py}
- **Frontend Entry**: django_project/frontend/src/app/ (React app root)
- **API Endpoints**: django_project/geosight/data/api/v1/ (REST API)
- **Map Components**: django_project/frontend/src/components/ (Map, Legend, etc.)
- **E2E Tests**: playwright/ci-test/tests/ (role-based) and playwright/staging-tests/
- **CI Configuration**: .github/workflows/tests.yaml (206 lines, 14 test suites)
- **Docker Compose**: deployment/docker-compose.yml and override files
- **Management Commands**: django_project/core/management/commands/ (load_demo_data.py, etc.)

## CODE MAP
- **Dashboard**: django_project/geosight/data/models/dashboard/ — Core project model combining indicators/context layers
- **IndicatorLayer**: django_project/geosight/data/models/indicator/ — Data visualization layer from spreadsheets/assets
- **ContextLayer**: django_project/geosight/data/models/context_layer.py — Geospatial context layers (WMS, GeoJSON, etc.)
- **BasePermissionTest**: django_project/core/tests/ — Tenant-aware test base with 6-role permission matrix
- **APITestCase**: django_project/core/tests/ — API test base with client setup and assertions
- **DashboardPage**: playwright/ci-test/tests/admin/project_view/ — E2E page object for dashboard interactions

## CONVENTIONS
- **Settings Split**: base/dev/prod/test using django-environ (DJANGO_* prefixed vars)
- **Multi-tenancy Tests**: TestCase classes inherit tenant-aware bases in core/tests/
- **Permission Testing**: 6-role matrix (admin, manager, editor, contributor, viewer, anonymous) in BasePermissionTest
- **Mixed JSX/TSX**: Frontend uses .jsx for components, .tsx for logic-heavy files (hooks, utils)
- **E2E Auth**: StorageState files per role (admin.json, contributor.json) generated via setup projects
- **Linting**: Flake8 runs only on changed/untracked Python files (see Makefile flake8 target)
- **Legacy Docker**: Uses docker-compose (not compose) with override files for dev/prod

## ENGINEERING PRINCIPLES
- **Behavior First**: Optimize for user-visible outcomes and stable API/workflow contracts.
- **Strict Red/Green**: For behavior changes, add or update failing coverage first (RED), implement minimal changes, then verify passing (GREEN).
- **Keep It Auditable**: Prefer simple, explicit changes and plain English in status updates, test scenarios, and decision notes.
- **Reuse Over Rewrite**: Reuse existing helpers and domain logic instead of duplicating parsing/transformation logic.
- **Thin API Layer**: Keep view/controller code thin and push business logic into forms/services/models where existing project patterns already do this.

## TESTING POLICY
- **Behave Default For New Workflows**: For new user-facing or workflow-facing behavior where BDD fits, default to Behave scenarios.
- **Respect Existing Test Style**: When touching existing functional/API/unit suites, keep their current style and extend locally; do not rewrite existing non-Behave tests just to migrate frameworks.
- **Use The Right Level**: Use unit/API tests for low-level logic where BDD scenarios are not the best fit.
- **Contract Coverage**: For behavior/contract changes, update docs/spec and tests in the same branch.
- **Slow Test Hygiene**: Tag or mark slow tests explicitly.

## VERIFICATION STANDARD
- **No Unverified Completion Claims**: Do not claim `done` or `fixed` without executed passing checks.
- **Report Evidence**: Record exact verification commands and concise results.
- **Blocked Format**: If verification cannot complete, report `BLOCKED` with the failing command and reason.
- **No Skipped-By-Default Safety Checks**: Do not silently skip tests to get green; skipped critical checks must be called out.

## SCOPE AND CHANGE DISCIPLINE
- **Stay In Scope**: Keep changes focused on the requested behavior and declared write set.
- **Separate Unrelated Issues**: Report or split unrelated fixes into separate tasks/branches.
- **Document Persistent Rules Here**: Keep long-lived integration truths in `AGENTS.md`; keep transient investigation findings in project docs with date and verification context.
- **Long Runs**: Start long-running commands once, capture output location, and prefer failure-focused output summaries.

## ANTI-PATTERNS
- **NEVER** commit auth.json (Playwright credential storage) — gitignored but verify
- **NEVER** expose SSH port 22 in production deployments
- **DEPRECATED**: WidgetLegacy serializer (use Widget serializer)
- **DEPRECATED**: IndicatorStyleBaseModel (migrate to new style system)
- **DEPRECATED**: Old indicator values format — use aggregated views instead
- **DON'T** use relative paths in imports — use absolute paths from project root
- **DON'T** hardcode tenant domains or database names — use environment variables

## UNIQUE STYLES
- **Model Factories**: tests/model_factories/ mirror all production models with realistic data
- **HTTP Mocking**: E2E tests use JSON fixtures in __fixtures/ directories for API mocking
- **Playwright Dependencies**: ci-test uses project dependencies (setup → test execution via playwright.config.ts)
- **Redux Organization**: Frontend store split by feature (dashboard, indicator, contextLayer) in store/
- **Component Naming**: PascalCase for components, camelCase for instances, _private for internal helpers
- **Test Data**: Uses demo data loaded via `make dev-initialize` or `make load-test-data`

## COMMANDS
- **Development**: `make dev` (up dev containers), `make dev-shell` (shell into dev container)
- **Initialize**: `make dev-initialize` (loads demo data and creates superuser)
- **Run Server**: `make dev-runserver` (starts Django runserver on port 2000)
- **Tests**: `make dev-test` (backend), `npx playwright test` (E2E in playwright/ci-test/)
- **Specific E2E**: `npx playwright test --project=admin-chromium --grep "Dashboard creation"`
- **Build**: `make build` (production containers), `make up` (start production)
- **Lint**: `make flake8` (lint only changed/untracked Python files)
- **Load Data**: `make load-test-data` (loads demo data), `make load-test-data-default-dataset`

## NOTES
- **Python 3.8 EOL**: CI uses python-version: 3.8.18 (security risk — plan upgrade)
- **No Frontend Unit Tests**: Relies on E2E and manual testing — consider adding Jest/Vitest
- **Settings Location**: Base in core/settings/base.py, overrides in dev.py/prod.py/test.py
- **GeoRepo Integration**: Reference datasets loaded via georepo/ app (external PostGIS connection)
- **Multi-tenancy**: Tenant awareness via middleware and database routing (see core/)
- **Static Files**: Served by Django from django_project/frontend/ (built React assets)
- **Webpack Config**: Frontend builds via Django's webpack-loader (see frontend/ directory)
- **Celery Beat**: Periodic tasks configured in deployment/docker-compose.override.yml
- **Admin Interface**: Wagtail CMS in docs/ app for content management
