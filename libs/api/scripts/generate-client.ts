#!/usr/bin/env node --experimental-strip-types
/**
 * Generates an OpenAPI-compliant fetch-based client from the AppApi contract.
 *
 * This script:
 * 1. Converts the Effect-TS HttpApi to an OpenAPI 3.1.0 spec
 * 2. Generates TypeScript types using openapi-typescript
 * 3. Outputs types that can be used with openapi-fetch
 *
 * Usage: pnpm --filter @plaxe/shared-api generate:client
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';
import { OpenApi } from '@effect/platform';
import { AppApi } from '../src/contracts/app-api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../src');

async function main() {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Generate OpenAPI spec from Effect-TS HttpApi
    const spec = OpenApi.fromApi(AppApi);

    // Write OpenAPI spec to file (useful for debugging and external tools)
    const specPath = path.join(OUTPUT_DIR, 'openapi.json');
    fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
    console.log(`✓ Generated OpenAPI spec: ${specPath}`);

    // Generate TypeScript types from the OpenAPI spec
    const ast = await openapiTS(spec as any);
    const typesContent = astToString(ast);

    // Generate single file with types and client
    const clientCode = `/**
 * Auto-generated API types and client factory.
 * Uses openapi-fetch for type-safe API calls.
 *
 * @example
 * import { createApiClient } from '@plaxe/shared-api/generated';
 *
 * const client = createApiClient({ baseUrl: 'http://localhost:3000' });
 * const { data, error } = await client.GET('/api/health');
 */

import createClient, { type ClientOptions } from 'openapi-fetch';

${typesContent}

export type ApiClient = ReturnType<typeof createClient<paths>>;

export function createApiClient(options: ClientOptions) {
    return createClient<paths>(options);
}
`;

    const clientPath = path.join(OUTPUT_DIR, 'client.ts');
    fs.writeFileSync(clientPath, clientCode);
    console.log(`✓ Generated client: ${clientPath}`);

    console.log('\nDone! Install openapi-fetch to use the client:');
    console.log('  pnpm add openapi-fetch');
}

main().catch((err) => {
    console.error('Failed to generate client:', err);
    process.exit(1);
});
