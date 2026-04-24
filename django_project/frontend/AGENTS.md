# Frontend (React SPA)

React SPA with TypeScript, Redux, Material-UI, MapLibre; built with webpack

## Structure
- src/ - Source code (components, pages, store, etc.)
- static/ - Static assets (images, fonts) and compiled bundles
- templates/ - Django templates for server-side rendering
- tests/ - Test files (E2E with Playwright)
- bundles/ - Webpack output (dev and prod)
- locales/ - Translation files (i18next)

## Where to Look
- App entry: src/app/ (App.jsx, routes, providers)
- State: src/store/ (Redux store, 30+ dashboard reducers)
- Pages: src/pages/ (Dashboard, Login, Admin pages)
- Components: src/components/ (reusable UI, Map, Widgets)
- Hooks: src/hooks.tsx (custom React hooks)
- Utils: src/utils/ (formatters, validators, helpers)
- Types: src/types/ (TypeScript interfaces for all models)
- Workers: src/workers/ (web workers for heavy computation)

## Conventions
- Mixed .jsx and .tsx extensions (no strict rule)
- Redux: one reducer per dashboard domain
- Components: PascalCase; utilities: camelCase
- i18n: i18next with HTTP backend for translations
- Map: MapLibre GL JS with custom layers (deck.gl, Leaflet bridges)

## Anti-Patterns
- Don't mutate Redux state (always return new objects)
- Don't fetch data directly in components (use Redux thunks/selectors)
- Don't hardcode API URLs (use Requests.jsx)

## Unique Styles
- Dashboard state: massive Redux store with 30+ reducers
- Map integration: MapLibre with custom layer types (context, indicator, related table)
- Widget system: dynamic component loading based on indicator type
- Nunjucks templates: server-side rendering for some pages

## Commands
- npm run dev (webpack dev server)
- npm run build (production bundle)
- npm run lint (eslint src/**/*.jsx)

## Build
- webpack-bundle-tracker for Django integration
- Output to django_project/frontend/static/bundles/
- Source maps in dev, minified in prod