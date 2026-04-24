Data layer: models, serializers, API for dashboards, indicators, context layers

Structure:
models/ - Django models split by domain (dashboard, indicator, context_layer, etc.)
serializer/ - DRF serializers for API
api/ - Django REST Framework viewsets (v1)
admin/ - Django admin configurations
forms/ - Django forms
utils/ - Utility functions
tasks/ - Celery tasks
tests/ - Unit and integration tests

Where to look:
Dashboard: models/dashboard/ (Dashboard, DashboardIndicatorLayer, DashboardContextLayer)
Indicators: models/indicator/ (Indicator, IndicatorLayer, IndicatorValue)
Context Layers: models/context_layer.py (ContextLayer, ContextLayerStyle)
Basemaps: models/basemap_layer.py
Related Tables: models/related_table.py
Serializers: serializer/ (DashboardSerializer, IndicatorValueSerializer, etc.)
API: api/v1/ (DashboardAPI, IndicatorAPI, ContextLayerAPI)
Admin: admin/ (Django admin configurations)

Conventions:
Models split by domain (dashboard, indicator, context_layer, style, etc.)
Indicator values stored in separate table with date dimension
Context layers can be raster or vector (GeoJSON, WMS, etc.)
Related tables allow SQL-like joins on geometry

Anti-patterns:
DEPRECATED: WidgetLegacy serializer (use Widget serializer)
DEPRECATED: IndicatorStyleBaseModel (migrate to new style system)
Avoid raw indicator value queries (use aggregated views)

Unique styles:
Model factories in tests/model_factories/ mirror all production models
Serializer classes often have corresponding model classes
API uses Django REST Framework viewsets with permission classes
Database setup: create_pg_trgm_extension() for fuzzy text search

Commands:
python manage.py load_demo_data (populates sample data)

Gotchas:
IndicatorValue model is huge (1000+ lines) - be careful with migrations
ContextLayer can reference external services (WMS, ArcGIS) - check configuration