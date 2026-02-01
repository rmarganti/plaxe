# Plaxe - Automated per-user media deletion for Plex

## Commands

- `pnpm install` - Install dependencies
- `pnpm -r tsc --noEmit` - Typecheck all packages
- `pnpm --filter @plaxe/web generate:client` - Generate API client from OpenAPI
- `pnpm --filter @plaxe/web dev` - Start dev server on port 3000
- `pnpm --filter @plaxe/web test` - Run all tests (vitest)
- `pnpm --filter @plaxe/web test -- path/to/file.test.ts` - Run single test file

## Architecture

- **Monorepo** using pnpm workspaces
- **libs/api** (`@plaxe/api`) - Shared API contracts and layers
    - `contracts/` - HttpApi definitions (Effect Platform)
    - `layers/` - Live implementations of API handlers
- **apps/web** (`@plaxe/web`) - Frontend (React 19, TanStack Router/Start, Vite)
    - `src/api/` - Auto-generated OpenAPI types and client (openapi-fetch)

## Code Style

- **TypeScript** strict mode, ESM (`"type": "module"`), use `.js` in imports
- **Effect-TS** for functional patterns (Layer, HttpApi, HttpApiBuilder)
- Use `import type` for type-only imports (verbatimModuleSyntax)
- Strict null checks: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- 4-space indentation, single quotes preferred
