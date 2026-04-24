# Django Core AGENTS.md

## OVERVIEW
Core Django app: base test classes, model factories, fixtures, and shared utilities

## STRUCTURE
django_project/core/
├── tests/              # Base test classes and test utilities
├── fixtures/           # JSON fixtures for initial data
├── management/commands/# Custom Django commands
├── model_factories/    # Factory boy factories for test data
└── _fixtures/          # Test-specific fixtures (in tests/)

## WHERE TO LOOK
- **Base test classes**: tests/base_tests.py (TestCase, APITestCase)
- **HTTP mocking**: tests/base_test_patch_responses.py (BaseTestWithPatchResponses)
- **Model factories**: tests/model_factories/ (create_user, create_dashboard, etc.)
- **Fixtures**: fixtures/ (production fixtures) and tests/_fixtures/ (test fixtures)
- **Management commands**: management/commands/ (load_demo_data.py, etc.)

## CONVENTIONS
- All Django tests inherit from core.tests.base_tests.TestCase (not django.test.TestCase)
- TestCase provides multi-tenant isolation and helper methods
- APITestCase adds HTTP assertion helpers (assertRequestGetView, etc.)
- Model factories mirror production models in geosight/data/
- Fixtures in JSON format under fixtures/ and tests/_fixtures/

## ANTI-PATTERNS
- Don't use django.test.TestCase directly (use core.tests.base_tests.TestCase)
- Don't hardcode user credentials in tests (use create_user factory)
- Don't skip tenant setup (TestCase handles it automatically)
- Don't modify shared fixtures in tests/_fixtures/ (use factories instead)

## UNIQUE STYLES
- Tenant-aware testing: TestCase creates/deletes tenant per test class
- Role-based user creation: create_user(role_name, password=...)
- HTTP patch responses: BaseTestWithPatchResponses uses external JSON files
- Fixture organization: core/fixtures/ for production, tests/_fixtures/ for tests

## COMMANDS
- make dev-test (runs all Django tests)
- python manage.py test --keepdb --noinput
- python manage.py load_demo_data (loads sample data)

## GOTCHAS
- TestCase uses TransactionTestCase semantics (db not rolled back per test)
- Tenant isolation requires proper database routing
- APITestCase requires authentication helpers for permission tests
- File cleanup tests inherit from BaseFileCleanupTest.TestCase