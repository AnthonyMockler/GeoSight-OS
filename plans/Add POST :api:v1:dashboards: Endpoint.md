# Plan: Add POST /api/v1/dashboards/ Endpoint

## Current State Analysis
- `DashboardViewSet` (in `api/v1/dashboard.py`) is registered with the router at `dashboards/` but only supports **read** and **delete** operations (inherits `BaseApiV1ResourceReadOnly` + `BaseApiV1ResourceDeleteOnly`).
- Dashboard creation logic exists in the web UI (`DashboardCreateViewBase`) using `DashboardForm.update_data()`, form validation, and `dashboard.save_relations()`.
- There is no public API endpoint for creating dashboards.
- The router already maps the ViewSet, so adding a `create` method will automatically expose POST to the list endpoint (`/api/v1/dashboards/`) - no URL changes needed.

## Implementation Steps

### 1. Add `create` action to `DashboardViewSet`
**File:** `django_project/geosight/data/api/v1/dashboard.py`  
- Add `form_class = DashboardForm` as class attribute
- Implement `create` method:
  ```python
  @swagger_auto_schema(
      operation_id='dashboard-create',
      tags=[ApiTag.DASHBOARD],
      request_body=DashboardSerializer.Meta.post_body,  # To be defined
      operation_description='Create a new dashboard.'
  )
  def create(self, request, *args, **kwargs):
      data = request.data.copy()
      try:
          data = DashboardForm.update_data(dict(data), user=request.user)
      except (PermissionError, ValueError) as e:
          return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

      if Dashboard.name_is_exist_of_all(data['slug']):
          return Response(
              {'detail': f'Dashboard with slug {data["slug"]} already exists.'},
              status=status.HTTP_400_BAD_REQUEST
          )

      form = DashboardForm(data, request.FILES)
      form.user = request.user
      if form.is_valid():
          with transaction.atomic():
              dashboard = form.save()
              dashboard.creator = request.user
              dashboard.modified_by = request.user
              dashboard.save()
              dashboard.save_relations(data, is_create=True)
              dashboard.increase_version()
              serializer = DashboardSerializer(
                  dashboard, context=self.get_serializer_context()
              )
              return Response(serializer.data, status=status.HTTP_201_CREATED)
      return Response(dict(form.errors.items()), status=status.HTTP_400_BAD_REQUEST)
  ```
- Add imports: `from django.db import transaction`, `from geosight.data.forms.dashboard import DashboardForm`, `from geosight.data.serializer.dashboard import DashboardSerializer`, `from rest_framework import status`

### 2. Update Swagger Documentation (post_body)
**File:** `django_project/geosight/data/serializer/dashboard.py`  
Add a `post_body` schema to `DashboardSerializer.Meta` that documents the expected input structure. The payload expects a `data` field containing dashboard configuration as JSON string (similar to the web UI's POST format).

Alternatively, create a dedicated `DashboardCreateInputSerializer` for request validation and documentation.

### 3. Add API Tests
**File:** `django_project/geosight/data/tests/api/v1/dashboard.py`  
Add test methods for the `create` action:
- Permission tests: anonymous, viewer, contributor, creator roles (creator should be allowed)
- Validation errors: missing `name`, invalid `extent`, missing required structures
- Slug uniqueness conflict
- Successful creation with minimal valid payload, verify:
  - Response status 201 and correct payload
  - Database record created with correct relationships
  - `creator` and `modified_by` set correctly
  - Version incremented
  - Cache permissions initialized

Use `reverse('dashboards-list')` for the endpoint URL.

### 4. Verify Rollback & Consistency
- Ensure `transaction.atomic()` is used so any failure rolls back
- Confirm `increase_version()` is called
- Verify post-save signal still works

### 5. No URL Configuration Changes
The ViewSet is already registered in `django_project/geosight/data/urls_v1.py` via `router.register(r'dashboards', DashboardViewSet, basename='dashboards')`. Adding `create` automatically exposes POST.

### 6. Consider Input Serializer
Optionally create a dedicated DRF serializer for input validation to align with other ViewSets. However, reusing `DashboardForm` is acceptable and maintains consistency with web UI.

### 7. Review File Upload Handling
`DashboardForm` includes an optional `icon` (ImageField). The `create` method passes `request.FILES` to the form. DRF's `request.data` includes files for multipart uploads, but using `request.FILES` explicitly is safer.

### 8. Final Checks
- Run existing tests to ensure no regressions
- Test with realistic payloads (including nested `data` field)
- Verify permission classes: `get_permissions()` returns `RoleCreatorAuthenticationPermission` for create (inherited from `BaseApiV1`)

## Dependencies & Risks
- `DashboardForm.update_data` is a large transformation; must be called before form validation.
- Swagger `post_body` definition for such a complex nested schema is substantial.
- Update/patch endpoints are still not available (would require similar complex handling).