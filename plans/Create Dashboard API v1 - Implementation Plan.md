# Create Dashboard API v1 - implementation plan

- Status: Planned
- Owner: Codex Agent
- Last updated: 2026-04-24

## Goal
Add `POST /api/v1/dashboards/` by reusing the current dashboard create flow, keeping data writes safe, and documenting only what the API really accepts.

## Scope
### In scope
- Add create support to the v1 dashboards endpoint.
- Reuse existing dashboard create logic instead of duplicating rules.
- Add focused test coverage for workflow, contract, and edge cases.
- Update API docs so request and response details are accurate.

### Out of scope
- Adding update or patch behavior for dashboards.
- Redesigning the dashboard creation payload model.
- Changing unrelated permission or dashboard features.

## Working principles
1. Start with behavior: the endpoint should be useful and stable for clients.
2. Follow red/green: write failing tests first, then make the smallest fix.
3. Reuse existing logic whenever possible.
4. Keep API code thin and keep business rules in shared flow code.
5. Preserve data integrity: no partial saves if relation save fails.
6. Keep docs honest: document real parser behavior, not future ideas.

## Implementation strategy
### 1) Extract a shared dashboard create helper
Create a shared helper that can be called by both:
- the existing UI flow (`DashboardCreateViewBase`)
- the new v1 API create action

Helper behavior:
- Input: normalized payload dictionary, user, and files.
- Reuse `DashboardForm.update_data(...)`, `DashboardForm(...)`, `save_relations(...)`, and `increase_version()`.
- Wrap create flow in a transaction so failures roll back cleanly.
- Return structured success or validation data, not `HttpResponse` objects.

Reason:
- Prevent drift between UI create behavior and API create behavior.
- Keep the API view simple.
- Preserve current UI behavior while allowing API-specific responses.

### 2) Add create support in v1 dashboards endpoint
Update `DashboardViewSet` so `/api/v1/dashboards/` supports `POST`:
- Enable create via the existing v1 mixin pattern.
- Call the shared helper from `create()`.
- Keep permission behavior aligned with existing v1 rules (creator can create).
- Keep router setup unchanged.

Request handling:
- Accept JSON.
- Accept multipart with optional icon upload.
- Normalize request data safely before passing it to shared create logic.
- Avoid conversions that break `data` JSON parsing or file handling.

Response handling:
- Return `201` on success using the existing v1 serializer contract.
- Return `400` for validation and business-rule errors with useful messages.
- Keep `401/403` behavior under existing permission classes.

### 3) Update API docs to match real behavior
Add `swagger_auto_schema` for create with a schema that matches real input parsing:
- Document the top-level request shape as implemented.
- Document `data` and multipart file behavior clearly.
- Do not add speculative schema sections that are not enforced.

## Test plan (red/green, real instance required)
### A) Start a real GeoSight stack
Before final verification:
1. Start services: `make dev`
2. Load demo state: `make dev-initialize` (plus any required data load)
3. Start app server: `make dev-runserver` and confirm it is ready

Real-instance verification is required for this change.

### B) Integration tests on running instance
Add tests that exercise real flows:
- `POST /api/v1/dashboards/` as creator with realistic payload
- Create blocked for non-creator roles
- Multipart create with icon upload
- Invalid payload returns clear validation errors

Where practical, include at least one UI-backed create assertion to confirm UI/API behavior parity.

### C) Extend existing API test style
Extend `django_project/geosight/data/tests/api/v1/dashboard.py` for targeted checks:
- Rollback behavior when relation save fails (no dashboard persisted)
- Response contract checks for v1 clients

Keep existing test style; do not rewrite unrelated suites.

### D) Red/green order
1. Add or update integration and targeted functional tests first.
2. Run tests on real instance to capture RED.
3. Implement minimal changes for create flow and shared helper.
4. Re-run integration tests to reach GREEN.
5. Run focused regression checks for affected dashboard flows.

## Candidate write set
- `django_project/geosight/data/api/v1/dashboard.py`
- `django_project/frontend/views/admin/dashboard/create.py`
- Optional new shared helper module (only if cleaner than expanding current class)
- `django_project/geosight/data/tests/api/v1/dashboard.py`
- `playwright/ci-test/tests/...` (only if needed for integration coverage)
- `playwright/ci-test/playwright.config.ts` or fixture/support files (only if needed)
- `django_project/geosight/data/serializer/dashboard.py` (if schema docs require updates)

## Verification requirements
Record exact commands and concise results in implementation notes.

Planned verification commands (may be refined during implementation):
1. Start environment: `make dev`, `make dev-initialize`, `make dev-runserver`
2. Run integration tests against running instance for dashboard create API/UI flows
3. Run targeted functional tests for v1 dashboard API edge cases
4. Run focused regression checks for related dashboard endpoints if touched

If a required command fails and cannot be fixed in scope, mark it as `BLOCKED` with command and reason.

## Risks and mitigations
1. Risk: shared helper changes UI create behavior.
   Mitigation: keep helper logic equivalent and preserve UI wrapper behavior.
2. Risk: multipart normalization bugs.
   Mitigation: add explicit multipart tests and keep normalization controlled.
3. Risk: transaction handling allows partial saves.
   Mitigation: add rollback tests that assert no persisted dashboard on relation failure.
4. Risk: real-instance tests are slow or flaky when environment is not ready.
   Mitigation: use explicit readiness checks and deterministic setup.

## Definition of done
1. `POST /api/v1/dashboards/` works for creator and is denied for non-creator roles.
2. API and UI create flows reuse shared business logic.
3. Tests confirm transaction-safe behavior.
4. API docs match actual request and response behavior.
5. RED/GREEN verification evidence is recorded with executed commands and results.
