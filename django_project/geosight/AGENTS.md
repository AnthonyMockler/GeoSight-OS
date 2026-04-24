# GeoSight Application Agents Guide

Main GeoSight application containing data, permission, and integration modules

## Structure
Sub-apps: data, permission, reference_dataset, importer, georepo, cloud_native_gis, tenants, log, machine_info_fetcher

## Where to Look
- Core models: data/models/ (Dashboard, IndicatorLayer, ContextLayer, BasemapLayer)
- API endpoints: data/api/ (REST API v1)
- Permissions: permission/ (role-based access control)
- Importers: importer/ (data ingestion from spreadsheets, SharePoint)
- GeoRepo: georepo/ (external reference dataset integration)
- Cloud Native GIS: cloud_native_gis/ (COG/STAC support)

## Conventions
- Each sub-app is a Django app with models/, api/, tests/
- Models use Django ORM with PostGIS geometry fields
- API versioned under /api/v1/
- Serializers in data/serializer/

## Anti-Patterns
- DEPRECATED: WidgetLegacy serializer, IndicatorStyleBaseModel
- Avoid direct indicator value queries (use aggregated views)

## Unique Styles
- Model factories in tests/model_factories/ mirror production models
- Permission tests inherit from BasePermissionTest with 6 roles
- Management commands for data import/export

## Commands
- python manage.py load_demo_data, load_demo_data_default_dataset

## Gotchas
- IndicatorValue model is huge (1000+ lines) - be careful with migrations
- ContextLayer can reference external services (WMS, ArcGIS) - check configuration