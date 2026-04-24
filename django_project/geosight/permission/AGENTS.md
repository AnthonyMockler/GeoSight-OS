# Permission Module - Role-Based Access Control (RBAC)

Role-based access control (RBAC) with 6 roles: SUPER_ADMIN, ADMIN, CREATOR, CONTRIBUTOR, VIEWER, READER

## Structure
- `models/` - Permission model factories (Permission, GroupPermission, UserPermission)
- `tests/` - Test suites organized by type:
  - `api/` - API permission tests for resources (dashboard, indicator, etc.)
  - `model/` - Model-level permission logic tests
  - `django_admin/` - Django admin interface permission tests
  - `migrations/` - Database schema migrations
- `api/` - REST API endpoints for permission management
- `admin/` - Django admin configurations

## Where to Look
- **Models**: `models/factory.py` - Contains PermissionDetail, PERMISSIONS constants, and model factories
- **APIs**: `tests/api/` - Permission tests for dashboard, indicator, context_layer, basemap, style, related_table, dataset
- **Base test**: `tests/_base.py` - BasePermissionTest with 6 pre-created users (admin, creator, contributor, viewer, resource_creator, viewer_in_group, etc.)
- **Django admin**: `tests/django_admin/` - Admin UI permission tests

## Conventions
- All permission tests inherit from `BasePermissionTest.TestCase`
- BasePermissionTest provides pre-created users with roles: SUPER_ADMIN, CREATOR, CONTRIBUTOR, VIEWER
- Test methods follow pattern: `test_list_api`, `test_detail_api`, `test_create_api`, `test_update_api`, `test_partial_update_api`, `test_delete_api`
- Helper methods: `assertRequestGetView`, `assertRequestPostView`, `assertRequestPutView`, `assertRequestPatchView`, `assertRequestDeleteView`
- Permission test subclasses must implement `create_resource()` method to instantiate test objects

## Anti-Patterns
- Never bypass permission checks in tests (always test with proper roles)
- Don't hardcode user IDs (use factory-created users from setUp)
- Avoid testing permissions through direct model manipulation (use API endpoints)

## Unique Styles
- **Permission test pattern**: Subclasses implement `create_resource()` and `get_resources()` methods
- **Role hierarchy**: SUPER_ADMIN > ADMIN > CREATOR > CONTRIBUTOR > VIEWER > READER (defined in core/models/profile.py)
- **Group permissions**: Users inherit permissions from groups they belong to
- **Object-level permissions**: Per-resource ACLs (dashboard, indicator, etc.) with organization and public permission levels
- **Permission levels**: NONE(0), LIST(1), READ(2), READ_DATA(2.5), WRITE(3), WRITE_DATA(3.5), SHARE(4), OWNER(5)

## Gotchas
- **Permission caching**: See `tests/dashboard_cache_permission.py` for caching behavior tests
- **Tenant isolation**: Permissions are tenant-scoped; users can only access resources within their tenant
- **Resource creation**: Some resources require related objects (e.g., Dataset needs Indicator and ReferenceLayer)
- **Group permission updates**: Group permissions affect all users in the group immediately