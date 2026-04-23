# Plan: Add POST /api/v1/dashboards/ Endpoint

## Decisions Summary
- **Input validation:** Reuse `DashboardForm` (consistent with web UI and existing API pattern)
- **Swagger documentation:** Comprehensive `post_body` schema documenting all nested fields in detail, organized with separate constants for readability
- **Create method:** Follow base class pattern (`BaseApiV1ResourceWriteOnly`) with only dashboard-specific additions: `save_relations()` call, `increase_version()`, `request.FILES` handling, and `transaction.atomic()` for rollback safety
- **Error handling:** Catch `KeyError` for missing `data`, catch exceptions from `save_relations`, return 400 with details
- **Schema organization:** Use separate `openapi.Schema` constants for nested structures (indicator_layers, context_layers, etc.) composed in `DashboardSerializer.Meta.post_body`

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
      request_body=DashboardSerializer.Meta.post_body,
      operation_description='Create a new dashboard.'
  )
  def create(self, request, *args, **kwargs):
      data = request.data.copy()
      try:
          data = DashboardForm.update_data(dict(data), user=request.user)
      except KeyError as e:
          return Response(
              {'detail': f'Missing required field: {str(e)}'},
              status=status.HTTP_400_BAD_REQUEST
          )
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
              try:
                  dashboard.save_relations(data, is_create=True)
              except Exception as e:
                  return Response(
                      {'detail': f'Failed to save dashboard relations: {str(e)}'},
                      status=status.HTTP_400_BAD_REQUEST
                  )
              dashboard.increase_version()
              serializer = DashboardSerializer(
                  dashboard, context=self.get_serializer_context()
              )
              return Response(serializer.data, status=status.HTTP_201_CREATED)
      return Response(dict(form.errors.items()), status=status.HTTP_400_BAD_REQUEST)
  ```
- Add imports: `from django.db import transaction`, `from geosight.data.forms.dashboard import DashboardForm`, `from geosight.data.serializer.dashboard import DashboardSerializer`, `from rest_framework import status`
- **Note:** Follows base class pattern with only dashboard-specific additions: `save_relations()` call and `increase_version()`. Includes `request.FILES` for icon upload and `transaction.atomic()` for rollback safety.

### 2. Update Swagger Documentation (post_body)
**File:** `django_project/geosight/data/serializer/dashboard.py`  
Add a comprehensive `post_body` schema to `DashboardSerializer.Meta` that documents all nested fields in detail, matching the actual payload structure used by the web UI. The payload expects a top-level `data` field containing dashboard configuration as a JSON string.

**Organization approach:** Define separate `openapi.Schema` constants for each major nested structure (indicator_layers, context_layers, basemaps_layers, widgets, filters, etc.) to keep the code readable, then compose them in `Meta.post_body`. Include `example` values based on the frontend's `Admin/Dashboard/Form` component.

**Key fields to document:**
- Top-level: `name`, `slug`, `description`, `overview`, `icon` (file), `group`, `reference_layer`, `extent` (bbox array), `min_zoom`, `max_zoom`, `geo_field`, `featured`, `show_splash_first_open`, `truncate_indicator_layer_name`, `layer_tabs_visibility`, `default_time_mode` (JSON), `show_map_toolbar`, `transparency_config` (JSON)
- Nested in `data` (JSON string): `indicator_layers` (array with style, label_config, etc.), `indicator_layers_structure`, `context_layers` (array with styles, configuration, etc.), `context_layers_structure`, `basemaps_layers` (array), `basemaps_layers_structure`, `widgets` (array), `widgets_structure`, `related_tables` (array), `filters` (JSON), `filters_allow_modify`, `filters_being_hidden`, `auto_zoom_to_filter`, `permission`, `tools`, `level_config`, `reference_layer`

**Do not** create a separate input serializer; reuse `DashboardForm` for validation as per existing pattern.

### 3. Add API Tests
**File:** `django_project/geosight/data/tests/api/v1/dashboard.py`  
Add test class `DashboardCreateApiTest` (or extend existing) with methods for the `create` action:

**Permission tests:**
- `test_anonymous_user_cannot_create` (expect 403/401)
- `test_viewer_cannot_create` (expect 403)
- `test_contributor_cannot_create` (expect 403) 
- `test_creator_can_create` (expect 201)

**Validation error tests:**
- `test_missing_name_returns_error` (POST without `name`)
- `test_missing_data_field_returns_error` (POST without `data` field → KeyError)
- `test_invalid_extent_returns_error` (invalid bbox in `data.extent` → ValueError)
- `test_missing_indicator_layers_structure_returns_error` (empty structure)
- `test_missing_context_layers_structure_returns_error`
- `test_missing_basemaps_layers_structure_returns_error`
- `test_missing_widgets_structure_returns_error`
- `test_slug_uniqueness_conflict` (Dashboard.name_is_exist_of_all returns True)

**Success test:**
- `test_creator_can_create_dashboard_with_valid_payload`:
  - Build minimal valid payload with `data` JSON string containing required structures
  - POST to `reverse('dashboards-list')`
  - Assert status 201, response contains dashboard data
  - Verify database: Dashboard record exists, `creator` and `modified_by` set to user
  - Verify `version_data` was updated (increase_version called)
  - Verify related objects created (indicator_layers, context_layers, etc.)
  - Verify post-save signal runs (cache permissions initialized)

**Error handling tests:**
- `test_save_relations_exception_returns_400` (mock save_relations to raise exception)

Use `self.client.post` with `format='multipart'` if including icon file. Use model factories to create prerequisite data (indicator, context_layer, etc.) for the payload.

### 4. Verify Rollback & Consistency
- `transaction.atomic()` ensures rollback on any exception (including from `save_relations`)
- `increase_version()` is called explicitly after save (Dashboard inherits `AbstractVersionData`)
- Post-save signal `dashboard_post_save` runs automatically (handles cache invalidation)
- Verify that `modified_by` is set correctly (via `AbstractEditData.save()`)

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
- Verify Swagger UI displays the `post_body` schema correctly with all nested fields and examples
- Test error scenarios: missing `data` (400), invalid extent (400), duplicate slug (400), save_relations failure (400)
- Confirm file upload works with icon image (multipart/form-data)

## Dependencies & Risks
- `DashboardForm.update_data` is a large transformation; must be called before form validation. It expects a `data` field (JSON string) and extracts nested structures.
- Swagger `post_body` definition will be large (~200-300 lines). Mitigate by organizing with separate constants for nested schemas.
- `save_relations` is complex and may raise exceptions; wrapped in try/except to return 400.
- Update/patch endpoints are still not available (would require similar complex handling).
- The `data` field structure is tightly coupled to the frontend's `Admin/Dashboard/Form` component; changes there require API updates.
- `increase_version()` is called explicitly; ensure it doesn't conflict with any signals (post_save also runs).