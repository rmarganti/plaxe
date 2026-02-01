# Plaxe - Automated per-user media deletion for Plex

## Commands
- `pnpm install` - Install dependencies
- `pnpm -r tsc --noEmit` - Typecheck all packages
- `pnpm --filter @plaxe/shared-api generate:client` - Generate API client from OpenAPI

## Architecture
- **Monorepo** using pnpm workspaces
- **libs/api** (`@plaxe/shared-api`) - Shared API contracts, layers, and generated client
  - `contracts/` - HttpApi definitions (Effect Platform)
  - `layers/` - Live implementations of API handlers
  - `generated/` - Auto-generated OpenAPI types and client

## Code Style
- **TypeScript** with strict mode, ESM modules (`"type": "module"`)
- **Effect-TS** for functional programming patterns (Layer, HttpApi, HttpApiBuilder)
- Use `.js` extension in imports (ESM requirement)
- Use `import type` for type-only imports (verbatimModuleSyntax enabled)
- Strict null checks: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- 4-space indentation, single quotes preferred
