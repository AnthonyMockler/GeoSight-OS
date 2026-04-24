React source: app, store, pages, components, hooks, selectors, utils, workers

Structure:
app/ - App.jsx, routes, layout
class/ - Utility classes (e.g., DateTime, Storage)
components/ - Reusable UI (Map, Widgets, Charts, Forms)
contrib/ - Third-party component wrappers
hooks.tsx - Custom hooks (useDashboard, useMap, useConfig)
pages/ - Full-screen routes (Dashboard, Login, GeoRepoAuthFailed)
providers/ - React providers (Auth, I18n, Redux, Requests)
Requests.jsx - Centralized API client (axios instance)
selectors/ - Reselect memoized Redux selectors
store/ - Redux store (configureStore.js, dashboard/reducers/)
types/ - TypeScript interfaces (mirroring Django models)
utils/ - Formatters, validators, helpers
workers/ - Web workers for parallel processing

Conventions:
- Redux: reducers under store/dashboard/reducers/ (30+ domains)
- Pages: full-screen routes under pages/
- Components: reusable UI in components/, feature-specific in pages/
- Hooks: custom hooks for cross-cutting concerns (dashboard state, map access)
- Selectors: reselect memoized selectors for performance
- Types: TypeScript definitions mirror Django models

Anti-patterns:
- Don't fetch data in components (use Redux thunks)
- Don't use setState for global state (use Redux)
- Don't import from store directly (use hooks/selectors)

Unique styles:
- Massive Redux state: 30+ reducers for dashboard domains
- Map integration: MapLibre with custom layer types (context, indicator, related table)
- Widget system: dynamic component rendering based on indicator configuration
- Internationalization: i18next with backend language loading
- Drag-and-drop: @dnd-kit for reordering widgets

Commands:
- npm run dev (webpack-dev-server on localhost:3000)
- Hot module replacement (HMR) enabled

Gotchas:
- Mixed .jsx and .tsx - be consistent with existing files
- Redux state shape is complex - use selectors, not direct access
- Map components tightly coupled to MapLibre - test in E2E