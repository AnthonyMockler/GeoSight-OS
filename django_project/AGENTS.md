# Django Project AGENTS.md

## OVERVIEW
Django project containing settings, WSGI, and app registry

## STRUCTURE
django_project/
├── core/           # Main Django project (settings, wsgi, urls)
├── azure_auth/     # Azure AD authentication app
├── docs/           # Documentation/CMS app
├── frontend/       # Static frontend assets
├── geosight/       # Main application logic
└── patch/          # Monkey patches

## WHERE TO LOOK
- **Settings**: core/settings/base.py (common), dev.py, prod.py
- **URLs**: core/urls.py (root), geosight/urls.py (API), azure_auth/urls.py (auth), docs/urls.py (CMS)
- **Apps**: core (base classes), azure_auth (SSO), docs (Wagtail CMS), geosight (main), frontend (static)
- **Management commands**: core/management/commands/ (load_demo_data.py, etc.)
- **Models**: Each app has models/ directory
- **Tests**: Each app has tests/ directory

## CONVENTIONS
- Settings split by environment (base/dev/prod/test) using django-environ
- App configuration in apps.py modules with proper AppConfig classes
- Tenant-aware TestCase base classes in core/tests/
- Environment variables for configuration (DJANGO_* prefixed)
- Logging configured in settings with different levels per environment

## ANTI-PATTERNS
- Don't modify generated migration files in migrations/ directories
- Don't hardcode tenant domains or database names
- Don't put business logic in views.py - use services/ or managers/
- Don't use raw SQL queries without parameterization
- Don't cache querysets - cache specific values instead

## COMMANDS
- `python manage.py migrate` - Apply database migrations
- `python manage.py runserver` - Start development server
- `python manage.py load_demo_data` - Load sample data for development
- `python manage.py test` - Run test suite
- `python manage.py createsuperuser` - Create admin user
- `python manage.py collectstatic` - Collect static files for production

## MODULE BOUNDARIES
Each app contains:
- __init__.py (package marker)
- apps.py (Django app configuration)
- models/ (database models)
- views/ (request handlers)
- serializers/ (API serialization, if applicable)
- tests/ (unit and integration tests)
- management/ (custom Django commands, if applicable)