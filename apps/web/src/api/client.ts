/**
 * Auto-generated API types and client factory.
 * Uses openapi-fetch for type-safe API calls.
 *
 * @example
 * import { createApiClient } from './client';
 *
 * const client = createApiClient({ baseUrl: 'http://localhost:3000' });
 * const { data, error } = await client.GET('/api/health');
 */

import createClient, { type ClientOptions } from "openapi-fetch";

export interface paths {
    "/api/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Health check
         * @description Returns the current health status of the API
         */
        get: operations["health.healthCheck"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/probe": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Probe
         * @description Returns a simple ok status for load balancers or uptime monitors
         */
        get: operations["health.probe"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        HealthCheckResponse: {
            /** @enum {string} */
            status: "ok" | "degraded" | "unhealthy";
            timestamp: string;
            version: string | null;
        };
        /** @description The request did not match the expected schema */
        HttpApiDecodeError: {
            issues: components["schemas"]["Issue"][];
            message: string;
            /** @enum {string} */
            _tag: "HttpApiDecodeError";
        };
        /** @description Represents an error encountered while parsing a value to match the schema */
        Issue: {
            /**
             * @description The tag identifying the type of parse issue
             * @enum {string}
             */
            _tag:
                | "Pointer"
                | "Unexpected"
                | "Missing"
                | "Composite"
                | "Refinement"
                | "Transformation"
                | "Type"
                | "Forbidden";
            /** @description The path to the property where the issue occurred */
            path: components["schemas"]["PropertyKey"][];
            /** @description A descriptive message explaining the issue */
            message: string;
        };
        PropertyKey:
            | string
            | number
            | {
                  /** @enum {string} */
                  _tag: "symbol";
                  key: string;
              };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    "health.healthCheck": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description HealthCheckResponse */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthCheckResponse"];
                };
            };
            /** @description The request did not match the expected schema */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HttpApiDecodeError"];
                };
            };
        };
    };
    "health.probe": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description HealthCheckResponse */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthCheckResponse"];
                };
            };
            /** @description The request did not match the expected schema */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HttpApiDecodeError"];
                };
            };
        };
    };
}

export type ApiClient = ReturnType<typeof createClient<paths>>;

export function createApiClient(options: ClientOptions) {
    return createClient<paths>(options);
}
